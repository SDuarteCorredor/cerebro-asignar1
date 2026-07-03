import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

const badgeRol: Record<string, string> = {
  admin: 'badge--primary',
  lider: 'badge--warning',
  colaborador: 'badge--neutral',
}

function formatearFecha(f: string | null) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PerfilUsuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: u } = await supabase
    .from('usuarios')
    .select('id, codigo_contrato, nombre, correo, celular, rol, activo, sede, ciudad, departamento, direccion, tipo_contrato, fecha_ingreso, fecha_nacimiento, cargo_id, jefe_id, gestion_id, tiene_login')
    .eq('id', id).single()
  if (!u) notFound()

  const esElMismo = sesion.id === u.id
  const esAdmin = sesion.rol === 'admin'
  const esJefe = sesion.id === u.jefe_id
  if (!esElMismo && !esAdmin && !esJefe) {
    // Solo se permite ver el propio perfil, el de tu jefe superior o si eres jefe/admin
    // (los pares no acceden a datos de contrato)
    redirect('/dashboard')
  }

  const [{ data: cargo }, { data: gestion }, { data: jefe }, { data: reportes }] = await Promise.all([
    u.cargo_id ? supabase.from('cargos').select('nombre, banda').eq('id', u.cargo_id).single() : Promise.resolve({ data: null }),
    u.gestion_id ? supabase.from('gestiones').select('id, nombre').eq('id', u.gestion_id).single() : Promise.resolve({ data: null }),
    u.jefe_id ? supabase.from('usuarios').select('id, nombre, codigo_contrato').eq('id', u.jefe_id).single() : Promise.resolve({ data: null }),
    supabase.from('usuarios').select('id, nombre, codigo_contrato, cargo_id').eq('jefe_id', id).eq('activo', true).order('nombre'),
  ])

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Perfil' },
        { etiqueta: u.nombre },
      ]} />
      <main className="page fade-up">
        {/* Header */}
        <section className="card" style={{ padding: 26, marginBottom: 20 }}>
          <div className="hstack" style={{ gap: 18, alignItems: 'flex-start' }}>
            <div className="avatar avatar--lg" style={{ width: 72, height: 72, fontSize: 24, flexShrink: 0 }}>
              {obtenerIniciales(u.nombre)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className={`badge ${badgeRol[u.rol] ?? 'badge--neutral'}`}>{u.rol}</span>
                {!u.activo && <span className="badge badge--danger">Inactivo</span>}
                {u.tiene_login
                  ? <span className="badge badge--success badge--no-dot"><Icono nombre="check" className="icon icon--sm" /> Con login</span>
                  : <span className="badge badge--warning">Sin login</span>}
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{u.nombre}</h1>
              <div className="hstack" style={{ gap: 10, marginTop: 6, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                {u.codigo_contrato && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{u.codigo_contrato}</span>}
                {cargo?.nombre && <span>· {cargo.nombre}</span>}
                {cargo?.banda && <span style={{ fontFamily: 'var(--font-mono)' }}>· {cargo.banda}</span>}
                {gestion?.nombre && (
                  <>
                    <span>·</span>
                    <Link href={`/gestiones/${gestion.id}`} style={{ color: 'var(--primary-ink)' }}>{gestion.nombre}</Link>
                  </>
                )}
              </div>
            </div>
            {esAdmin && (
              <Link href={`/admin/usuarios/${u.id}`} className="btn btn--ghost btn--sm">
                <Icono nombre="edit" className="icon icon--sm" /> Editar
              </Link>
            )}
          </div>
        </section>

        <div className="layout-main-aside-wide">
          {/* Datos y contacto */}
          <div className="vstack" style={{ gap: 18 }}>
            <section className="card" style={{ padding: 20 }}>
              <div className="page__eyebrow" style={{ marginBottom: 12 }}>Contacto y ubicación</div>
              <dl className="dl-grid dl-grid--2col">
                <div><dt className="dl-label">Correo</dt><dd className="dl-value">{u.correo ?? '—'}</dd></div>
                <div><dt className="dl-label">Celular</dt><dd className="dl-value">{u.celular ?? '—'}</dd></div>
                <div><dt className="dl-label">Sede</dt><dd className="dl-value">{u.sede ?? '—'}</dd></div>
                <div><dt className="dl-label">Ciudad</dt><dd className="dl-value">{u.ciudad ?? '—'}{u.departamento ? `, ${u.departamento}` : ''}</dd></div>
                {(esElMismo || esAdmin) && (
                  <div style={{ gridColumn: '1 / -1' }}><dt className="dl-label">Dirección</dt><dd className="dl-value">{u.direccion ?? '—'}</dd></div>
                )}
              </dl>
            </section>

            {(esElMismo || esAdmin || esJefe) && (
              <section className="card" style={{ padding: 20 }}>
                <div className="page__eyebrow" style={{ marginBottom: 12 }}>Datos laborales</div>
                <dl className="dl-grid dl-grid--2col">
                  <div><dt className="dl-label">Tipo de contrato</dt><dd className="dl-value">{u.tipo_contrato ?? '—'}</dd></div>
                  <div><dt className="dl-label">Fecha de ingreso</dt><dd className="dl-value">{formatearFecha(u.fecha_ingreso)}</dd></div>
                  {esAdmin && (
                    <div><dt className="dl-label">Fecha de nacimiento</dt><dd className="dl-value">{formatearFecha(u.fecha_nacimiento)}</dd></div>
                  )}
                </dl>
              </section>
            )}
          </div>

          {/* Cadena de mando y equipo */}
          <div className="vstack" style={{ gap: 18 }}>
            <section className="card" style={{ padding: 20 }}>
              <div className="page__eyebrow" style={{ marginBottom: 12 }}>Jefe directo</div>
              {jefe ? (
                <Link href={`/perfil/${jefe.id}`} className="hstack" style={{ gap: 10, textDecoration: 'none', color: 'var(--text)' }}>
                  <div className="avatar avatar--sm">{obtenerIniciales(jefe.nombre)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{jefe.nombre}</div>
                    {jefe.codigo_contrato && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{jefe.codigo_contrato}</div>
                    )}
                  </div>
                </Link>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>Sin jefe asignado.</p>
              )}
            </section>

            <section className="card" style={{ padding: 20 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="page__eyebrow" style={{ margin: 0 }}>Reportes directos</div>
                <span className="section-count">{(reportes ?? []).length}</span>
              </div>
              {(reportes ?? []).length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>No tiene reportes directos.</p>
              ) : (
                <div className="vstack" style={{ gap: 8 }}>
                  {(reportes ?? []).map(r => (
                    <Link key={r.id} href={`/perfil/${r.id}`} className="hstack" style={{ gap: 10, textDecoration: 'none', color: 'var(--text)' }}>
                      <div className="avatar avatar--sm">{obtenerIniciales(r.nombre)}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</div>
                        {r.codigo_contrato && (
                          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.codigo_contrato}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
