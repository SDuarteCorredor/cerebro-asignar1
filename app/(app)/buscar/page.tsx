import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import ClienteBusqueda from './ClienteBusqueda'

export default async function PaginaBusqueda({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  // Cargar todos los procesos visibles con sus pasos y gestión
  const puedeVerBorradores = sesion.rol !== 'colaborador'
  let query = supabase
    .from('procesos')
    .select(`
      id, nombre, objetivo, version, fecha_actualizacion, estado,
      gestion:gestiones(id, nombre, icono, color_soft, color_primary),
      pasos(descripcion, cargo_responsable)
    `)
    .order('nombre')

  if (!puedeVerBorradores) query = query.eq('estado', 'activo')

  const { data: procesosRaw } = await query
  const procesos = (procesosRaw ?? []).map(p => ({
    id: p.id as string,
    nombre: p.nombre as string,
    objetivo: p.objetivo as string,
    version: p.version as string,
    fecha_actualizacion: p.fecha_actualizacion as string,
    estado: p.estado as string,
    gestion: Array.isArray(p.gestion) ? (p.gestion[0] ?? null) : p.gestion as { id: string; nombre: string; icono: string; color_soft: string; color_primary: string } | null,
    pasos: (p.pasos ?? []) as { descripcion: string; cargo_responsable: string }[],
  }))

  const { data: gestiones } = await supabase
    .from('gestiones').select('id, nombre').eq('activa', true).order('nombre')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Buscar' }]} mostrarBuscar={false} />
      <main className="page fade-up">
        <ClienteBusqueda
          procesos={procesos}
          gestiones={gestiones ?? []}
          consultaInicial={q ?? ''}
          puedeCrear={sesion.rol !== 'colaborador'}
        />
      </main>
    </>
  )
}
