import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormAgregar from './FormAgregar'
import FilaOverride from './FilaOverride'

export default async function AdminSedes() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: overrides } = await supabase
    .from('sede_overrides')
    .select('codigo_contrato, sede, motivo, updated_at')
    .order('codigo_contrato')

  const codigos = (overrides ?? []).map(o => o.codigo_contrato)
  const { data: usuarios } = codigos.length > 0
    ? await supabase.from('usuarios').select('codigo_contrato, nombre').in('codigo_contrato', codigos)
    : { data: [] as { codigo_contrato: string; nombre: string }[] }
  const mapNombre = new Map((usuarios ?? []).map(u => [u.codigo_contrato, u.nombre]))

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Admin', href: '/admin/gestiones' },
        { etiqueta: 'Usuarios', href: '/admin/usuarios' },
        { etiqueta: 'Excepciones de sede' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ marginBottom: 20, justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Excepciones de sede</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              El importador infiere la sede por CCF. Aquí se sobreescribe para colaboradores específicos.
            </p>
          </div>
          <Link href="/admin/usuarios/importar" className="btn btn--ghost btn--sm">
            <Icono nombre="upload" className="icon icon--sm" /> Ir al importador
          </Link>
        </div>

        <FormAgregar />

        {(!overrides || overrides.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              No hay excepciones registradas. Todos los colaboradores toman la sede por defecto de su CCF.
            </p>
          </section>
        ) : (
          <section className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Código</th>
                  <th>Colaborador</th>
                  <th style={{ width: 140 }}>Sede forzada</th>
                  <th>Motivo</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {overrides.map(o => (
                  <FilaOverride
                    key={o.codigo_contrato}
                    codigo={o.codigo_contrato}
                    sede={o.sede}
                    motivo={o.motivo}
                    nombre={mapNombre.get(o.codigo_contrato) ?? '(sin registro de colaborador)'}
                  />
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  )
}
