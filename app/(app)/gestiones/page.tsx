import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import ClienteGestiones, { type FilaGestion } from './ClienteGestiones'

export default async function PaginaGestiones() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: gestiones } = await supabase
    .from('gestiones')
    .select(`
      id, nombre, descripcion, icono, color_soft, color_primary,
      lider:usuarios!gestiones_lider_id_fkey(id, nombre),
      procesos_activos:procesos(count)
    `)
    .eq('activa', true)
    .eq('procesos.estado', 'activo')
    .order('nombre')

  const filas: FilaGestion[] = (gestiones ?? []).map(g => {
    const liderRaw = g.lider as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
    return {
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion,
      icono: g.icono,
      color_soft: g.color_soft,
      color_primary: g.color_primary,
      lider: Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw,
      activos: (g.procesos_activos as { count: number }[])?.[0]?.count ?? 0,
    }
  })

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Procesos y Procedimientos' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Repositorio</div>
            <h1 className="page__title">Procesos y Procedimientos</h1>
            <p className="page__subtitle">Selecciona una Gestión para ver sus procesos documentados.</p>
          </div>
        </div>

        <ClienteGestiones gestiones={filas} />
      </main>
    </>
  )
}
