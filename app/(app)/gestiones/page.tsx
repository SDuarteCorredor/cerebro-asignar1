import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import Icono from '@/components/app/Icono'

export default async function PaginaGestiones() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: gestiones } = await supabase
    .from('gestiones')
    .select(`
      id, nombre, descripcion, icono, color_soft, color_primary,
      lider:usuarios!gestiones_lider_id_fkey(id, nombre),
      procesos_activos:procesos(count)
    `)
    .eq('activa', true)
    .eq('procesos.estado', 'activo')
    .order('nombre')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Procesos y Procedimientos' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Repositorio</div>
            <h1 className="page__title">Procesos y Procedimientos</h1>
            <p className="page__subtitle">Selecciona una Gestión para ver sus procesos documentados.</p>
          </div>
        </div>

        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Gestión</th>
                  <th>Líder</th>
                  <th style={{ textAlign: 'right' }}>Procesos activos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(gestiones ?? []).map(g => {
                  const liderRaw = g.lider as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
                  const lider = Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw
                  const activos = (g.procesos_activos as { count: number }[])?.[0]?.count ?? 0
                  return (
                    <tr key={g.id} style={{ cursor: 'pointer' }}>
                      <td>
                        <Link href={`/gestiones/${g.id}`} style={{ display: 'block' }}>
                          <div className="hstack">
                            <IconoGestion gestion={g} size={32} rounded={8} />
                            <div>
                              <div className="row-title">{g.nombre}</div>
                              <div className="row-sub" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.descripcion}</div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td>
                        {lider && (
                          <div className="hstack" style={{ gap: 8 }}>
                            <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                            <span style={{ fontSize: 13 }}>{lider.nombre}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{activos}</td>
                      <td>
                        <Link href={`/gestiones/${g.id}`}>
                          <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
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
