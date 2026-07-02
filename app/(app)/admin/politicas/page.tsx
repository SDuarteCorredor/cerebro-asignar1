import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormularioNueva from './FormularioNueva'
import FilaAdmin from './FilaAdmin'

export default async function AdminPoliticas() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: politicas } = await supabase
    .from('politicas')
    .select('id, nombre, categoria, descripcion, version_actual, activo, updated_at')
    .order('categoria').order('nombre')

  const ids = (politicas ?? []).map(p => p.id)
  const { data: versionesCount } = ids.length > 0
    ? await supabase.from('politicas_versiones').select('politica_id').in('politica_id', ids)
    : { data: [] as { politica_id: string }[] }
  const conteoPorPol = new Map<string, number>()
  for (const v of versionesCount ?? []) {
    conteoPorPol.set(v.politica_id, (conteoPorPol.get(v.politica_id) ?? 0) + 1)
  }

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Admin', href: '/admin' },
        { etiqueta: 'Políticas y Reglamentos' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ marginBottom: 20, justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Políticas y Reglamentos</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Solo administradores pueden subir, actualizar o eliminar documentos.
            </p>
          </div>
          <Link href="/politicas" className="btn btn--ghost btn--sm">
            Vista pública <Icono nombre="arrowRight" className="icon icon--sm" />
          </Link>
        </div>

        <FormularioNueva />

        {(!politicas || politicas.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Aún no hay documentos. Sube el primero con el botón de arriba.
            </p>
          </section>
        ) : (
          <section className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th style={{ width: 110 }}>Categoría</th>
                  <th style={{ width: 90 }}>Vigente</th>
                  <th style={{ width: 70, textAlign: 'center' }}>Versiones</th>
                  <th style={{ width: 90 }}>Estado</th>
                  <th style={{ width: 260, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {politicas.map(p => (
                  <FilaAdmin
                    key={p.id}
                    politica={{
                      id: p.id,
                      nombre: p.nombre,
                      categoria: p.categoria,
                      descripcion: p.descripcion,
                      version_actual: p.version_actual,
                      activo: p.activo,
                      numVersiones: conteoPorPol.get(p.id) ?? 0,
                    }}
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
