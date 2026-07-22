import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'

interface Props {
  usuarioId: string
}

/** PDI vigente del propio usuario, con % de avance promedio y próxima revisión. */
export default async function MiPDI({ usuarioId }: Props) {
  const supabase = await crearClienteServidor()

  // Buscar el PDI vigente del usuario a través de su evaluación
  const { data: evaluaciones } = await supabase
    .from('evaluaciones').select('id, ciclo_id')
    .eq('colaborador_id', usuarioId)
  const evalIds = (evaluaciones ?? []).map(e => e.id)
  if (evalIds.length === 0) return null

  const { data: pdis } = await supabase
    .from('pdi')
    .select('id, estado, fecha_acuerdo, proxima_revision, evaluacion_id')
    .in('evaluacion_id', evalIds)
    .in('estado', ['vigente', 'en_firma'])
    .order('fecha_acuerdo', { ascending: false })
    .limit(1)
  const pdi = pdis?.[0]
  if (!pdi) return null

  // Acciones y su avance
  const { data: acciones } = await supabase
    .from('pdi_acciones').select('id').eq('pdi_id', pdi.id)
  const accIds = (acciones ?? []).map(a => a.id)

  let avancePromedio = 0
  if (accIds.length > 0) {
    const { data: seg } = await supabase
      .from('pdi_seguimiento_mensual').select('pdi_accion_id, avance_pct')
      .in('pdi_accion_id', accIds)
    const ultimoPorAcc = new Map<string, number>()
    for (const s of seg ?? []) ultimoPorAcc.set(s.pdi_accion_id, s.avance_pct)
    const avances = accIds.map(id => ultimoPorAcc.get(id) ?? 0)
    avancePromedio = Math.round(avances.reduce((a, b) => a + b, 0) / avances.length)
  }

  const color =
    avancePromedio >= 80 ? 'var(--success)' :
    avancePromedio >= 50 ? 'var(--warning)' : 'var(--danger)'

  const estadoEs = pdi.estado === 'vigente' ? 'Vigente' : 'En firma'
  const badgeClase = pdi.estado === 'vigente' ? 'badge--success' : 'badge--warning'

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Mi plan de desarrollo</h2>
        <Link href={`/desempeno/evaluaciones/${pdi.evaluacion_id}/pdi`} className="btn btn--ghost btn--sm">
          Abrir <Icono nombre="arrowRight" className="icon icon--sm" />
        </Link>
      </div>
      <div className="card dash-pdi">
        <div className="dash-pdi__cabecera">
          <span className={`badge badge--no-dot ${badgeClase}`}>{estadoEs}</span>
          <span className="text-xs text-muted">
            Próxima revisión: {new Date(pdi.proxima_revision).toLocaleDateString('es-CO')}
          </span>
        </div>
        <div className="dash-pdi__ring">
          <div className="dash-pdi__pct" style={{ color }}>{avancePromedio}%</div>
          <div className="dash-pdi__label">avance promedio</div>
          <div className="dash-pdi__barra">
            <div className="dash-pdi__barra-fill" style={{ width: `${avancePromedio}%`, background: color }} />
          </div>
        </div>
        <div className="dash-pdi__acciones-count">
          <Icono nombre="target" className="icon icon--sm" />
          {accIds.length} {accIds.length === 1 ? 'acción de desarrollo' : 'acciones de desarrollo'}
        </div>
      </div>
    </section>
  )
}
