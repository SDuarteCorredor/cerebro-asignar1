import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FilaHomologacion, { type TextoPendiente, type CargoOpc } from './FilaHomologacion'

export default async function AdminHomologacion() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const [{ data: pendientes }, { data: cargos }, { count: resueltos }] = await Promise.all([
    supabase.rpc('textos_cargo_pendientes'),
    supabase.from('cargos').select('id, nombre, banda').order('nombre'),
    supabase.from('cargo_homologacion').select('id', { count: 'exact', head: true }),
  ])

  const lista = (pendientes ?? []) as TextoPendiente[]
  const totalActividades = lista.reduce((a, b) => a + Number(b.veces), 0)

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Homologar cargos' }]} />
      <main className="page page--narrow fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Procesos y procedimientos</div>
            <h1 className="page__title">Homologar cargos</h1>
            <p className="page__subtitle">
              Los procedimientos antiguos traen el cargo escrito a mano. Aquí se conecta cada uno con el
              catálogo para que alimente el manual de cargo. Cada texto se resuelve una vez y se aplica a
              todas sus actividades.
            </p>
          </div>
        </div>

        <div className="grid-stats" style={{ marginBottom: 22 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: lista.length ? 'var(--warning-ink)' : 'var(--success-ink)' }}>
              {lista.length}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>textos por resolver</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalActividades}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>actividades afectadas</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-ink)' }}>{resueltos ?? 0}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>ya resueltos</div>
          </div>
        </div>

        {lista.length === 0 ? (
          <section className="card" style={{ padding: 44, textAlign: 'center' }}>
            <Icono nombre="check" className="icon icon--lg" style={{ color: 'var(--success)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Todo homologado</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Ningún cargo quedó en texto libre. El manual de cargo ya se puede generar completo.
            </p>
          </section>
        ) : (
          <>
            <div className="card" style={{ padding: 12, marginBottom: 16, background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}>
              <div className="hstack" style={{ gap: 8, color: 'var(--on-primary-soft)', alignItems: 'flex-start' }}>
                <Icono nombre="info" className="icon icon--sm" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13 }}>
                  Ordenados por frecuencia. Los <strong>cargos reales</strong> (Analista, Coordinador…) se
                  enlazan al catálogo; <strong>Cliente, COPASST o &ldquo;Coordinadores&rdquo;</strong> se marcan
                  como &ldquo;no es un cargo&rdquo;.
                </span>
              </div>
            </div>

            <div className="vstack" style={{ gap: 10 }}>
              {lista.map(item => (
                <FilaHomologacion key={item.texto} item={item} cargos={(cargos ?? []) as CargoOpc[]} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
