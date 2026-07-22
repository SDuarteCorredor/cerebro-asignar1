import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'
import IconoGestion from '@/components/app/IconoGestion'
import { calcularVigencia } from '@/lib/documentos/vigencia'

interface Props {
  usuarioId: string
  esAdmin: boolean
}

/** Panel administrativo del líder: procesos de sus gestiones con estado + vencimientos. */
export default async function MiGestionProcesos({ usuarioId, esAdmin }: Props) {
  const supabase = await crearClienteServidor()

  // Gestiones que lidera (o todas si es admin)
  const { data: gestiones } = esAdmin
    ? await supabase.from('gestiones').select('id, nombre, icono, color_soft, color_primary').eq('activa', true).order('nombre')
    : await supabase.from('gestiones').select('id, nombre, icono, color_soft, color_primary').eq('lider_id', usuarioId).eq('activa', true)

  if (!gestiones || gestiones.length === 0) return null
  const gestionIds = gestiones.map(g => g.id)

  const { data: procesos } = await supabase
    .from('procesos')
    .select('id, nombre, estado, gestion_id, fecha_proxima_revision')
    .in('gestion_id', gestionIds)
    .in('estado', ['borrador', 'en_revision', 'activo'])

  const gestionMap = new Map(gestiones.map(g => [g.id, g]))

  let vencidos = 0, porVencer = 0, enRevision = 0, borradores = 0
  interface Fila { id: string; nombre: string; gestion_id: string; motivo: string; badge: string }
  const filas: Fila[] = []

  for (const p of procesos ?? []) {
    if (p.estado === 'en_revision') {
      enRevision++
      filas.push({ id: p.id, nombre: p.nombre, gestion_id: p.gestion_id, motivo: 'En revisión', badge: 'badge--primary' })
      continue
    }
    if (p.estado === 'borrador') {
      borradores++
      filas.push({ id: p.id, nombre: p.nombre, gestion_id: p.gestion_id, motivo: 'Borrador', badge: 'badge--neutral' })
      continue
    }
    // activo — chequeo vigencia
    const v = calcularVigencia(p.fecha_proxima_revision as string | null)
    if (v.vigencia === 'vencido') {
      vencidos++
      filas.push({ id: p.id, nombre: p.nombre, gestion_id: p.gestion_id, motivo: `Venció hace ${Math.abs(v.dias!)} d`, badge: 'badge--danger' })
    } else if (v.vigencia === 'por_vencer') {
      porVencer++
      filas.push({ id: p.id, nombre: p.nombre, gestion_id: p.gestion_id, motivo: `Vence en ${v.dias} d`, badge: 'badge--warning' })
    }
  }

  // Ordenar: vencidos > por vencer > en revisión > borrador
  filas.sort((a, b) => {
    const orden = ['badge--danger', 'badge--warning', 'badge--primary', 'badge--neutral']
    return orden.indexOf(a.badge) - orden.indexOf(b.badge)
  })
  const top = filas.slice(0, 6)

  if (vencidos + porVencer + enRevision + borradores === 0) return null

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Mi gestión — procesos por atender</h2>
        <Link href="/procesos/revision" className="btn btn--ghost btn--sm">
          Todos <Icono nombre="arrowRight" className="icon icon--sm" />
        </Link>
      </div>

      <div className="grid-stats" style={{ marginBottom: 14 }}>
        <KPI num={vencidos} label="Vencidos" color="var(--danger-ink)" />
        <KPI num={porVencer} label="Por vencer" color="var(--warning-ink)" />
        <KPI num={enRevision} label="En revisión" color="var(--primary-ink)" />
        <KPI num={borradores} label="Borradores" color="var(--text-2)" />
      </div>

      {top.length > 0 && (
        <div className="card card--table">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Proceso</th>
                <th style={{ width: 180 }}>Gestión</th>
                <th style={{ width: 140 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {top.map(f => {
                const g = gestionMap.get(f.gestion_id)
                return (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/procesos/${f.id}`} className="row-title" style={{ display: 'block' }}>
                        {f.nombre}
                      </Link>
                    </td>
                    <td>
                      {g && (
                        <div className="hstack" style={{ gap: 8 }}>
                          <IconoGestion gestion={g} size={20} rounded={6} />
                          <span className="text-sm">{g.nombre}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--no-dot ${f.badge}`}>{f.motivo}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function KPI({ num, label, color }: { num: number; label: string; color: string }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="stat-number" style={{ color, fontSize: 26 }}>{num}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
