import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import ItemAcogida, { type ItemAcogidaData } from './ItemAcogida'
import { hoyISO } from '@/lib/documentos/vigencia'

const ETAPAS = [
  { clave: 'induccion', titulo: 'Inducción', aprueba: 'Talento Humano' },
  { clave: 'socializacion', titulo: 'Socialización', aprueba: 'Talento Humano' },
  { clave: 'entrenamiento', titulo: 'Entrenamiento', aprueba: 'Tu jefe inmediato' },
] as const

export default async function PaginaMiAcogida() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  // La RLS ya limita a lo que puedo ver; aquí busco la mía
  const { data: acogida } = await supabase
    .from('onboarding')
    .select('id, fecha_inicio, estado, firma_recibido, fecha_firma')
    .eq('usuario_id', sesion.id)
    .in('estado', ['en_curso', 'completado'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: itemsRaw } = acogida
    ? await supabase
        .from('onboarding_items')
        .select('id, etapa, orden, titulo, descripcion, obligatorio, url_recurso, fecha_limite, estado')
        .eq('onboarding_id', acogida.id)
        .order('orden')
    : { data: null }

  const items = (itemsRaw ?? []) as (ItemAcogidaData & { etapa: string; orden: number })[]
  const hoy = hoyISO()

  const total = items.length
  const hechos = items.filter(i => i.estado === 'reportado' || i.estado === 'aprobado').length
  const aprobados = items.filter(i => i.estado === 'aprobado').length
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Mi acogida' }]} />
      <main className="page page--narrow fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Acogida laboral</div>
            <h1 className="page__title">Mi acogida</h1>
            <p className="page__subtitle">
              Bienvenido a Asignar. Marca cada paso a medida que lo completes; tu responsable los irá aprobando.
            </p>
          </div>
        </div>

        {!acogida ? (
          <section className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Icono nombre="clipboard" className="icon icon--lg" style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Todavía no tienes una acogida abierta</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Talento Humano la activa cuando inicias tu proceso de ingreso.
            </p>
          </section>
        ) : (
          <>
            {/* Progreso */}
            <section className="card card--padded" style={{ marginBottom: 20 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{pct}%</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    {hechos} de {total} pasos · {aprobados} aprobados
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', textAlign: 'right' }}>
                  Iniciada el <span className="text-mono">{acogida.fecha_inicio.split('-').reverse().join('/')}</span>
                  {acogida.estado === 'completado' && (
                    <div><span className="badge badge--success" style={{ marginTop: 4 }}>Completada</span></div>
                  )}
                </div>
              </div>
              <div style={{ background: 'var(--border)', height: 8, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: pct === 100 ? 'var(--success)' : 'var(--primary)',
                  transition: 'width 200ms ease',
                }} />
              </div>
            </section>

            {/* Pasos por etapa */}
            <div className="vstack" style={{ gap: 22 }}>
              {ETAPAS.map(etapa => {
                const propios = items.filter(i => i.etapa === etapa.clave)
                if (propios.length === 0) return null
                const hechosEtapa = propios.filter(i => i.estado !== 'pendiente').length

                return (
                  <section key={etapa.clave} className="card card--padded">
                    <div className="hstack" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <h2 className="section-title" style={{ margin: 0 }}>{etapa.titulo}</h2>
                      <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {hechosEtapa}/{propios.length}
                      </span>
                    </div>
                    <p className="text-muted text-sm" style={{ margin: '0 0 14px' }}>
                      Aprueba: {etapa.aprueba}
                    </p>
                    <div className="vstack" style={{ gap: 8 }}>
                      {propios.map(it => <ItemAcogida key={it.id} item={it} hoy={hoy} />)}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </main>
    </>
  )
}
