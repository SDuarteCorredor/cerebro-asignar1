import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import NavAdmin from '../NavAdmin'
import ClienteAprobaciones from './ClienteAprobaciones'

export default async function AdminAprobaciones() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: aprobacionesRaw } = await supabase
    .from('procesos')
    .select(`
      id, nombre, objetivo, version, created_at,
      gestion:gestiones(id, nombre),
      creado_por_usuario:usuarios!procesos_creado_por_fkey(id, nombre)
    `)
    .eq('estado', 'en_revision')
    .order('created_at', { ascending: true })

  // Supabase devuelve relaciones como arrays; normalizamos a objetos singulares
  const aprobaciones = (aprobacionesRaw ?? []).map(a => ({
    id: a.id as string,
    nombre: a.nombre as string,
    objetivo: a.objetivo as string,
    version: a.version as string,
    created_at: a.created_at as string,
    gestion: Array.isArray(a.gestion) ? (a.gestion[0] ?? null) : a.gestion as { id: string; nombre: string } | null,
    creado_por_usuario: Array.isArray(a.creado_por_usuario) ? (a.creado_por_usuario[0] ?? null) : a.creado_por_usuario as { id: string; nombre: string } | null,
  }))

  const [
    { count: totalAprobaciones },
    { count: totalGestiones },
    { count: totalUsuarios },
  ] = await Promise.all([
    supabase.from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision'),
    supabase.from('gestiones').select('id', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('usuarios').select('id', { count: 'exact', head: true }),
  ])

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Aprobaciones' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Panel de Administración</h1>
            <p className="page__subtitle">Configura las Gestiones, gestiona usuarios y aprueba el contenido enviado por los Líderes.</p>
          </div>
        </div>

        <NavAdmin activa="aprobaciones" aprobacionesPendientes={totalAprobaciones ?? 0} totalGestiones={totalGestiones ?? 0} totalUsuarios={totalUsuarios ?? 0} />

        <ClienteAprobaciones aprobaciones={aprobaciones ?? []} adminId={sesion.id} adminNombre={sesion.nombre} />
      </main>
    </>
  )
}
