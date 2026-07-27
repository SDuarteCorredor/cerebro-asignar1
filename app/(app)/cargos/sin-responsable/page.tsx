import { redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

interface Fila { cargo_id: string; nombre: string; banda: string; actividades: number; gestiones: number }

export default async function PaginaCargasSinResponsable() {
  const sesion = await obtenerSesion()
  // Riesgo de auditoría: reservado a admin (TH y Control Interno) y líderes
  if (sesion.rol === 'colaborador') redirect('/cargos')

  const supabase = await crearClienteServidor()
  const { data } = await supabase.rpc('cargos_sin_responsable')
  const filas = (data ?? []) as Fila[]
  const totalActividades = filas.reduce((a, b) => a + b.actividades, 0)

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Manuales de cargo', href: '/cargos' },
        { etiqueta: 'Cargas sin responsable' },
      ]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Control de cargas</div>
            <h1 className="page__title">Cargas sin responsable</h1>
            <p className="page__subtitle">
              Cargos con actividades a su cargo pero sin nadie activo que las ejecute. Es el punto ciego
              que suele escaparse cuando alguien se va: aquí queda a la vista para reasignar a tiempo.
            </p>
          </div>
        </div>

        {filas.length === 0 ? (
          <section className="card" style={{ padding: 44, textAlign: 'center' }}>
            <Icono nombre="check" className="icon icon--lg" style={{ color: 'var(--success)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Todo cubierto</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Cada cargo con funciones tiene al menos una persona activa. Sin cargas huérfanas.
            </p>
          </section>
        ) : (
          <>
            <div className="card" style={{ padding: 14, marginBottom: 18, background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
              <div className="hstack" style={{ gap: 8, color: 'var(--danger-ink)' }}>
                <Icono nombre="info" className="icon icon--sm" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13.5 }}>
                  <strong>{filas.length}</strong> cargo{filas.length === 1 ? '' : 's'} sin responsable,
                  con <strong>{totalActividades}</strong> actividad{totalActividades === 1 ? '' : 'es'} en riesgo.
                  Reasigna esas funciones a otro cargo o cubre la vacante.
                </span>
              </div>
            </div>

            <section className="card card--table">
              <div className="table-scroll">
                <table className="table table--in-card">
                  <thead>
                    <tr>
                      <th>Cargo</th>
                      <th style={{ width: 70 }}>Banda</th>
                      <th style={{ width: 130, textAlign: 'center' }}>Actividades en riesgo</th>
                      <th style={{ width: 90, textAlign: 'center' }}>Gestiones</th>
                      <th style={{ width: 90 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map(f => (
                      <tr key={f.cargo_id}>
                        <td><div className="row-title">{f.nombre}</div></td>
                        <td><span className="badge badge--neutral badge--no-dot">{f.banda}</span></td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--danger-ink)' }}>
                          {f.actividades}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{f.gestiones}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/cargos/${f.cargo_id}`} className="btn btn--ghost btn--sm">Ver</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  )
}
