import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { calcularPonderado, colorPct, badgePct } from '@/lib/comites/puntaje'
import type { SesionUsuario } from '@/types'

export default async function TableroGestiones({ sesion }: { sesion: SesionUsuario }) {
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  let qComites = supabase
    .from('comites')
    .select('id, gestion_id, semana_iso, anio, fecha')
    .order('fecha', { ascending: false })
    .limit(200)
  if (!esAdmin && sesion.gestion_id) qComites = qComites.eq('gestion_id', sesion.gestion_id)
  const { data: comites } = await qComites

  const comiteIds = (comites ?? []).map(c => c.id)
  const gestionIds = Array.from(new Set((comites ?? []).map(c => c.gestion_id)))
  if (gestionIds.length === 0) return null

  const [{ data: gestiones }, { data: compromisos }] = await Promise.all([
    supabase.from('gestiones').select('id, nombre').in('id', gestionIds),
    comiteIds.length > 0
      ? supabase.from('compromisos').select('comite_origen_id, estado, impacto').in('comite_origen_id', comiteIds)
      : Promise.resolve({ data: [] as { comite_origen_id: string; estado: string; impacto: string }[] }),
  ])

  const mapGestion = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const comiteAGestion = new Map((comites ?? []).map(c => [c.id, c.gestion_id]))

  const semanasOrdenadas = (comites ?? [])
    .map(c => `${c.anio}-W${String(c.semana_iso).padStart(2, '0')}`)
    .sort((a, b) => b.localeCompare(a))
  const semanaReciente = semanasOrdenadas[0] ?? null
  const comitesRecientes = new Set(
    (comites ?? [])
      .filter(c => `${c.anio}-W${String(c.semana_iso).padStart(2, '0')}` === semanaReciente)
      .map(c => c.id)
  )

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
    const acum = acumPorGestion.get(gid) ?? []
    acum.push(fila)
    acumPorGestion.set(gid, acum)
    if (comitesRecientes.has(comp.comite_origen_id)) {
      const sem = semanaPorGestion.get(gid) ?? []
      sem.push(fila)
      semanaPorGestion.set(gid, sem)
    }
  }

  const filas = gestionIds
    .map(gid => ({
      gestion_id: gid,
      nombre: mapGestion.get(gid) ?? '—',
      numComites: comitesPorGestion.get(gid)?.size ?? 0,
      acum: calcularPonderado(acumPorGestion.get(gid) ?? []),
      semana: calcularPonderado(semanaPorGestion.get(gid) ?? []),
    }))
    .sort((a, b) => (b.acum.pctPonderado ?? -1) - (a.acum.pctPonderado ?? -1))

  return (
    <section style={{ marginBottom: 28 }}>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div className="page__eyebrow" style={{ margin: 0 }}>Tablero de resultados · 4DX</div>
        {semanaReciente && <span className="section-count">Semana reciente: {semanaReciente}</span>}
      </div>
      <div className="grid-cards">
        {filas.map((f, i) => {
          const pct = f.acum.pctPonderado
          return (
            <div key={f.gestion_id} className="card" style={{ padding: 18 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {esAdmin ? `#${i + 1}` : ''}
                </span>
                {pct !== null && <span className={`badge ${badgePct(pct)}`}>{pct}%</span>}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{f.nombre}</h3>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 10 }}>
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
                    {f.acum.reportados > 0 && <span>⏳ {f.acum.reportados}</span>}
                  </div>
                  {f.semana.pctPonderado !== null && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--divider)', fontSize: 11.5, color: 'var(--text-3)' }}>
                      Semana reciente: <strong style={{ color: colorPct(f.semana.pctPonderado) }}>{f.semana.pctPonderado}%</strong>
                      {' '}({f.semana.cumplidos}/{f.semana.evaluados})
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
