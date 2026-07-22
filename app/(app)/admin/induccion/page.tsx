import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormSesion from './FormSesion'

const badgeEstado: Record<string, string> = {
  programada: 'badge--neutral',
  en_curso: 'badge--warning',
  finalizada: 'badge--success',
  cancelada: 'badge--danger',
}
const etiquetaEstado: Record<string, string> = {
  programada: 'Programada', en_curso: 'En curso',
  finalizada: 'Finalizada', cancelada: 'Cancelada',
}

function fFecha(d: string) {
  const [a, m, dia] = d.split('-')
  return `${dia}/${m}/${a}`
}

export default async function AdminInduccion() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: sesiones } = await supabase
    .from('induccion_sesiones')
    .select('id, titulo, fecha, hora_inicio, modalidad, ciudad, estado, presentacion_path')
    .order('fecha', { ascending: false })

  const ids = (sesiones ?? []).map(s => s.id)
  const { data: participantes } = ids.length > 0
    ? await supabase.from('induccion_participantes').select('sesion_id').in('sesion_id', ids)
    : { data: [] as { sesion_id: string }[] }

  const conteo = new Map<string, number>()
  for (const p of participantes ?? []) {
    conteo.set(p.sesion_id, (conteo.get(p.sesion_id) ?? 0) + 1)
  }

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Inducción' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Acogida laboral</div>
            <h1 className="page__title">Jornadas de inducción</h1>
            <p className="page__subtitle">
              La charla en vivo de bienvenida. Aquí se prepara la jornada, se inscriben los participantes
              y se proyecta la presentación.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <FormSesion />
        </div>

        {(sesiones ?? []).length === 0 ? (
          <section className="card" style={{ padding: 40, textAlign: 'center' }}>
            <Icono nombre="calendar" className="icon icon--lg" style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Aún no hay jornadas</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Crea la primera para empezar a inscribir a quienes ingresan.
            </p>
          </section>
        ) : (
          <div className="vstack" style={{ gap: 10 }}>
            {(sesiones ?? []).map(s => (
              <Link key={s.id} href={`/admin/induccion/${s.id}`} className="card" style={{ padding: 16, display: 'block' }}>
                <div className="hstack" style={{ gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="hstack" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span className={`badge ${badgeEstado[s.estado] ?? 'badge--neutral'}`}>
                        {etiquetaEstado[s.estado] ?? s.estado}
                      </span>
                      <span className="badge badge--neutral">
                        {s.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                      </span>
                      {s.presentacion_path && (
                        <span className="hstack" style={{ gap: 4, fontSize: 11.5, color: 'var(--success-ink)' }}>
                          <Icono nombre="check" className="icon icon--sm" style={{ width: 13, height: 13 }} />
                          Con presentación
                        </span>
                      )}
                    </div>
                    <div className="row-title" style={{ fontSize: 15 }}>{s.titulo}</div>
                    <div className="row-sub">
                      <span className="text-mono">{fFecha(s.fecha)}</span>
                      {s.hora_inicio && <> · <span className="text-mono">{s.hora_inicio.slice(0, 5)}</span></>}
                      {s.ciudad && <> · {s.ciudad}</>}
                    </div>
                  </div>
                  <div className="hstack" style={{ gap: 14, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {conteo.get(s.id) ?? 0}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>participantes</div>
                    </div>
                    <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
