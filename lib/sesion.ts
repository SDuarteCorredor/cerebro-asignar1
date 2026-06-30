import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import type { SesionUsuario, Rol } from '@/types'

export function obtenerIniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export async function obtenerSesion(): Promise<SesionUsuario> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, gestion_id')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  return {
    id: perfil.id,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol as Rol,
    gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }
}

export async function obtenerSesionAdmin(): Promise<SesionUsuario> {
  const sesion = await obtenerSesion()
  if (sesion.rol !== 'admin') redirect('/dashboard')
  return sesion
}
