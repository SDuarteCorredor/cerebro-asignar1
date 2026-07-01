import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import Icono from '@/components/app/Icono'
import BuscadorHero from './BuscadorHero'
import type { EstadoProceso } from '@/types'

export default async function PaginaDashboard() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const esAdmin = sesion.rol === 'admin'

  // 2 queries secuenciales (más amable con conexiones lentas que 5 en paralelo)
  const { data: gestionesRaw, error: errGest } = await supabase
    .from('gestiones')
    .select(`
      id, nombre, descripcion, icono, color_soft, color_primary, lider_id, activa,
      lider:usuarios!gestiones_lider_id_fkey(id, nombre),
      procesos_activos:procesos(count)
    `)
    .eq('activa', true)
    .eq('procesos.estado', 'activo')
    .order('nombre')
  if (errGest) console.error('Error gestiones:', errGest)

  const { data: recientesRaw, error: errRec } = await supabase
    .from('procesos')
    .select(`
      id, nombre, version, fecha_actualizacion, estado,
      gestion:gestiones(id, nombre, icono, color_soft, color_primary),
      pasos(cargo_responsable, numero_orden)
    `)
    .eq('estado', 'activo')
    .order('fecha_actualizacion', { ascending: false })
    .limit(5)
  if (errRec) console.error('Error recientes:', errRec)

  // Normalizar arrays-vs-objeto que devuelve Supabase
  const gestiones = (gestionesRaw ?? []).map(g => {
    const liderRaw = g.lider as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
    const lider = Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw
    const activos = (g.procesos_activos as { count: number }[] | undefined)?.[0]?.count ?? 0
    return { ...g, lider, procesos_activos_count: activos }
  })
  const recientes = (recientesRaw ?? []).map(p => {
    const gRaw = p.gestion as unknown as { id: string; nombre: string; icono: string; color_soft: string; color_primary: string }[] | { id: string; nombre: string; icono: string; color_soft: string; color_primary: string } | null
    const gestion = Array.isArray(gRaw) ? (gRaw[0] ?? null) : gRaw
    const pasos = (p.pasos as { cargo_responsable: string; numero_orden: number }[] | undefined) ?? []
    pasos.sort((a, b) => a.numero_orden - b.numero_orden)
    return { ...p, gestion, cargo_principal: pasos[0]?.cargo_responsable ?? '—' }
  })
  const errorBD = errGest || errRec

  // Stats para admin
  let aprobacionesPendientes = 0
  let totalUsuarios = 0
  let procesosDesactualizados = 0
  let totalProcesos = 0

  if (esAdmin) {
    const [{ count: ap }, { count: tu }, { count: pd }, { count: tp }] = await Promise.all([
      supabase.from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision'),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'desactualizado'),
      supabase.from('procesos').select('id', { count: 'exact', head: true }),
    ])
    aprobacionesPendientes = ap ?? 0
    totalUsuarios = tu ?? 0
    procesosDesactualizados = pd ?? 0
    totalProcesos = tp ?? 0
  }

  const saludo = sesion.nombre.split(' ')[0]
  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <Topbar usuario={sesion} mostrarBuscar={false} />
      <main className="page fade-up">

        {/* Hero con buscador */}
        <div style={{ marginBottom: 36 }}>
          <div className="page__eyebrow">{fechaHoy}</div>
          <h1 className="page__title" style={{ fontSize: 34 }}>Hola, {saludo}.</h1>
          <p className="page__subtitle" style={{ fontSize: 16 }}>¿Qué proceso necesitas consultar hoy?</p>
          <BuscadorHero />
        </div>

        {errorBD && (
          <div style={{
            background: 'var(--warning-soft)', border: '1px solid var(--warning)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            color: 'var(--warning-ink)', fontSize: 13.5,
          }}>
            <strong>No se pudieron cargar los datos.</strong> La conexión con Supabase está lenta o intermitente.
            Recarga la página en unos segundos para reintentar.
          </div>
        )}

        {/* Accesos rápidos Admin */}
        {esAdmin && (
          <div className="grid-stats" style={{ marginBottom: 36 }}>
            {[
              { titulo: 'Aprobaciones pendientes', cuenta: aprobacionesPendientes, icono: 'inbox', tono: 'warning', href: '/admin/aprobaciones' },
              { titulo: 'Procesos desactualizados', cuenta: procesosDesactualizados, icono: 'history', tono: 'danger', href: '/gestiones' },
              { titulo: 'Usuarios activos', cuenta: totalUsuarios, icono: 'users', tono: 'primary', href: '/admin/usuarios' },
              { titulo: 'Total de procesos', cuenta: totalProcesos, icono: 'grid', tono: 'neutral', href: '/gestiones' },
            ].map((a) => (
              <Link key={a.titulo} href={a.href} className="card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, padding: 18 }}>
                <div className={`badge badge--${a.tono} badge--no-dot`} style={{ alignSelf: 'flex-start', padding: '5px 8px' }}>
                  <Icono nombre={a.icono} className="icon icon--sm" />
                </div>
                <div>
                  <div className="stat-number">{a.cuenta}</div>
                  <div className="stat-label">{a.titulo}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Todas las Gestiones */}
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <h2 className="section-title section-title--lg">Todas las Gestiones</h2>
            <span className="section-count text-sm">{gestiones.length} gestiones</span>
          </div>

          <div className="grid-cards">
            {gestiones.map((g) => {
              const lider = g.lider
              const activos = g.procesos_activos_count
              return (
                <Link
                  key={g.id}
                  href={`/gestiones/${g.id}`}
                  className="card"
                  style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, padding: 20, transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <IconoGestion gestion={g} size={42} rounded={12} />
                    <Icono nombre="arrowRight" className="icon icon--sm text-muted" />
                  </div>
                  <div>
                    <div className="card__title" style={{ marginBottom: 4 }}>{g.nombre}</div>
                    <div className="text-xs text-muted" style={{ lineHeight: 1.45 }}>{g.descripcion}</div>
                  </div>
                  <div className="card-footer">
                    <span className="font-semibold text-2 tabular-nums">{activos}</span> procesos activos
                    <span style={{ flex: 1 }} />
                    {lider && (
                      <div className="avatar avatar--sm" title={`Líder: ${lider.nombre}`}>
                        {lider.nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Actualizados recientemente */}
        <section>
          <div className="section-header">
            <h2 className="section-title section-title--lg">Actualizados recientemente</h2>
          </div>
          <div className="card card--table">
            <div className="table-scroll">
              <table className="table table--in-card">
                <thead>
                  <tr>
                    <th>Proceso</th>
                    <th>Gestión</th>
                    <th>Cargo principal</th>
                    <th>Actualizado</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((p) => {
                    const g = p.gestion
                    const cargoPrincipal = p.cargo_principal
                    return (
                      <tr key={p.id} style={{ cursor: 'pointer' }}>
                        <td>
                          <Link href={`/procesos/${p.id}`} style={{ display: 'block' }}>
                            <div className="row-title">{p.nombre}</div>
                            <div className="row-sub">v{p.version}</div>
                          </Link>
                        </td>
                        <td>
                          {g && (
                            <Link href={`/gestiones/${g.id}`} className="hstack" style={{ gap: 8 }}>
                              <IconoGestion gestion={g} size={22} rounded={6} />
                              <span style={{ fontSize: 13 }}>{g.nombre}</span>
                            </Link>
                          )}
                        </td>
                        <td className="text-sm text-2">{cargoPrincipal}</td>
                        <td className="text-mono text-xs text-muted">
                          {new Date(p.fecha_actualizacion).toLocaleDateString('es-CO')}
                        </td>
                        <td><BadgeEstado estado={p.estado as EstadoProceso} /></td>
                      </tr>
                    )
                  })}
                  {recientes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                        Aún no hay procesos publicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
