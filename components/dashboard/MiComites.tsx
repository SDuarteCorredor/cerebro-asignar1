import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'
import { calcularPonderado, badgePct, pesoDe, semanaISOde } from '@/lib/comites/puntaje'

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

  // Puntaje del año y ranking dentro de la gestión: se trae la data de toda la gestión
  // (no solo del usuario) para calcular posición y delta semanal en el mismo pass.
  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const { semana: semanaActual } = semanaISOde(hoy)
  const { data: comitesAnio } = await supabase
    .from('comites').select('id, semana_iso').eq('gestion_id', gestionId).eq('anio', anioActual)
  const comitesAnioIds = (comitesAnio ?? []).map(c => c.id)
  const semanaPorComite = new Map((comitesAnio ?? []).map(c => [c.id, c.semana_iso]))

  let pctAnual: number | null = null
  let evaluados = 0
  let posicion: number | null = null
  let totalRanking = 0
  let deltaSemana = 0
  let misPuntos = 0

  if (comitesAnioIds.length > 0) {
    const { data: todos } = await supabase
      .from('compromisos').select('responsable_id, comite_origen_id, estado, impacto')
      .in('comite_origen_id', comitesAnioIds)

    const porPersona = new Map<string, { estado: string; impacto: string }[]>()
    for (const c of todos ?? []) {
      const arr = porPersona.get(c.responsable_id) ?? []
      arr.push({ estado: c.estado, impacto: c.impacto })
      porPersona.set(c.responsable_id, arr)
      if (c.responsable_id === usuarioId && c.estado === 'cumplido'
          && semanaPorComite.get(c.comite_origen_id) === semanaActual) {
        deltaSemana += pesoDe(c.impacto)
      }
    }
    const ranking = Array.from(porPersona.entries())
      .map(([uid, comps]) => ({ uid, r: calcularPonderado(comps) }))
      .sort((a, b) => b.r.pesoCumplido - a.r.pesoCumplido || (b.r.pctPonderado ?? -1) - (a.r.pctPonderado ?? -1))

    totalRanking = ranking.length
    const idx = ranking.findIndex(x => x.uid === usuarioId)
    if (idx >= 0) {
      posicion = idx + 1
      pctAnual = ranking[idx].r.pctPonderado
      evaluados = ranking[idx].r.evaluados
      misPuntos = ranking[idx].r.pesoCumplido
    }
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
            <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span className={`badge badge--no-dot ${badgePct(pctAnual)}`}>{pctAnual}%</span>
              {posicion !== null && totalRanking > 1 && (
                <Link href="/comites/ranking" className="dash-comites__pos" title="Ver ranking completo">
                  #{posicion} <span className="text-muted">de {totalRanking}</span>
                </Link>
              )}
            </div>
            <div>
              <div className="dash-comites__pct-label">Cumplimiento anual</div>
              <div className="text-xs text-muted">
                {misPuntos} pts · {evaluados} evaluados en {anioActual}
                {deltaSemana > 0 && (
                  <span className="dash-comites__delta"> · +{deltaSemana} esta semana</span>
                )}
              </div>
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
