import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { calcularPonderado, colorPct, badgePct, pesoDe, semanaISOde, numSemanasISO } from '@/lib/comites/puntaje'
import HeatmapSemanal, { type CeldaSemana } from '../HeatmapSemanal'

type Ventana = 'semana' | 'mes' | 'anio'
const VENTANAS: { clave: Ventana; label: string }[] = [
  { clave: 'semana', label: 'Semana' },
  { clave: 'mes', label: 'Mes' },
  { clave: 'anio', label: 'Año' },
]

export default async function RankingComites({ searchParams }: {
  searchParams: Promise<{ anio?: string; ventana?: string }>
}) {
  const sesion = await obtenerSesion()
  const { anio: anioParam, ventana: ventanaParam } = await searchParams
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const { semana: semanaActual } = semanaISOde(hoy)
  const mesActual = hoy.getMonth() + 1
  const anio = anioParam ? parseInt(anioParam, 10) : anioActual
  const ventana: Ventana = (['semana', 'mes', 'anio'] as const).includes(ventanaParam as Ventana)
    ? (ventanaParam as Ventana) : 'anio'

  // Todos los comités del año (la comparativa necesita todas las gestiones; heatmap y delta necesitan todo el año)
  const { data: comitesAnio } = await supabase
    .from('comites').select('id, gestion_id, anio, semana_iso, fecha').eq('anio', anio)
  const { data: aniosRaw } = await supabase.from('comites').select('anio')
  const aniosDisponibles = Array.from(new Set([anioActual, ...(aniosRaw ?? []).map(a => a.anio)])).sort((a, b) => b - a)

  const comiteIds = (comitesAnio ?? []).map(c => c.id)
  const comiteInfo = new Map((comitesAnio ?? []).map(c => [c.id, { gestion_id: c.gestion_id, semana: c.semana_iso, fecha: c.fecha }]))
  const gestionIds = Array.from(new Set((comitesAnio ?? []).map(c => c.gestion_id)))

  const { data: compromisos } = comiteIds.length > 0
    ? await supabase.from('compromisos')
        .select('comite_origen_id, responsable_id, estado, impacto')
        .in('comite_origen_id', comiteIds)
    : { data: [] as { comite_origen_id: string; responsable_id: string; estado: string; impacto: string }[] }

  const responsableIds = Array.from(new Set((compromisos ?? []).map(c => c.responsable_id)))
  const [{ data: gestiones }, { data: usuarios }] = await Promise.all([
    gestionIds.length > 0
      ? supabase.from('gestiones').select('id, nombre').in('id', gestionIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    responsableIds.length > 0
      ? supabase.from('usuarios').select('id, nombre, gestion_id').in('id', responsableIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; gestion_id: string | null }[] }),
  ])
  const mapGestion = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const mapUsuario = new Map((usuarios ?? []).map(u => [u.id, u.nombre]))

  // ¿Qué comités entran según la ventana de tiempo?
  const entraEnVentana = (comiteId: string): boolean => {
    const info = comiteInfo.get(comiteId)
    if (!info) return false
    if (ventana === 'anio') return true
    if (ventana === 'semana') return info.semana === semanaActual
    if (ventana === 'mes') return parseInt((info.fecha ?? '').slice(5, 7), 10) === mesActual
    return true
  }

  const compsVentana = (compromisos ?? []).filter(c => entraEnVentana(c.comite_origen_id))

  // --- Comparativa entre gestiones (según ventana) ---
  const compsPorGestion = new Map<string, { estado: string; impacto: string }[]>()
  const porGestionPersona = new Map<string, Map<string, { estado: string; impacto: string }[]>>()
  for (const comp of compsVentana) {
    const gid = comiteInfo.get(comp.comite_origen_id)?.gestion_id
    if (!gid) continue
    const fila = { estado: comp.estado, impacto: comp.impacto }
    const g = compsPorGestion.get(gid) ?? []
    g.push(fila); compsPorGestion.set(gid, g)
    const personas = porGestionPersona.get(gid) ?? new Map()
    const p = personas.get(comp.responsable_id) ?? []
    p.push(fila); personas.set(comp.responsable_id, p)
    porGestionPersona.set(gid, personas)
  }

  // --- Delta: puntos ganados en la semana ISO actual, por persona (solo en el año en curso) ---
  const deltaPorPersona = new Map<string, number>()
  if (anio === anioActual) {
    for (const comp of compromisos ?? []) {
      if (comiteInfo.get(comp.comite_origen_id)?.semana !== semanaActual) continue
      if (comp.estado !== 'cumplido') continue
      deltaPorPersona.set(comp.responsable_id, (deltaPorPersona.get(comp.responsable_id) ?? 0) + pesoDe(comp.impacto))
    }
  }

  const comparativa = gestionIds
    .map(gid => ({ gestion_id: gid, nombre: mapGestion.get(gid) ?? '—', r: calcularPonderado(compsPorGestion.get(gid) ?? []) }))
    .sort((a, b) => (b.r.pctPonderado ?? -1) - (a.r.pctPonderado ?? -1))

  const gestionesEscalafon = esAdmin ? gestionIds : gestionIds.filter(gid => gid === sesion.gestion_id)
  const escalafones = gestionesEscalafon.map(gid => {
    const personas = porGestionPersona.get(gid) ?? new Map()
    const filas = Array.from(personas.entries())
      .map(([uid, comps]) => {
        const r = calcularPonderado(comps as { estado: string; impacto: string }[])
        return {
          usuario_id: uid as string,
          nombre: mapUsuario.get(uid as string) ?? '—',
          puntos: r.pesoCumplido, pct: r.pctPonderado, cumplidos: r.cumplidos, total: r.total,
          delta: deltaPorPersona.get(uid as string) ?? 0,
        }
      })
      .sort((a, b) => b.puntos - a.puntos || (b.pct ?? -1) - (a.pct ?? -1))
    return { gestion_id: gid, nombre: mapGestion.get(gid) ?? '—', filas }
  }).filter(e => e.filas.length > 0)

  // --- Heatmap personal del usuario (año completo, independiente de la ventana) ---
  const misCompsPorSemana = new Map<number, { estado: string; impacto: string }[]>()
  for (const comp of compromisos ?? []) {
    if (comp.responsable_id !== sesion.id) continue
    const sem = comiteInfo.get(comp.comite_origen_id)?.semana
    if (!sem) continue
    const arr = misCompsPorSemana.get(sem) ?? []
    arr.push({ estado: comp.estado, impacto: comp.impacto })
    misCompsPorSemana.set(sem, arr)
  }
  const totalSemanas = numSemanasISO(anio)
  const celdasHeatmap: CeldaSemana[] = Array.from({ length: totalSemanas }, (_, i) => {
    const semana = i + 1
    const comps = misCompsPorSemana.get(semana)
    if (!comps) return { semana, pct: null, cumplidos: 0, total: 0 }
    const r = calcularPonderado(comps)
    return { semana, pct: r.pctPonderado, cumplidos: r.cumplidos, total: r.total }
  })
  const tengoDatosHeatmap = misCompsPorSemana.size > 0

  const subtituloVentana = ventana === 'semana' ? `Semana ISO ${semanaActual}`
    : ventana === 'mes' ? `Mes ${String(mesActual).padStart(2, '0')}/${anio}`
    : `Año ${anio} completo`

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Comités', href: '/comites' },
        { etiqueta: 'Ranking' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page__eyebrow">Escalafón · 4DX</div>
            <h1 className="page__title">Ranking de cumplimiento</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Puntos por compromisos cumplidos (peso alto=3, medio=2, bajo=1) y % personal · {subtituloVentana}
            </p>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            {aniosDisponibles.map(a => (
              <Link key={a} href={`/comites/ranking?anio=${a}&ventana=${ventana}`}
                className={`btn btn--sm ${a === anio ? 'btn--primary' : 'btn--ghost'}`}>{a}</Link>
            ))}
          </div>
        </div>

        {/* Pestañas de ventana */}
        <div className="hstack" style={{ gap: 6, marginBottom: 22 }}>
          {VENTANAS.map(v => (
            <Link key={v.clave} href={`/comites/ranking?anio=${anio}&ventana=${v.clave}`}
              className={`btn btn--sm ${v.clave === ventana ? 'btn--primary' : 'btn--ghost'}`}>{v.label}</Link>
          ))}
        </div>

        {/* Heatmap personal */}
        {tengoDatosHeatmap && (
          <section style={{ marginBottom: 26 }}>
            <HeatmapSemanal
              titulo={`Tu constancia semanal · ${anio}`}
              celdas={celdasHeatmap}
              semanaActual={anio === anioActual ? semanaActual : null}
            />
          </section>
        )}

        {/* Comparativa entre gestiones */}
        <section style={{ marginBottom: 30 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Entre gestiones</div>
            <span className="section-count">% de cumplimiento normalizado</span>
          </div>
          {comparativa.length === 0 ? (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No hay comités en este período.
            </div>
          ) : (
            <div className="card card--table">
              <table className="table table--in-card">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Gestión</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Puntos</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Cumplidos</th>
                    <th style={{ width: 200 }}>Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {comparativa.map((g, i) => (
                    <tr key={g.gestion_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-3)' }}>{i + 1}</td>
                      <td className="row-title">{g.nombre}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{g.r.pesoCumplido}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{g.r.cumplidos}/{g.r.evaluados}</td>
                      <td>
                        {g.r.pctPonderado === null ? (
                          <span className="text-muted text-sm">Sin evaluar</span>
                        ) : (
                          <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
                            <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${g.r.pctPonderado}%`, height: '100%', background: colorPct(g.r.pctPonderado) }} />
                            </div>
                            <span className={`badge ${badgePct(g.r.pctPonderado)}`}>{g.r.pctPonderado}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Escalafón individual por gestión */}
        {escalafones.map(esc => (
          <section key={esc.gestion_id} style={{ marginBottom: 26 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <div className="page__eyebrow" style={{ margin: 0 }}>Escalafón individual · {esc.nombre}</div>
              <span className="section-count">{esc.filas.length} personas</span>
            </div>
            <div className="card card--table">
              <table className="table table--in-card">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Persona</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Puntos</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Esta sem.</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Cumplidos</th>
                    <th style={{ width: 100, textAlign: 'center' }}>% personal</th>
                  </tr>
                </thead>
                <tbody>
                  {esc.filas.map((f, i) => {
                    const esYo = f.usuario_id === sesion.id
                    return (
                      <tr key={f.usuario_id} style={esYo ? { background: 'var(--primary-soft)' } : undefined}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: i < 3 ? 'var(--primary-ink)' : 'var(--text-3)' }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td>
                          <div className="hstack" style={{ gap: 8 }}>
                            <div className="avatar avatar--sm">{obtenerIniciales(f.nombre)}</div>
                            <span className="row-title">{f.nombre}{esYo && <span style={{ color: 'var(--primary-ink)', fontSize: 11 }}> · tú</span>}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{f.puntos}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: f.delta > 0 ? 'var(--success-ink)' : 'var(--text-3)' }}>
                          {f.delta > 0 ? `+${f.delta}` : '—'}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{f.cumplidos}/{f.total}</td>
                        <td style={{ textAlign: 'center' }}>
                          {f.pct === null
                            ? <span className="text-muted text-sm">—</span>
                            : <span className={`badge ${badgePct(f.pct)}`}>{f.pct}%</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {escalafones.length === 0 && comparativa.length > 0 && (
          <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Aún no hay compromisos con responsable en tu gestión para este período.
          </div>
        )}
      </main>
    </>
  )
}
