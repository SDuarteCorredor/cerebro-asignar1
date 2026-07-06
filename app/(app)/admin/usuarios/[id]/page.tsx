import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import ClienteEditorUsuario from './ClienteEditorUsuario'
import { obtenerIniciales } from '@/lib/sesion'
import type { SesionUsuario, Rol } from '@/types'

export default async function PaginaEditarUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const [{ data: usuario }, { data: cargos }, { data: posiblesJefes }, { data: gestiones }] = await Promise.all([
    supabase.from('usuarios').select('*').eq('id', id).single(),
    supabase.from('cargos').select('id, nombre, banda').order('nombre'),
    supabase.from('usuarios')
      .select('id, nombre, codigo_contrato, cargo_id')
      .eq('activo', true)
      .neq('id', id) // no puede ser su propio jefe
      .order('nombre'),
    supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre'),
  ])

  if (!usuario) notFound()

  return (
    <>
      <Topbar
        usuario={sesion}
        migas={[
          { etiqueta: 'Gestionar Usuarios', href: '/admin/usuarios' },
          { etiqueta: usuario.nombre },
        ]}
      />
      <main className="page page--narrow fade-up">
        <ClienteEditorUsuario
          usuario={usuario}
          cargos={cargos ?? []}
          posiblesJefes={posiblesJefes ?? []}
          gestiones={gestiones ?? []}
        />
      </main>
    </>
  )
}
