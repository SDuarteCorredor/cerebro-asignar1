import { redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import BadgeEstado from '@/components/app/BadgeEstado'
import {
  calcularVigencia, etiquetaVigencia, badgeVigencia, ordenVigencia, textoVigencia,
  hoyISO, DIAS_AVISO, type Vigencia,
} from '@/lib/documentos/vigencia'

function fFecha(d?: string | null) {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return a && m && dia ? `${dia}/${m}/${a}` : d
}

export default async function PaginaRevisionDocumental() {
  const sesion = await obtenerSesion()
  if (sesion.rol === 'colaborador') redirect('/gestiones')

  const supabase = await crearClienteServidor()

  let consulta = supabase
    .from('procesos')
    .select('id, nombre, codigo, version, estado, fecha_proxima_revision, gestion:gestiones(id, nombre), tipo_documento:tipos_documento(nombre)')

  // El líder solo revisa los documentos de su gestión; el admin ve todos.
  if (sesion.rol === 'lider' && sesion.gestion_id) {
    consulta = consulta.eq('gestion_id', sesion.gestion_id)
  }

  const { data: procesosRaw } = await consulta

  const hoy = hoyISO()
  const filas = (procesosRaw ?? []).map(p => {
    const gRaw = p.gestion as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
    const gestion = Array.isArray(gRaw) ? (gRaw[0] ?? null) : gRaw
    const tRaw = p.tipo_documento as unknown as { nombre: string }[] | { nombre: string } | null
    const tipo = Array.isArray(tRaw) ? (tRaw[0] ?? null) : tRaw
    const estadoVig = calcularVigencia(p.fecha_proxima_revision, hoy)
    return { ...p, gestion, tipo, ...estadoVig }
  }).sort((a, b) => {
    const dif = ordenVigencia[a.vigencia] - ordenVigencia[b.vigencia]
    if (dif !== 0) return dif
    return (a.dias ?? 99999) - (b.dias ?? 99999)
  })

  const cuenta = (v: Vigencia) => filas.filter(f => f.vigencia === v).length
  const vencidos = cuenta('vencido')
  const porVencer = cuenta('por_vencer')
  const sinFecha = cuenta('sin_fecha')
  const vigentes = cuenta('vigente')
  const requierenAtencion = vencidos + porVencer

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Procesos y Procedimientos', href: '/gestiones' },
        { etiqueta: 'Revisión documental' },
      ]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Gestión documental</div>
            <h1 className="page__title">Revisión documental</h1>
            <p className="page__subtitle">
              {sesion.rol === 'admin'
                ? 'Documentos de toda la organización según su fecha de próxima revisión.'
                : 'Documentos de tu gestión según su fecha de próxima revisión.'}
              {' '}Se avisa con {DIAS_AVISO} días de antelación.
            </p>
          </div>
        </div>

        <div className="grid-stats" style={{ marginBottom: 24 }}>
          <Kpi num={vencidos} label="Vencidos" color="var(--danger-ink)" />
          <Kpi num={porVencer} label={`Por vencer (${DIAS_AVISO} días)`} color="var(--warning-ink)" />
          <Kpi num={sinFecha} label="Sin fecha de revisión" />
          <Kpi num={vigentes} label="Vigentes" color="var(--success-ink)" />
        </div>

        {requierenAtencion > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 18, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
            <div className="hstack" style={{ gap: 8, color: 'var(--warning-ink)' }}>
              <Icono nombre="info" className="icon icon--sm" />
              <span style={{ fontSize: 13.5 }}>
                <strong>{requierenAtencion}</strong> {requierenAtencion === 1 ? 'documento requiere' : 'documentos requieren'} revisión.
                Actualízalos y vuelve a enviarlos a aprobación para renovar su vigencia.
              </span>
            </div>
          </div>
        )}

        {filas.length === 0 ? (
          <section className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>No hay documentos para mostrar.</p>
          </section>
        ) : (
          <section className="card card--table">
            <div className="table-scroll">
              <table className="table table--in-card">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Gestión</th>
                    <th style={{ width: 110 }}>Código</th>
                    <th style={{ width: 110 }}>Estado</th>
                    <th style={{ width: 130 }}>Próx. revisión</th>
                    <th style={{ width: 180 }}>Vigencia</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {filas.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div className="row-title">{f.nombre}</div>
                        <div className="row-sub">{f.tipo?.nombre ?? 'Sin tipo'} · v{f.version}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{f.gestion?.nombre ?? '—'}</td>
                      <td className="text-mono" style={{ fontSize: 12.5 }}>{f.codigo ?? '—'}</td>
                      <td><BadgeEstado estado={f.estado} /></td>
                      <td className="text-mono" style={{ fontSize: 12.5 }}>{fFecha(f.fecha_proxima_revision)}</td>
                      <td>
                        <span className={`badge ${badgeVigencia[f.vigencia]}`}>{etiquetaVigencia[f.vigencia]}</span>
                        {f.vigencia !== 'vigente' && (
                          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                            {textoVigencia({ vigencia: f.vigencia, dias: f.dias })}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/procesos/${f.id}`} className="btn btn--ghost btn--sm">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  )
}

function Kpi({ num, label, color }: { num: number; label: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text)' }}>{num}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}
