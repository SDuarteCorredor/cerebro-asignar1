import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import NavAdmin from '../NavAdmin'
import IconoGestion from '@/components/app/IconoGestion'
import Icono from '@/components/app/Icono'

export default async function AdminGestiones() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: gestiones } = await supabase
    .from('gestiones')
    .select(`
      id, nombre, descripcion, icono, color_soft, color_primary, activa,
      lider:usuarios!gestiones_lider_id_fkey(id, nombre),
      procesos_activos:procesos(count)
    `)
    .eq('procesos.estado', 'activo')
    .order('nombre')

  const { count: totalAprobaciones } = await supabase
    .from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')
  const { count: totalUsuarios } = await supabase
    .from('usuarios').select('id', { count: 'exact', head: true })

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Gestiones' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Panel de Administración</h1>
            <p className="page__subtitle">Configura las Gestiones, gestiona usuarios y aprueba el contenido enviado por los Líderes.</p>
          </div>
        </div>

        <NavAdmin activa="gestiones" aprobacionesPendientes={totalAprobaciones ?? 0} totalGestiones={gestiones?.length ?? 0} totalUsuarios={totalUsuarios ?? 0} />

        <div className="filter-row">
          <span className="text-sm text-muted">Crea, edita y asigna líderes a cada Gestión.</span>
          <span className="spacer" />
          <button className="btn btn--primary btn--sm">
            <Icono nombre="plus" className="icon icon--sm" /> Nueva Gestión
          </button>
        </div>

        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Gestión</th>
                  <th>Líder asignado</th>
                  <th style={{ textAlign: 'right' }}>Procesos activos</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(gestiones ?? []).map(g => {
                  const liderRaw = g.lider as { id: string; nombre: string }[] | { id: string; nombre: string } | null
                  const lider: { id: string; nombre: string } | null = Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw
                  const activos = (g.procesos_activos as { count: number }[])?.[0]?.count ?? 0
                  return (
                    <tr key={g.id}>
                      <td>
                        <div className="hstack">
                          <IconoGestion gestion={g} size={32} rounded={8} />
                          <div>
                            <div className="row-title">{g.nombre}</div>
                            <div className="row-sub" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descripcion}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {lider ? (
                          <div className="hstack" style={{ gap: 8 }}>
                            <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                            <span className="text-sm">{lider.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin líder</span>
                        )}
                      </td>
                      <td className="tabular-nums font-semibold" style={{ textAlign: 'right' }}>{activos}</td>
                      <td>
                        <span className={`badge badge--${g.activa ? 'success' : 'neutral'}`}>
                          {g.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className="hstack" style={{ gap: 4 }}>
                          <Link href={`/gestiones/${g.id}`} className="btn btn--ghost btn--sm">
                            <Icono nombre="eye" className="icon icon--sm" />
                          </Link>
                          <button className="btn btn--ghost btn--sm">
                            <Icono nombre="edit" className="icon icon--sm" />
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
