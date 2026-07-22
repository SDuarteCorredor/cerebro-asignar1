import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'
import { calcularPonderado, badgePct } from '@/lib/comites/puntaje'

interface Props {
  usuarioId: string
  gestionId: string | null
}

/** Mis compromisos vivos + mi puntaje del año en la gestión. */
export default async function MiComites({ usuarioId, gestionId }: Props) {
  if (!gestionId) return null
  const supabase = await crearClienteServidor()

  // Comité más reciente de mi gestión (abierto de preferencia)
  const { data: comites } = await supabase
    .from('comites')
    .select('id, fecha, semana_iso, anio, titulo, cerrado')
    .eq('gestion_id', gestionId)
    .order('fecha', { ascending: false })
    .limit(1)
  const ultimo = comites?.[0]

  // Mis compromisos abiertos (pendiente/reportado) en la gestión
  const { data: misCompromisos } = await supabase
    .from('compromisos')
    .select('id, descripcion, fecha_limite, estado, impacto, comite_origen_id')
    .eq('responsable_id', usuarioId)
    .in('estado', ['pendiente', 'reportado'])
    .order('fecha_limite', { ascending: true, nullsFirst: false })
    .limit(5)

  // Puntaje del año: promedio ponderado de mis compromisos evaluados en el año actual
  const anioActual = new Date().getFullYear()
  const { data: comitesAnio } = await supabase
    .from('comites').select('id').eq('gestion_id', gestionId).eq('anio', anioActual)
  const comitesAnioIds = (comitesAnio ?? []).map(c => c.id)
  let pctAnual: number | null = null
  let evaluados = 0
  if (comitesAnioIds.length > 0) {
    const { data: mios } = await supabase
      .from('compromisos').select('estado, impacto')
      .eq('responsable_id', usuarioId)
      .in('comite_origen_id', comitesAnioIds)
    const stats = calcularPonderado(mios ?? [])
    pctAnual = stats.pctPonderado
    evaluados = stats.evaluados
  }

  const sinContenido = (!misCompromisos || misCompromisos.length === 0) && evaluados === 0
  if (sinContenido) return null

  const badgeImpacto: Record<string, string> = { alto: 'badge--danger', medio: 'badge--warning', bajo: 'badge--neutral' }

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Mis comités</h2>
        {ultimo && (
          <Link href={`/comites/${ultimo.id}`} className="btn btn--ghost btn--sm">
            W{ultimo.semana_iso}/{ultimo.anio} <Icono nombre="arrowRight" className="icon icon--sm" />
          </Link>
        )}
      </div>

      <div className="dash-comites">
        {pctAnual !== null && (
          <div className="card dash-comites__ring">
            <span className={`badge badge--no-dot ${badgePct(pctAnual)}`}>{pctAnual}%</span>
            <div>
              <div className="dash-comites__pct-label">Cumplimiento anual</div>
              <div className="text-xs text-muted">{evaluados} compromisos evaluados en {anioActual}</div>
            </div>
          </div>
        )}

        {misCompromisos && misCompromisos.length > 0 && (
          <div className="card dash-comites__lista">
            <div className="dash-comites__lista-cab">
              <span className="text-sm font-semibold">Mis compromisos abiertos</span>
              <span className="text-xs text-muted">{misCompromisos.length}</span>
            </div>
            {misCompromisos.map(c => (
              <Link key={c.id} href={`/comites/${c.comite_origen_id}`} className="dash-comites__fila">
                <span className={`badge badge--no-dot ${badgeImpacto[c.impacto ?? 'medio'] ?? 'badge--neutral'}`} style={{ fontSize: 10.5 }}>
                  {c.impacto ?? 'medio'}
                </span>
                <span className="dash-comites__desc">{c.descripcion}</span>
                {c.fecha_limite && (
                  <span className="text-xs text-muted text-mono">
                    {new Date(c.fecha_limite).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                )}
                {c.estado === 'reportado' && (
                  <span className="badge badge--no-dot badge--primary" style={{ fontSize: 10.5 }}>Reportado</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
