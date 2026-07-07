import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { calcularPonderado, colorPct, badgePct } from '@/lib/comites/puntaje'

export default async function TableroComites() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  // Comités visibles (últimas ~12 semanas por relevancia)
  let qComites = supabase
    .from('comites')
    .select('id, gestion_id, semana_iso, anio, fecha')
    .order('fecha', { ascending: false })
    .limit(200)
  if (!esAdmin && sesion.gestion_id) qComites = qComites.eq('gestion_id', sesion.gestion_id)
  const { data: comites } = await qComites

  const comiteIds = (comites ?? []).map(c => c.id)
  const gestionIds = Array.from(new Set((comites ?? []).map(c => c.gestion_id)))

  const [{ data: gestiones }, { data: compromisos }] = await Promise.all([
    gestionIds.length > 0
      ? supabase.from('gestiones').select('id, nombre').in('id', gestionIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    comiteIds.length > 0
      ? supabase.from('compromisos').select('comite_origen_id, estado, impacto').in('comite_origen_id', comiteIds)
      : Promise.resolve({ data: [] as { comite_origen_id: string; estado: string; impacto: string }[] }),
  ])

  const mapGestion = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const comiteAGestion = new Map((comites ?? []).map(c => [c.id, c.gestion_id]))

  // Semana ISO más reciente presente en los datos
  const semanasOrdenadas = (comites ?? [])
    .map(c => ({ clave: `${c.anio}-W${String(c.semana_iso).padStart(2, '0')}`, anio: c.anio, semana: c.semana_iso }))
    .sort((a, b) => b.clave.localeCompare(a.clave))
  const semanaReciente = semanasOrdenadas[0]?.clave ?? null

  const comitesRecientes = new Set(
    (comites ?? [])
      .filter(c => `${c.anio}-W${String(c.semana_iso).padStart(2, '0')}` === semanaReciente)
      .map(c => c.id)
  )

  // Agrupar compromisos por gestión (acumulado) y por gestión-semana-reciente
  const acumPorGestion = new Map<string, { estado: string; impacto: string }[]>()
  const semanaPorGestion = new Map<string, { estado: string; impacto: string }[]>()
  const comitesPorGestion = new Map<string, Set<string>>()

  for (const c of comites ?? []) {
    const set = comitesPorGestion.get(c.gestion_id) ?? new Set<string>()
    set.add(c.id)
    comitesPorGestion.set(c.gestion_id, set)
  }
  for (const comp of compromisos ?? []) {
    const gid = comiteAGestion.get(comp.comite_origen_id)
    if (!gid) continue
    const fila = { estado: comp.estado, impacto: comp.impacto }
    const arr = acumPorGestion.get(gid) ?? []
    arr.push(fila)
    acumPorGestion.set(gid, arr)
    if (comitesRecientes.has(comp.comite_origen_id)) {
      const arrS = semanaPorGestion.get(gid) ?? []
      arrS.push(fila)
      semanaPorGestion.set(gid, arrS)
    }
  }

  const filas = gestionIds
    .map(gid => {
      const acum = calcularPonderado(acumPorGestion.get(gid) ?? [])
      const semana = calcularPonderado(semanaPorGestion.get(gid) ?? [])
      return {
        gestion_id: gid,
        nombre: mapGestion.get(gid) ?? '—',
        numComites: comitesPorGestion.get(gid)?.size ?? 0,
        acum,
        semana,
      }
    })
    .sort((a, b) => (b.acum.pctPonderado ?? -1) - (a.acum.pctPonderado ?? -1))

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Comités', href: '/comites' },
        { etiqueta: 'Tablero' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div className="page__eyebrow">Tablero de resultados · 4DX</div>
            <h1 className="page__title">Cumplimiento por gestión</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              % ponderado por impacto de compromisos cumplidos. {semanaReciente && <>Semana más reciente: <strong>{semanaReciente}</strong>.</>}
            </p>
          </div>
          <Link href="/comites" className="btn btn--ghost btn--sm">
            <Icono nombre="history" className="icon icon--sm" /> Ver comités
          </Link>
        </div>

        {filas.length === 0 ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Aún no hay comités con compromisos para mostrar en el tablero.
            </p>
          </section>
        ) : (
          <div className="grid-cards">
            {filas.map((f, i) => {
              const pct = f.acum.pctPonderado
              return (
                <Link key={f.gestion_id} href={`/comites?gestion=${f.gestion_id}`} className="card" style={{ padding: 20, display: 'block' }}>
                  <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>#{i + 1}</span>
                    {pct !== null && <span className={`badge ${badgePct(pct)}`}>{pct}%</span>}
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{f.nombre}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
                    {f.numComites} comité{f.numComites !== 1 ? 's' : ''} · {f.acum.total} compromisos
                  </div>

                  {pct === null ? (
                    <div className="text-muted text-sm">Sin compromisos evaluados aún</div>
                  ) : (
                    <>
                      <div style={{ background: 'var(--border)', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: colorPct(pct) }} />
                      </div>
                      <div className="hstack" style={{ gap: 10, fontSize: 11.5, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                        <span>✓ {f.acum.cumplidos}</span>
                        <span>✗ {f.acum.noCumplidos}</span>
                        {f.acum.reportados > 0 && <span>⏳ {f.acum.reportados} reportados</span>}
                      </div>
                      {f.semana.pctPonderado !== null && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--divider)', fontSize: 11.5, color: 'var(--text-3)' }}>
                          Semana reciente: <strong style={{ color: colorPct(f.semana.pctPonderado) }}>{f.semana.pctPonderado}%</strong>
                          {' '}({f.semana.cumplidos}/{f.semana.evaluados})
                        </div>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}
