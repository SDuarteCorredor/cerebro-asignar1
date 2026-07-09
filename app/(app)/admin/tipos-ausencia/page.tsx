import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import FilaTipo from './FilaTipo'

export default async function AdminTiposAusencia() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: tipos } = await supabase
    .from('tipos_ausencia')
    .select('id, nombre, remunerado, descuenta, requiere_soporte, requiere_doble_validacion, activo')
    .order('orden')

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Admin', href: '/admin/gestiones' },
        { etiqueta: 'Tipos de ausencia' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <div className="page__eyebrow">Administración · Nómina</div>
          <h1 className="page__title">Tipos de ausencia</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            Configura cómo afecta cada tipo a la nómina. Los cambios se guardan al instante.
          </p>
        </div>

        <div className="card" style={{ padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text-3)' }}>
          <strong>Remunerado</strong>: se paga el tiempo · <strong>Descuenta</strong>: reduce el pago de la quincena ·
          {' '}<strong>Requiere soporte</strong>: obliga adjuntar archivo · <strong>Doble validación</strong>: además del jefe, un 2º aprobador.
        </div>

        <section className="card card--table">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Tipo</th>
                <th style={{ width: 110, textAlign: 'center' }}>Remunerado</th>
                <th style={{ width: 110, textAlign: 'center' }}>Descuenta</th>
                <th style={{ width: 120, textAlign: 'center' }}>Req. soporte</th>
                <th style={{ width: 120, textAlign: 'center' }}>Doble valid.</th>
                <th style={{ width: 90, textAlign: 'center' }}>Activo</th>
              </tr>
            </thead>
            <tbody>
              {(tipos ?? []).map(t => <FilaTipo key={t.id} tipo={t} />)}
            </tbody>
          </table>
        </section>
      </main>
    </>
  )
}
