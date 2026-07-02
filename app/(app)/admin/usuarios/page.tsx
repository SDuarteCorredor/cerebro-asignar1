import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import NavAdmin from '../NavAdmin'
import Icono from '@/components/app/Icono'

const badgeRol: Record<string, string> = {
  admin: 'badge--primary',
  lider: 'badge--warning',
  colaborador: 'badge--neutral',
}
const etiquetaRol: Record<string, string> = {
  admin: 'Administrador',
  lider: 'Líder de Gestión',
  colaborador: 'Colaborador',
}

export default async function AdminUsuarios() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  // Queries separadas: más robusto que un select con joins nested
  const [
    { data: usuariosRaw, error: errUsr },
    { data: gestiones },
    { data: cargos },
  ] = await Promise.all([
    supabase.from('usuarios')
      .select('id, codigo_contrato, nombre, correo, rol, activo, sede, tiene_login, gestion_id, cargo_id')
      .order('nombre'),
    supabase.from('gestiones').select('id, nombre'),
    supabase.from('cargos').select('id, nombre, banda'),
  ])
  if (errUsr) console.error('Error cargando usuarios:', errUsr)

  const mapGestiones = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const mapCargos = new Map((cargos ?? []).map(c => [c.id, c]))
  const usuarios = (usuariosRaw ?? []).map(u => ({
    ...u,
    gestion_nombre: u.gestion_id ? mapGestiones.get(u.gestion_id) ?? null : null,
    cargo: u.cargo_id ? mapCargos.get(u.cargo_id) ?? null : null,
  }))

  const activos = usuarios.filter(u => u.activo).length
  const conLogin = usuarios.filter(u => u.tiene_login).length

  const { count: totalAprobaciones } = await supabase
    .from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')
  const { count: totalGestiones } = await supabase
    .from('gestiones').select('id', { count: 'exact', head: true }).eq('activa', true)

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Usuarios' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Panel de Administración</h1>
            <p className="page__subtitle">Configura las Gestiones, gestiona usuarios y aprueba el contenido enviado por los Líderes.</p>
          </div>
        </div>

        <NavAdmin activa="usuarios" aprobacionesPendientes={totalAprobaciones ?? 0} totalGestiones={totalGestiones ?? 0} totalUsuarios={usuarios.length} />

        <div className="filter-row">
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            <strong style={{ color: 'var(--text)' }}>{usuarios?.length ?? 0}</strong> registrados ·{' '}
            <strong style={{ color: 'var(--text)' }}>{activos}</strong> activos ·{' '}
            <strong style={{ color: 'var(--text)' }}>{conLogin}</strong> con login
          </span>
          <span className="spacer" />
          <Link href="/admin/usuarios/importar" className="btn btn--secondary btn--sm">
            <Icono nombre="upload" className="icon icon--sm" /> Importar lista
          </Link>
          <Link href="/admin/usuarios/nuevo" className="btn btn--primary btn--sm">
            <Icono nombre="plus" className="icon icon--sm" /> Nuevo usuario
          </Link>
        </div>

        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Cargo</th>
                  <th>Sede</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const gestionNombre = u.gestion_nombre ?? '—'
                  const cargo = u.cargo
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5 }}>
                        {u.codigo_contrato ?? '—'}
                      </td>
                      <td>
                        <div className="hstack" style={{ gap: 10 }}>
                          <div className="avatar avatar--sm">{obtenerIniciales(u.nombre)}</div>
                          <div>
                            <div className="row-title">{u.nombre}</div>
                            {u.correo && (
                              <div className="row-sub" style={{ fontFamily: 'var(--font-mono)' }}>{u.correo}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {cargo ? (
                          <div>
                            <div style={{ fontSize: 13 }}>{cargo.nombre}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{cargo.banda}</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin cargo</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {u.sede ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                        {u.gestion_id && (
                          <div className="row-sub">{gestionNombre}</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${badgeRol[u.rol] ?? 'badge--neutral'}`}>{etiquetaRol[u.rol] ?? u.rol}</span>
                      </td>
                      <td>
                        <span className={`badge badge--${u.activo ? 'success' : 'neutral'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/admin/usuarios/${u.id}`} className="btn btn--ghost btn--sm" title="Editar">
                          <Icono nombre="edit" className="icon icon--sm" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  )
}
