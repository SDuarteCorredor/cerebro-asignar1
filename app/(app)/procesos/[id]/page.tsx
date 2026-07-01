import { notFound } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import IconoArchivo from '@/components/app/IconoArchivo'
import Icono from '@/components/app/Icono'
import PanelHistorial from './PanelHistorial'
import PasoExpandible from '@/components/app/PasoExpandible'
import type { PasoDetalle } from '@/components/app/PasoExpandible'

export default async function PaginaProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: proceso } = await supabase
    .from('procesos')
    .select(`
      *,
      gestion:gestiones(id, nombre, descripcion, icono, color_soft, color_primary,
        lider:usuarios!gestiones_lider_id_fkey(id, nombre, correo)),
      pasos(id, numero_orden, nombre, descripcion, cargo_responsable, entradas, periodicidad, salidas, acuerdo_servicio, tiempos),
      documentos(id, nombre, tipo_archivo, url_descarga, tamano_bytes)
    `)
    .eq('id', id)
    .single()

  if (!proceso) notFound()

  // Control de acceso: colaboradores no pueden ver borradores de otras gestiones
  const puedeVer = proceso.estado === 'activo'
    || sesion.rol === 'admin'
    || (sesion.rol === 'lider' && sesion.gestion_id === proceso.gestion_id)

  if (!puedeVer) notFound()

  const { data: historial } = await supabase
    .from('historial_versiones')
    .select('*, usuario:usuarios(nombre)')
    .eq('proceso_id', id)
    .order('fecha_cambio', { ascending: false })

  const puedeEditar = sesion.rol === 'admin'
    || (sesion.rol === 'lider' && sesion.gestion_id === proceso.gestion_id)

  type GestionDetalle = { id: string; nombre: string; icono: string; color_soft: string; color_primary: string; lider: { id: string; nombre: string; correo: string }[] | { id: string; nombre: string; correo: string } | null }
  const gRaw = proceso.gestion as unknown as GestionDetalle[] | GestionDetalle | null
  const g = Array.isArray(gRaw) ? (gRaw[0] ?? null) : gRaw
  const pasos = (proceso.pasos as PasoDetalle[])
    .sort((a, b) => a.numero_orden - b.numero_orden)
  const documentos = proceso.documentos as { id: string; nombre: string; tipo_archivo: string; url_descarga: string; tamano_bytes: number | null }[]
  const liderRaw = g?.lider
  const lider = Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw

  const esCliente = proceso.es_proceso_cliente === true
  const contactos = (proceso.cliente_contactos as { nombre: string; telefono: string; correo: string }[]) ?? []

  return (
    <>
      <Topbar
        usuario={sesion}
        migas={[
          { etiqueta: 'Procesos y Procedimientos', href: '/gestiones' },
          { etiqueta: g?.nombre ?? '', href: `/gestiones/${g?.id}` },
          { etiqueta: proceso.nombre },
        ]}
      />
      <main className="page fade-up">
        {/* Cabecera */}
        <div className="section-header" style={{ alignItems: 'flex-start', gap: 24, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div className="hstack" style={{ gap: 10, marginBottom: 14 }}>
              <Link href={`/gestiones/${g?.id}`} className="hstack text-muted text-sm" style={{ gap: 8 }}>
                {g && <IconoGestion gestion={g} size={22} rounded={6} />}
                {g?.nombre}
              </Link>
              <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
              <span className="text-2 text-sm font-semibold">{proceso.nombre}</span>
            </div>
            <h1 className="page__title">{proceso.nombre}</h1>
            <div className="meta-row" style={{ marginTop: 14 }}>
              <div className="hstack" style={{ gap: 6 }}>
                <Icono nombre="folder" className="icon icon--sm" /> Gestión:{' '}
                <strong style={{ color: 'var(--text)' }}>{g?.nombre}</strong>
              </div>
              <div className="meta-divider" />
              <div className="hstack text-mono" style={{ gap: 6 }}>
                <Icono nombre="history" className="icon icon--sm" /> Versión {proceso.version}
              </div>
              <div className="meta-divider" />
              <div className="text-mono">
                Actualizado {new Date(proceso.fecha_actualizacion).toLocaleDateString('es-CO')}
              </div>
              <div className="meta-divider" />
              <BadgeEstado estado={proceso.estado} />
            </div>
          </div>

          <div className="hstack" style={{ gap: 8, flexShrink: 0 }}>
            <PanelHistorial historial={historial ?? []} />
            {puedeEditar && (
              <Link href={`/procesos/${id}/editar`} className="btn btn--primary btn--sm">
                <Icono nombre="edit" className="icon icon--sm" /> Editar
              </Link>
            )}
          </div>
        </div>

        {/* Contenido principal + sidebar */}
        <div className="layout-main-aside">
          <div className="vstack" style={{ gap: 24 }}>
            {/* Objetivo */}
            <section className="card card--padded">
              <div className="page__eyebrow" style={{ marginBottom: 8 }}>Objetivo</div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>{proceso.objetivo}</p>
            </section>

            {/* Cliente (proceso por cliente) */}
            {esCliente && (
              <>
                <section className="card card--padded">
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Cliente</div>
                  <h2 className="section-title" style={{ marginBottom: 16 }}>
                    {proceso.cliente_nombre || 'Sin nombre de cliente'}
                  </h2>
                  {contactos.length > 0 ? (
                    <div className="vstack" style={{ gap: 10 }}>
                      {contactos.map((c, i) => (
                        <div key={i} className="contact-card">
                          <div className="hstack" style={{ gap: 8 }}>
                            <div className="avatar avatar--sm">{obtenerIniciales(c.nombre || '?')}</div>
                            <strong style={{ fontSize: 14 }}>{c.nombre || '—'}</strong>
                          </div>
                          {c.telefono && (
                            <span className="hstack text-2 text-sm" style={{ gap: 6 }}>
                              <Icono nombre="users" className="icon icon--sm" /> {c.telefono}
                            </span>
                          )}
                          {c.correo && (
                            <a href={`mailto:${c.correo}`} className="hstack text-sm" style={{ gap: 6, color: 'var(--primary)' }}>
                              <Icono nombre="info" className="icon icon--sm" /> {c.correo}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: 24 }}>
                      Sin contactos registrados.
                    </div>
                  )}
                </section>

                <section className="card card--padded">
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Acuerdo de servicio</div>
                  <h2 className="section-title" style={{ marginBottom: 16 }}>Acuerdo con el cliente</h2>
                  <dl className="dl-grid dl-grid--2col">
                    {proceso.acuerdo_tarifa && (
                      <div><dt className="dl-label dl-label--upper">Tarifa</dt><dd className="dl-value--lg">{proceso.acuerdo_tarifa}</dd></div>
                    )}
                    {proceso.acuerdo_tipo_servicio && (
                      <div><dt className="dl-label dl-label--upper">Tipo de servicio</dt><dd className="dl-value--lg">{proceso.acuerdo_tipo_servicio}</dd></div>
                    )}
                    {proceso.acuerdo_uniforme && (
                      <div style={{ gridColumn: '1 / -1' }}><dt className="dl-label dl-label--upper">Acuerdo de uniforme</dt><dd className="dl-value--lg">{proceso.acuerdo_uniforme}</dd></div>
                    )}
                    {proceso.acuerdo_detalles && (
                      <div style={{ gridColumn: '1 / -1' }}><dt className="dl-label dl-label--upper">Detalles adicionales</dt><dd className="dl-value--lg" style={{ lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{proceso.acuerdo_detalles}</dd></div>
                    )}
                    {!proceso.acuerdo_tarifa && !proceso.acuerdo_tipo_servicio && !proceso.acuerdo_uniforme && !proceso.acuerdo_detalles && (
                      <div style={{ gridColumn: '1 / -1' }} className="text-muted">Aún no se ha registrado el acuerdo de servicio.</div>
                    )}
                  </dl>
                </section>
              </>
            )}

            {/* Pasos */}
            {!esCliente && (
            <section className="card card--padded">
              <div className="section-header">
                <div>
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Procedimiento</div>
                  <h2 className="section-title">Pasos del Procedimiento</h2>
                </div>
                <span className="section-count">{pasos.length} pasos</span>
              </div>
              {pasos.length > 0 ? (
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pasos.map((s, i) => (
                    <PasoExpandible key={s.id} paso={s} index={i} total={pasos.length} />
                  ))}
                </ol>
              ) : (
                <div className="empty-state">
                  Este proceso aún no tiene pasos detallados.{puedeEditar && ' Edítalo para agregarlos.'}
                </div>
              )}
            </section>
            )}

            {/* Documentos */}
            <section className="card card--padded">
              <div className="section-header">
                <div>
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Recursos</div>
                  <h2 className="section-title">Documentos Relacionados</h2>
                </div>
                <span className="section-count">{documentos.length} archivos</span>
              </div>
              {documentos.length > 0 ? (
                <div className="grid-2col" style={{ gap: 10 }}>
                  {documentos.map((d) => (
                    <a key={d.id} href={d.url_descarga} target="_blank" rel="noopener noreferrer" className="doc-link">
                      <IconoArchivo tipo={d.tipo_archivo} />
                      <div className="doc-link__info">
                        <div className="doc-link__name">{d.nombre}</div>
                        <div className="doc-link__meta">
                          {d.tipo_archivo}{d.tamano_bytes ? ` · ${Math.round(d.tamano_bytes / 1024)} KB` : ''}
                        </div>
                      </div>
                      <Icono nombre="download" className="icon icon--sm text-muted" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  Aún no hay documentos vinculados.
                </div>
              )}
            </section>
          </div>

          {/* Sidebar metadata */}
          <aside className="vstack aside-sticky">
            <div className="card card--padded-sm">
              <div className="page__eyebrow" style={{ marginBottom: 12 }}>Detalles</div>
              <dl className="dl-grid">
                <div>
                  <dt className="dl-label">Cargo principal</dt>
                  <dd className="dl-value">{pasos[0]?.cargo_responsable ?? '—'}</dd>
                </div>
                <div>
                  <dt className="dl-label">Versión actual</dt>
                  <dd className="dl-value text-mono">v{proceso.version}</dd>
                </div>
                <div>
                  <dt className="dl-label">Última actualización</dt>
                  <dd className="dl-value text-mono">
                    {new Date(proceso.fecha_actualizacion).toLocaleDateString('es-CO')}
                  </dd>
                </div>
                {lider && (
                  <div>
                    <dt className="dl-label">Líder de Gestión</dt>
                    <dd className="dl-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                      <span className="font-semibold" style={{ fontSize: 13.5 }}>{lider.nombre}</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {lider && (
              <div className="card callout">
                <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                  <Icono nombre="info" className="icon" style={{ color: 'var(--primary)' }} />
                  <strong style={{ color: 'var(--primary-ink)' }}>¿Encontraste algo desactualizado?</strong>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--primary-ink)', opacity: 0.85 }}>
                  Avísale al líder de Gestión escribiendo a{' '}
                  <a href={`mailto:${lider.correo}`} style={{ textDecoration: 'underline', fontWeight: 600 }}>
                    {lider.correo}
                  </a>.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  )
}
