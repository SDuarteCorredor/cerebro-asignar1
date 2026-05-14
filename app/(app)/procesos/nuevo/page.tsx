import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import FormularioProceso from '../FormularioProceso'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export default async function PaginaNuevoProceso({ searchParams }: { searchParams: Promise<{ gestion?: string }> }) {
  const { gestion: gestionId } = await searchParams
  const supabase = await crearClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  if (sesion.rol === 'colaborador') redirect('/dashboard')

  const { data: gestiones } = await supabase
    .from('gestiones').select('id, nombre').eq('activa', true).order('nombre')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Nuevo proceso' }]} />
      <main className="page page--narrow fade-up">
        <FormularioProceso
          gestiones={gestiones ?? []}
          gestionIdInicial={gestionId ?? sesion.gestion_id ?? ''}
          rol={sesion.rol}
        />
      </main>
    </>
  )
}
