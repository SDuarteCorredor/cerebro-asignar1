import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { calcularPonderado, colorPct, badgePct } from '@/lib/comites/puntaje'

export default async function RankingComites({ searchParams }: {
  searchParams: Promise<{ anio?: string }>
}) {
  const sesion = await obtenerSesion()
  const { anio: anioParam } = await searchParams
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  const anioActual = new Date().getFullYear()
  const anio = anioParam ? parseInt(anioParam, 10) : anioActual

  // Todos los comités del año (RLS permite lectura a autenticados; la comparativa necesita todas las gestiones)
  const { data: comitesAnio } = await supabase
    .from('comites').select('id, gestion_id, anio').eq('anio', anio)
  // Años disponibles para el selector
  const { data: aniosRaw } = await supabase.from('comites').select('anio')
  const aniosDisponibles = Array.from(new Set([anioActual, ...(aniosRaw ?? []).map(a => a.anio)])).sort((a, b) => b - a)

  const comiteIds = (comitesAnio ?? []).map(c => c.id)
  const comiteAGestion = new Map((comitesAnio ?? []).map(c => [c.id, c.gestion_id]))
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

  // --- Comparativa entre gestiones (normalizada en %) ---
  const compsPorGestion = new Map<string, { estado: string; impacto: string }[]>()
  // --- Escalafón individual: gestión -> persona -> compromisos ---
  const porGestionPersona = new Map<string, Map<string, { estado: string; impacto: string }[]>>()

  for (const comp of compromisos ?? []) {
    const gid = comiteAGestion.get(comp.comite_origen_id)
    if (!gid) continue
    const fila = { estado: comp.estado, impacto: comp.impacto }

    const g = compsPorGestion.get(gid) ?? []
    g.push(fila)
    compsPorGestion.set(gid, g)

    const personas = porGestionPersona.get(gid) ?? new Map<string, { estado: string; impacto: string }[]>()
    const p = personas.get(comp.responsable_id) ?? []
    p.push(fila)
    personas.set(comp.responsable_id, p)
    porGestionPersona.set(gid, personas)
  }

  const comparativa = gestionIds
    .map(gid => ({ gestion_id: gid, nombre: mapGestion.get(gid) ?? '—', r: calcularPonderado(compsPorGestion.get(gid) ?? []) }))
    .sort((a, b) => (b.r.pctPonderado ?? -1) - (a.r.pctPonderado ?? -1))

  // Gestiones a mostrar en escalafón individual: admin ve todas; el resto solo la suya
  const gestionesEscalafon = esAdmin
    ? gestionIds
    : gestionIds.filter(gid => gid === sesion.gestion_id)

  const escalafones = gestionesEscalafon.map(gid => {
    const personas = porGestionPersona.get(gid) ?? new Map()
    const filas = Array.from(personas.entries())
      .map(([uid, comps]) => {
        const r = calcularPonderado(comps as { estado: string; impacto: string }[])
        return {
          usuario_id: uid as string,
          nombre: mapUsuario.get(uid as string) ?? '—',
          puntos: r.pesoCumplido,
          pct: r.pctPonderado,
          cumplidos: r.cumplidos,
          total: r.total,
        }
      })
      .sort((a, b) => b.puntos - a.puntos || (b.pct ?? -1) - (a.pct ?? -1))
    return { gestion_id: gid, nombre: mapGestion.get(gid) ?? '—', filas }
  }).filter(e => e.filas.length > 0)

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Comités', href: '/comites' },
        { etiqueta: 'Ranking' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page__eyebrow">Escalafón · 4DX</div>
            <h1 className="page__title">Ranking de cumplimiento {anio}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Puntos por compromisos cumplidos (peso alto=3, medio=2, bajo=1) y % de cumplimiento personal.
            </p>
          </div>
          <div className="hstack" style={{ gap: 6 }}>
            {aniosDisponibles.map(a => (
              <Link key={a} href={`/comites/ranking?anio=${a}`}
                className={`btn btn--sm ${a === anio ? 'btn--primary' : 'btn--ghost'}`}>{a}</Link>
            ))}
            <Link href="/comites" className="btn btn--ghost btn--sm">
              <Icono nombre="history" className="icon icon--sm" /> Comités
            </Link>
          </div>
        </div>

        {/* Comparativa entre gestiones */}
        <section style={{ marginBottom: 30 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Entre gestiones</div>
            <span className="section-count">% de cumplimiento normalizado</span>
          </div>
          {comparativa.length === 0 ? (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No hay comités registrados en {anio}.
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
                    <th style={{ width: 100, textAlign: 'center' }}>Cumplidos</th>
                    <th style={{ width: 110, textAlign: 'center' }}>% personal</th>
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
            Aún no hay compromisos con responsable en tu gestión para armar el escalafón.
          </div>
        )}
      </main>
    </>
  )
}
