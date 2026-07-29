import { notFound } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

/** Supabase devuelve las relaciones como arrays */
function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
}

interface FilaCargo {
  tipo: string
  descripcion: string | null
  orden: number
  paso: {
    id: string
    nombre: string | null
    descripcion: string | null
    numero_orden: number
    entradas: string | null
    salidas: string | null
    periodicidad: string | null
    tiempos: string | null
    acuerdo_servicio: string | null
    proceso_cliente: string | null
    proceso: {
      id: string
      nombre: string
      estado: string
      gestion: { id: string; nombre: string } | { id: string; nombre: string }[] | null
    } | null
  } | null
}

export default async function PaginaManualCargo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: cargo } = await supabase
    .from('cargos').select('id, nombre, banda').eq('id', id).maybeSingle()
  if (!cargo) notFound()

  const [{ data: filasRaw }, { data: personas }] = await Promise.all([
    supabase.from('paso_cargos')
      .select(`tipo, descripcion, orden,
        paso:pasos(id, nombre, descripcion, numero_orden, entradas, salidas, periodicidad,
          tiempos, acuerdo_servicio, proceso_cliente,
          proceso:procesos(id, nombre, estado, gestion:gestiones(id, nombre)))`)
      .eq('cargo_id', id),
    supabase.from('usuarios').select('id, nombre, codigo_contrato').eq('cargo_id', id).eq('activo', true).order('nombre'),
  ])

  // Solo cuentan los procedimientos publicados; los borradores aún no son funciones oficiales
  const filas = ((filasRaw ?? []) as unknown as FilaCargo[])
    .filter(f => f.paso?.proceso && f.paso.proceso.estado === 'activo')

  // Agrupar por gestión → proceso
  type Grupo = { gestion: string; procesos: Map<string, { nombre: string; id: string; items: FilaCargo[] }> }
  const porGestion = new Map<string, Grupo>()
  for (const f of filas) {
    const proc = f.paso!.proceso!
    const g = uno(proc.gestion)
    const gid = g?.id ?? 'sin'
    const grupo = porGestion.get(gid) ?? { gestion: g?.nombre ?? 'Sin gestión', procesos: new Map() }
    const p = grupo.procesos.get(proc.id) ?? { nombre: proc.nombre, id: proc.id, items: [] }
    p.items.push(f)
    grupo.procesos.set(proc.id, p)
    porGestion.set(gid, grupo)
  }

  const responsables = filas.filter(f => f.tipo !== 'apoyo').length
  const apoyos = filas.filter(f => f.tipo === 'apoyo').length

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Manuales de cargo', href: '/cargos' },
        { etiqueta: cargo.nombre },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 16 }}>
          <Link href="/cargos" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>

        <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="page__eyebrow">Manual de cargo</div>
            <h1 className="page__title">{cargo.nombre}</h1>
            <div className="meta-row" style={{ marginTop: 10 }}>
              <span className="badge badge--neutral badge--no-dot">Banda {cargo.banda}</span>
              <div className="meta-divider" />
              <span>{responsables} función{responsables === 1 ? '' : 'es'} como responsable</span>
              {apoyos > 0 && (
                <>
                  <div className="meta-divider" />
                  <span>{apoyos} de apoyo</span>
                </>
              )}
            </div>
          </div>
          {filas.length > 0 && (
            <Link href={`/cargos/${id}/imprimir`} className="btn btn--secondary btn--sm">
              <Icono nombre="download" className="icon icon--sm" /> Exportar PDF
            </Link>
          )}
        </div>

        <div className="layout-main-aside">
          <div className="vstack" style={{ gap: 20 }}>
            {filas.length === 0 ? (
              <section className="card" style={{ padding: 40, textAlign: 'center' }}>
                <Icono nombre="clipboard" className="icon icon--lg" style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Sin funciones documentadas</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
                  Este cargo aún no aparece en ninguna actividad de un procedimiento publicado.
                </p>
              </section>
            ) : (
              [...porGestion.values()]
                .sort((a, b) => a.gestion.localeCompare(b.gestion))
                .map(grupo => (
                  <section key={grupo.gestion} className="card card--padded">
                    <div className="page__eyebrow" style={{ marginBottom: 12 }}>{grupo.gestion}</div>
                    <div className="vstack" style={{ gap: 14 }}>
                      {[...grupo.procesos.values()].map(proc => (
                        <div key={proc.id}>
                          <div className="hstack" style={{ gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <Link href={`/procesos/${proc.id}`} className="hstack"
                              style={{ gap: 6, fontSize: 13.5, fontWeight: 650, color: 'var(--primary)' }}>
                              <Icono nombre="file" className="icon icon--sm" />
                              {proc.nombre}
                            </Link>
                          </div>
                          <div className="vstack" style={{ gap: 8 }}>
                            {proc.items
                              .sort((a, b) => (a.paso?.numero_orden ?? 0) - (b.paso?.numero_orden ?? 0))
                              .map((f, i) => {
                                const p = f.paso!
                                const esApoyo = f.tipo === 'apoyo'
                                return (
                                  <div key={i} className="paso-card" style={{
                                    background: esApoyo ? 'var(--surface-sunken)' : undefined,
                                  }}>
                                    <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}>
                                      <div className="paso-num">{String(p.numero_orden).padStart(2, '0')}</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                          <strong style={{ fontSize: 13.5 }}>{p.nombre || 'Actividad'}</strong>
                                          {esApoyo && <span className="badge badge--neutral">Apoyo</span>}
                                          {p.periodicidad && (
                                            <span className="text-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                                              {p.periodicidad}
                                            </span>
                                          )}
                                        </div>
                                        {/* La descripción propia del cargo manda sobre la general */}
                                        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                                          {f.descripcion || p.descripcion || '—'}
                                        </p>
                                        <div className="hstack" style={{ gap: 14, marginTop: 6, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-3)' }}>
                                          {p.entradas && <span><b>Entrada:</b> {p.entradas}</span>}
                                          {p.salidas && <span><b>Salida:</b> {p.salidas}</span>}
                                          {p.tiempos && <span><b>Tiempo:</b> {p.tiempos}</span>}
                                          {p.proceso_cliente && <span><b>Cliente:</b> {p.proceso_cliente}</span>}
                                        </div>
                                      </div>
                                      <Link href={`/procesos/${proc.id}`} className="btn btn--ghost btn--sm" title="Ver el procedimiento">
                                        <Icono nombre="externalLink" className="icon icon--sm" />
                                      </Link>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
            )}
          </div>

          <aside className="vstack" style={{ gap: 16 }}>
            <div className="card card--padded">
              <div className="page__eyebrow" style={{ marginBottom: 10 }}>Quién ocupa este cargo</div>
              {(personas ?? []).length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>Nadie activo con este cargo.</p>
              ) : (
                <div className="vstack" style={{ gap: 6 }}>
                  {(personas ?? []).map(p => (
                    <Link key={p.id} href={`/perfil/${p.id}`} className="hstack"
                      style={{ gap: 8, fontSize: 13, padding: '4px 0' }}>
                      <Icono nombre="users" className="icon icon--sm" style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>{p.nombre}</span>
                      {p.codigo_contrato && (
                        <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.codigo_contrato}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card callout">
              <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                <Icono nombre="info" className="icon" style={{ color: 'var(--primary)' }} />
                <strong style={{ color: 'var(--on-primary-soft)' }}>Se arma solo</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--on-primary-soft)', opacity: 0.85 }}>
                Estas funciones vienen de los procedimientos publicados. Si un procedimiento cambia,
                el manual cambia con él.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
