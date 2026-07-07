import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { calcularPonderado, badgePct } from '@/lib/comites/puntaje'
import TableroGestiones from './TableroGestiones'

export default async function PaginaComites({ searchParams }: {
  searchParams: Promise<{ gestion?: string }>
}) {
  const sesion = await obtenerSesion()
  const { gestion: filtroGestion } = await searchParams
  const supabase = await crearClienteServidor()

  const esAdmin = sesion.rol === 'admin'

  // Comités visibles: todos si admin; los de su gestión si líder/colaborador
  let query = supabase
    .from('comites')
    .select('id, gestion_id, fecha, semana_iso, anio, titulo, cerrado')
    .order('fecha', { ascending: false })
    .limit(50)
  if (!esAdmin && sesion.gestion_id) query = query.eq('gestion_id', sesion.gestion_id)
  else if (esAdmin && filtroGestion) query = query.eq('gestion_id', filtroGestion)

  const { data: comites } = await query

  const gestionIds = Array.from(new Set((comites ?? []).map(c => c.gestion_id)))
  const comiteIds = (comites ?? []).map(c => c.id)

  const [{ data: gestiones }, { data: compromisos }] = await Promise.all([
    gestionIds.length > 0
      ? supabase.from('gestiones').select('id, nombre').in('id', gestionIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    comiteIds.length > 0
      ? supabase.from('compromisos').select('comite_origen_id, estado, impacto').in('comite_origen_id', comiteIds)
      : Promise.resolve({ data: [] as { comite_origen_id: string; estado: string; impacto: string }[] }),
  ])

  const mapGestion = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const compsPorComite = new Map<string, { estado: string; impacto: string }[]>()
  for (const c of compromisos ?? []) {
    const arr = compsPorComite.get(c.comite_origen_id) ?? []
    arr.push({ estado: c.estado, impacto: c.impacto })
    compsPorComite.set(c.comite_origen_id, arr)
  }
  const statsPorComite = new Map(
    Array.from(compsPorComite.entries()).map(([id, comps]) => [id, calcularPonderado(comps)])
  )

  // Mis gestiones para crear
  const misGestiones = esAdmin
    ? (await supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre')).data ?? []
    : (await supabase.from('gestiones').select('id, nombre').eq('lider_id', sesion.id)).data ?? []

  const puedeCrear = misGestiones.length > 0

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Comités' }]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div className="page__eyebrow">Ejecución semanal</div>
            <h1 className="page__title">Comités y compromisos</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Actas semanales por equipo con compromisos, revisión y % de cumplimiento.
            </p>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <Link href="/comites/ranking" className="btn btn--ghost btn--sm">
              <Icono nombre="target" className="icon icon--sm" /> Ranking
            </Link>
            {puedeCrear && (
              <Link href="/comites/nuevo" className="btn btn--primary btn--sm">
                <Icono nombre="plus" className="icon icon--sm" /> Nuevo comité
              </Link>
            )}
          </div>
        </div>

        {/* Tablero de resultados — siempre visible */}
        <TableroGestiones sesion={sesion} />

        <div className="section-header" style={{ marginBottom: 12 }}>
          <div className="page__eyebrow" style={{ margin: 0 }}>Actas semanales</div>
        </div>

        {(!comites || comites.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗓️</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Aún no hay comités registrados{esAdmin ? '' : ' en tu gestión'}.
            </p>
            {puedeCrear && (
              <div style={{ marginTop: 14 }}>
                <Link href="/comites/nuevo" className="btn btn--primary btn--sm">Crear el primero</Link>
              </div>
            )}
          </section>
        ) : (
          <section className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Gestión</th>
                  <th>Título</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Compromisos</th>
                  <th style={{ width: 130 }}>Cumplimiento</th>
                  <th style={{ width: 90 }}>Estado</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {comites.map(c => {
                  const s = statsPorComite.get(c.id)
                  const total = s?.total ?? 0
                  const pct = s?.pctPonderado ?? null
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="row-title" style={{ fontFamily: 'var(--font-mono)' }}>W{c.semana_iso}/{c.anio}</div>
                        <div className="row-sub">{c.fecha}</div>
                      </td>
                      <td>{mapGestion.get(c.gestion_id) ?? '—'}</td>
                      <td>{c.titulo ?? <span className="text-muted">Comité semanal</span>}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{total}</td>
                      <td>
                        {pct === null ? (
                          <span className="text-muted text-sm">Sin evaluar</span>
                        ) : (
                          <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
                            <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                            </div>
                            <span className={`badge ${badgePct(pct)}`}>{pct}%</span>
                          </div>
                        )}
                      </td>
                      <td>
                        {c.cerrado
                          ? <span className="badge badge--neutral">Cerrado</span>
                          : <span className="badge badge--success">Abierto</span>}
                      </td>
                      <td>
                        <Link href={`/comites/${c.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  )
}
