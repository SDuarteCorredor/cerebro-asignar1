import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FilaAprobacion, { type SolicitudPendiente } from './FilaAprobacion'

export const metadata = { title: 'Aprobaciones de ausencias · Cerebro Asignar' }

interface AusenciaRow {
  id: string
  solicitante_id: string
  tipo_id: string
  fecha_desde: string
  fecha_hasta: string
  horario: string
  horario_detalle: string | null
  observaciones: string | null
  diligencia_detalle: string | null
  soporte_path: string | null
  estado: string
}

export default async function BandejaAusencias() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  // Pendientes donde soy jefe directo (1er nivel)
  const { data: nivel1 } = await supabase
    .from('ausencias')
    .select('id, solicitante_id, tipo_id, fecha_desde, fecha_hasta, horario, horario_detalle, observaciones, diligencia_detalle, soporte_path, estado')
    .eq('jefe_id', sesion.id).eq('estado', 'pendiente_jefe')
    .order('fecha_desde')

  // Pendientes de 2ª validación (solo TH/admin)
  const { data: nivel2 } = esAdmin
    ? await supabase
        .from('ausencias')
        .select('id, solicitante_id, tipo_id, fecha_desde, fecha_hasta, horario, horario_detalle, observaciones, diligencia_detalle, soporte_path, estado')
        .eq('estado', 'pendiente_segundo').order('fecha_desde')
    : { data: [] as AusenciaRow[] }

  const todas = [...(nivel1 ?? []), ...(nivel2 ?? [])] as AusenciaRow[]
  const tipoIds = Array.from(new Set(todas.map(a => a.tipo_id)))
  const solicitanteIds = Array.from(new Set(todas.map(a => a.solicitante_id)))

  const [{ data: tipos }, { data: personas }] = await Promise.all([
    tipoIds.length > 0
      ? supabase.from('tipos_ausencia').select('id, nombre, requiere_doble_validacion').in('id', tipoIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; requiere_doble_validacion: boolean }[] }),
    solicitanteIds.length > 0
      ? supabase.from('directorio_usuarios').select('id, nombre, cargo_id').in('id', solicitanteIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; cargo_id: string | null }[] }),
  ])
  const mapTipo = new Map((tipos ?? []).map(t => [t.id, t]))
  const mapPersona = new Map((personas ?? []).map(p => [p.id, p.nombre]))

  const aFila = (a: AusenciaRow): SolicitudPendiente => ({
    id: a.id,
    solicitante: mapPersona.get(a.solicitante_id) ?? '—',
    tipo: mapTipo.get(a.tipo_id)?.nombre ?? '—',
    dobleValidacion: mapTipo.get(a.tipo_id)?.requiere_doble_validacion ?? false,
    fecha_desde: a.fecha_desde,
    fecha_hasta: a.fecha_hasta,
    horario: a.horario,
    horario_detalle: a.horario_detalle,
    observaciones: a.observaciones,
    diligencia_detalle: a.diligencia_detalle,
    soporte_path: a.soporte_path,
    nivel: a.estado === 'pendiente_segundo' ? 2 : 1,
  })

  const filasN1 = (nivel1 ?? []).map(aFila)
  const filasN2 = (nivel2 ?? []).map(aFila)

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Ausencias', href: '/ausencias' },
        { etiqueta: 'Aprobaciones' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div className="page__eyebrow">Bandeja</div>
            <h1 className="page__title">Aprobaciones de ausencias</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Solicitudes de permiso de tu equipo pendientes de tu aprobación.
            </p>
          </div>
          <Link href="/ausencias" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Mis solicitudes
          </Link>
        </div>

        {/* Nivel 1: como jefe */}
        <section style={{ marginBottom: 28 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Pendientes de tu aprobación</div>
            <span className="section-count">{filasN1.length}</span>
          </div>
          {filasN1.length === 0 ? (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No tienes solicitudes pendientes por aprobar.
            </div>
          ) : (
            <div className="vstack" style={{ gap: 10 }}>
              {filasN1.map(f => <FilaAprobacion key={f.id} s={f} />)}
            </div>
          )}
        </section>

        {/* Nivel 2: TH */}
        {esAdmin && (
          <section>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div className="page__eyebrow" style={{ margin: 0 }}>Segunda validación (Talento Humano)</div>
              <span className="section-count">{filasN2.length}</span>
            </div>
            {filasN2.length === 0 ? (
              <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No hay solicitudes esperando segunda validación.
              </div>
            ) : (
              <div className="vstack" style={{ gap: 10 }}>
                {filasN2.map(f => <FilaAprobacion key={f.id} s={f} />)}
              </div>
            )}
          </section>
        )}
      </main>
    </>
  )
}
