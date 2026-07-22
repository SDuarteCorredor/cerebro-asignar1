import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'
import { hoyISO, diasHasta } from '@/lib/documentos/vigencia'

/** KPI del ciclo de desempeño activo (solo si hay uno en captura).
 *  Muestra cobertura (respondidos / total) + días restantes para cerrar. */
export default async function KPICicloActivo() {
  const supabase = await crearClienteServidor()
  const hoy = hoyISO()

  // Ciclo con captura abierta hoy
  const { data: ciclos } = await supabase
    .from('ciclos_evaluacion')
    .select('id, nombre, fecha_fin_captura, fecha_inicio_captura')
    .lte('fecha_inicio_captura', hoy)
    .gte('fecha_fin_captura', hoy)
    .order('fecha_fin_captura', { ascending: true })
    .limit(1)

  const ciclo = ciclos?.[0]
  if (!ciclo) return null

  // Evaluaciones del ciclo + planes (evaluador → estado)
  const { data: evaluaciones } = await supabase
    .from('evaluaciones').select('id').eq('ciclo_id', ciclo.id)
  const evalIds = (evaluaciones ?? []).map(e => e.id)
  if (evalIds.length === 0) return null

  const [{ count: totalPlanes }, { count: respondidos }] = await Promise.all([
    supabase.from('plan_evaluacion').select('id', { count: 'exact', head: true }).in('evaluacion_id', evalIds),
    supabase.from('plan_evaluacion').select('id', { count: 'exact', head: true }).in('evaluacion_id', evalIds).eq('estado', 'Respondida'),
  ])

  const total = totalPlanes ?? 0
  const resp = respondidos ?? 0
  const pct = total > 0 ? Math.round((resp / total) * 100) : 0
  const dias = diasHasta(ciclo.fecha_fin_captura, hoy)

  const color =
    pct >= 80 ? 'var(--success)' :
    pct >= 50 ? 'var(--warning)' : 'var(--danger)'
  const badgeDias =
    dias <= 3 ? 'badge--danger' :
    dias <= 7 ? 'badge--warning' : 'badge--neutral'

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Ciclo de desempeño en curso</h2>
        <Link href={`/desempeno/ciclos/${ciclo.id}`} className="btn btn--ghost btn--sm">
          Detalle del ciclo <Icono nombre="arrowRight" className="icon icon--sm" />
        </Link>
      </div>
      <div className="card dash-ciclo">
        <div className="dash-ciclo__cabecera">
          <div>
            <div className="page__eyebrow" style={{ margin: 0 }}>{ciclo.nombre}</div>
            <div className="text-xs text-muted" style={{ marginTop: 4 }}>
              Cierre: {new Date(ciclo.fecha_fin_captura).toLocaleDateString('es-CO')}
            </div>
          </div>
          <span className={`badge badge--no-dot ${badgeDias}`}>
            {dias <= 0 ? 'Cierra hoy' : `${dias} ${dias === 1 ? 'día' : 'días'}`}
          </span>
        </div>
        <div className="dash-ciclo__cobertura">
          <div className="dash-ciclo__pct" style={{ color }}>{pct}%</div>
          <div className="dash-ciclo__label">
            <div className="text-sm font-semibold">Cobertura de captura</div>
            <div className="text-xs text-muted">{resp} de {total} cuestionarios respondidos</div>
          </div>
        </div>
        <div className="dash-ciclo__barra">
          <div className="dash-ciclo__barra-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </section>
  )
}
