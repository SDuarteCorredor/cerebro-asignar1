import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import IconoArchivo from '@/components/app/IconoArchivo'
import Icono from '@/components/app/Icono'
import PanelHistorial from './PanelHistorial'
import PasoExpandible from '@/components/app/PasoExpandible'
import type { PasoDetalle } from '@/components/app/PasoExpandible'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export default async function PaginaProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Link href={`/gestiones/${g?.id}`} className="hstack" style={{ gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                {g && <IconoGestion gestion={g} size={22} rounded={6} />}
                {g?.nombre}
              </Link>
              <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{proceso.nombre}</span>
            </div>
            <h1 className="page__title">{proceso.nombre}</h1>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-3)' }}>
              <div className="hstack" style={{ gap: 6 }}>
                <Icono nombre="folder" className="icon icon--sm" /> Gestión:{' '}
                <strong style={{ color: 'var(--text)' }}>{g?.nombre}</strong>
              </div>
              <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
              <div className="hstack" style={{ gap: 6, fontFamily: 'var(--font-mono)' }}>
                <Icono nombre="history" className="icon icon--sm" /> Versión {proceso.version}
              </div>
              <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
              <div style={{ fontFamily: 'var(--font-mono)' }}>
                Actualizado {new Date(proceso.fecha_actualizacion).toLocaleDateString('es-CO')}
              </div>
              <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 28, alignItems: 'flex-start' }}>
          <div className="vstack" style={{ gap: 24 }}>
            {/* Objetivo */}
            <section className="card" style={{ padding: 26 }}>
              <div className="page__eyebrow" style={{ marginBottom: 8 }}>Objetivo</div>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--text)' }}>{proceso.objetivo}</p>
            </section>

            {/* Pasos */}
            <section className="card" style={{ padding: 26 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Procedimiento</div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Pasos del Procedimiento</h2>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{pasos.length} pasos</span>
              </div>
              {pasos.length > 0 ? (
                <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pasos.map((s, i) => (
                    <PasoExpandible key={s.id} paso={s} index={i} total={pasos.length} />
                  ))}
                </ol>
              ) : (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border-strong)', borderRadius: 10 }}>
                  Este proceso aún no tiene pasos detallados.{puedeEditar && ' Edítalo para agregarlos.'}
                </div>
              )}
            </section>

            {/* Documentos */}
            <section className="card" style={{ padding: 26 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div className="page__eyebrow" style={{ marginBottom: 4 }}>Recursos</div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>Documentos Relacionados</h2>
                </div>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{documentos.length} archivos</span>
              </div>
              {documentos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {documentos.map((d) => (
                    <a key={d.id} href={d.url_descarga} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', transition: 'border-color 120ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <IconoArchivo tipo={d.tipo_archivo} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                          {d.tipo_archivo}{d.tamano_bytes ? ` · ${Math.round(d.tamano_bytes / 1024)} KB` : ''}
                        </div>
                      </div>
                      <Icono nombre="download" className="icon icon--sm" style={{ color: 'var(--text-3)' }} />
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border-strong)', borderRadius: 10 }}>
                  Aún no hay documentos vinculados.
                </div>
              )}
            </section>
          </div>

          {/* Sidebar metadata */}
          <aside className="vstack" style={{ gap: 14, position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 18 }}>
              <div className="page__eyebrow" style={{ marginBottom: 12 }}>Detalles</div>
              <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
                <div>
                  <dt style={{ fontSize: 12, color: 'var(--text-3)' }}>Cargo principal</dt>
                  <dd style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 14 }}>{pasos[0]?.cargo_responsable ?? '—'}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, color: 'var(--text-3)' }}>Versión actual</dt>
                  <dd style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-mono)' }}>v{proceso.version}</dd>
                </div>
                <div>
                  <dt style={{ fontSize: 12, color: 'var(--text-3)' }}>Última actualización</dt>
                  <dd style={{ margin: '2px 0 0', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                    {new Date(proceso.fecha_actualizacion).toLocaleDateString('es-CO')}
                  </dd>
                </div>
                {lider && (
                  <div>
                    <dt style={{ fontSize: 12, color: 'var(--text-3)' }}>Líder de Gestión</dt>
                    <dd style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{lider.nombre}</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {lider && (
              <div className="card" style={{ padding: 18, background: 'var(--primary-soft)', border: '1px solid var(--primary-soft-2)' }}>
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
