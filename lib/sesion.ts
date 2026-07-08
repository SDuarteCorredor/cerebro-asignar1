import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import type { SesionUsuario, Rol } from '@/types'

export function obtenerIniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

/** Nombre para saludar: usa el preferido si existe; si no, la última palabra del
 *  nombre (los nombres del Excel vienen "APELLIDO APELLIDO NOMBRE"), en Title Case. */
export function nombreSaludo(nombre: string, nombrePreferido: string | null): string {
  if (nombrePreferido && nombrePreferido.trim()) return nombrePreferido.trim()
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const base = partes[partes.length - 1] ?? nombre
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase()
}

export async function obtenerSesion(): Promise<SesionUsuario> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, nombre_preferido, correo, rol, gestion_id')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  return {
    id: perfil.id,
    nombre: perfil.nombre,
    nombre_preferido: perfil.nombre_preferido ?? null,
    saludo: nombreSaludo(perfil.nombre, perfil.nombre_preferido ?? null),
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
