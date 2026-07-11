import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FilaAusencia from './FilaAusencia'

export default async function MisAusenciasPage() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: ausencias } = await supabase
    .from('ausencias')
    .select('id, tipo_id, fecha_desde, fecha_hasta, horario, estado, motivo_rechazo, created_at')
    .eq('solicitante_id', sesion.id)
    .order('created_at', { ascending: false })

  const tipoIds = Array.from(new Set((ausencias ?? []).map(a => a.tipo_id)))
  const { data: tipos } = tipoIds.length > 0
    ? await supabase.from('tipos_ausencia').select('id, nombre').in('id', tipoIds)
    : { data: [] as { id: string; nombre: string }[] }
  const mapTipo = new Map((tipos ?? []).map(t => [t.id, t.nombre]))

  const pendientes = (ausencias ?? []).filter(a => a.estado === 'pendiente_jefe' || a.estado === 'pendiente_segundo').length
  const aprobadas = (ausencias ?? []).filter(a => a.estado === 'aprobada').length

  // ¿Tengo solicitudes que aprobar? (como jefe directo, o como TH en 2ª validación)
  const esAdmin = sesion.rol === 'admin'
  const [{ count: porAprobarJefe }, { count: porAprobarSegundo }] = await Promise.all([
    supabase.from('ausencias').select('id', { count: 'exact', head: true })
      .eq('jefe_id', sesion.id).eq('estado', 'pendiente_jefe'),
    esAdmin
      ? supabase.from('ausencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente_segundo')
      : Promise.resolve({ count: 0 }),
  ])
  const porAprobar = (porAprobarJefe ?? 0) + (porAprobarSegundo ?? 0)

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Ausencias' }]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div className="page__eyebrow">Talento Humano</div>
            <h1 className="page__title">Mis permisos y ausencias</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Solicita permisos y consulta el estado de tus solicitudes.
            </p>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            {porAprobar > 0 && (
              <Link href="/ausencias/bandeja" className="btn btn--secondary btn--sm">
                <Icono nombre="inbox" className="icon icon--sm" /> Por aprobar
                <span className="nav-item__badge" style={{ marginLeft: 4 }}>{porAprobar}</span>
              </Link>
            )}
            <Link href="/ausencias/nueva" className="btn btn--primary btn--sm">
              <Icono nombre="plus" className="icon icon--sm" /> Nueva solicitud
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 22 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ausencias?.length ?? 0}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Solicitudes totales</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning-ink)' }}>{pendientes}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Pendientes</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-ink)' }}>{aprobadas}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Aprobadas</div>
          </div>
        </div>

        {(!ausencias || ausencias.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🗓️</div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-3)' }}>
              Aún no has registrado permisos ni ausencias.
            </p>
            <Link href="/ausencias/nueva" className="btn btn--primary btn--sm">Crear la primera</Link>
          </section>
        ) : (
          <section className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th style={{ width: 180 }}>Fechas</th>
                  <th style={{ width: 110 }}>Horario</th>
                  <th style={{ width: 180 }}>Estado</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {ausencias.map(a => (
                  <FilaAusencia
                    key={a.id}
                    id={a.id}
                    tipo={mapTipo.get(a.tipo_id) ?? '—'}
                    desde={a.fecha_desde}
                    hasta={a.fecha_hasta}
                    horario={a.horario}
                    estado={a.estado}
                    motivoRechazo={a.motivo_rechazo}
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
