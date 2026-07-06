import { redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { obtenerIniciales } from '@/lib/sesion'
import type { SesionUsuario, Rol } from '@/types'

const colorEstado: Record<string, string> = {
  'Programado':  'badge--neutral',
  'En captura':  'badge--warning',
  'En análisis': 'badge--primary',
  'Cerrado':     'badge--success',
}

export default async function PaginaCiclos() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')
  if (perfil.rol !== 'admin') redirect('/desempeno')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const { data: ciclos } = await supabase
    .from('ciclos_evaluacion')
    .select('id, nombre, fecha_inicio, fecha_fin_captura, fecha_fin_proceso, estado, aplica_a_bandas, created_at')
    .order('created_at', { ascending: false })

  // Conteo de evaluaciones por ciclo
  const { data: conteos } = await supabase
    .from('evaluaciones')
    .select('ciclo_id, estado')

  const conteoPorCiclo = new Map<string, { total: number; respondidas: number }>()
  for (const c of (conteos ?? [])) {
    const stats = conteoPorCiclo.get(c.ciclo_id) ?? { total: 0, respondidas: 0 }
    stats.total += 1
    if (['Calculada', 'PDI generado', 'Cerrada'].includes(c.estado)) stats.respondidas += 1
    conteoPorCiclo.set(c.ciclo_id, stats)
  }

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño', href: '/desempeno' }, { etiqueta: 'Ciclos' }]} />
      <main className="page fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div className="page__eyebrow">ECO-Asignar</div>
            <h1 className="page__title">Ciclos de evaluación</h1>
            <p className="page__subtitle">
              Cada ciclo agrupa las evaluaciones de un periodo (semestre, anual). El sistema instancia automáticamente
              una evaluación por colaborador y auto-asigna su jefe directo como evaluador.
            </p>
          </div>
          <Link href="/desempeno/ciclos/nuevo" className="btn btn--primary">
            <Icono nombre="plus" className="icon icon--sm" /> Crear ciclo
          </Link>
        </div>

        {(ciclos ?? []).length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icono nombre="target" className="icon icon--lg" style={{ marginBottom: 12, color: 'var(--text-muted)' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Aún no hay ciclos creados</h2>
            <p style={{ margin: '0 0 16px', fontSize: 14 }}>
              Crea el primer ciclo (por ejemplo, &quot;Semestre I 2026&quot;) para empezar a evaluar competencias.
            </p>
            <Link href="/desempeno/ciclos/nuevo" className="btn btn--primary">
              <Icono nombre="plus" className="icon icon--sm" /> Crear primer ciclo
            </Link>
          </div>
        ) : (
          <div className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Bandas</th>
                  <th>Periodo de captura</th>
                  <th>Cobertura</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(ciclos ?? []).map(c => {
                  const stats = conteoPorCiclo.get(c.id) ?? { total: 0, respondidas: 0 }
                  const pct = stats.total > 0 ? Math.round((stats.respondidas / stats.total) * 100) : 0
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/desempeno/ciclos/${c.id}`} className="row-title">{c.nombre}</Link>
                        <div className="row-sub">{c.fecha_inicio}</div>
                      </td>
                      <td style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                        {c.aplica_a_bandas ?? 'B1-B5'}
                      </td>
                      <td style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                        {c.fecha_inicio} → {c.fecha_fin_captura}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <strong>{stats.respondidas}</strong> / {stats.total}
                          <div style={{ flex: 1, height: 6, background: 'var(--surface-sunken)', borderRadius: 999, overflow: 'hidden', maxWidth: 80 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : 'var(--primary)' }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${colorEstado[c.estado] ?? 'badge--neutral'}`}>{c.estado}</span>
                      </td>
                      <td>
                        <Link href={`/desempeno/ciclos/${c.id}`} className="btn btn--ghost btn--sm">
                          <Icono nombre="arrowRight" className="icon icon--sm" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  )
}
