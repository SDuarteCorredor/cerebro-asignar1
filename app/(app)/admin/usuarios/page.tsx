import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import NavAdmin from '../NavAdmin'
import Icono from '@/components/app/Icono'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

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
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: 'admin', gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, activo, gestion_id, gestion:gestiones(nombre)')
    .order('nombre')

  const { count: totalAprobaciones } = await supabase
    .from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')

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

        <NavAdmin activa="usuarios" aprobacionesPendientes={totalAprobaciones ?? 0} totalGestiones={0} totalUsuarios={usuarios?.length ?? 0} />

        <div className="filter-row">
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{usuarios?.length ?? 0} usuarios registrados.</span>
          <span className="spacer" />
          <button className="btn btn--primary btn--sm">
            <Icono nombre="invite" className="icon icon--sm" /> Invitar usuario
          </button>
        </div>

        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Gestión asociada</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(usuarios ?? []).map(u => {
                  const gestionRaw = u.gestion as { nombre: string }[] | { nombre: string } | null
                  const gestionNombre = (Array.isArray(gestionRaw) ? (gestionRaw[0] ?? null) : gestionRaw)?.nombre ?? '—'
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="hstack" style={{ gap: 10 }}>
                          <div className="avatar avatar--sm">{obtenerIniciales(u.nombre)}</div>
                          <span className="row-title">{u.nombre}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{u.correo}</td>
                      <td>
                        <span className={`badge ${badgeRol[u.rol] ?? 'badge--neutral'}`}>{etiquetaRol[u.rol] ?? u.rol}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{gestionNombre}</td>
                      <td>
                        <span className={`badge badge--${u.activo ? 'success' : 'neutral'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="hstack" style={{ gap: 4 }}>
                          <button className="btn btn--ghost btn--sm">
                            <Icono nombre="edit" className="icon icon--sm" />
                          </button>
                          <button className="btn btn--ghost btn--sm">
                            <Icono nombre="moreH" className="icon icon--sm" />
                          </button>
                        </div>
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
