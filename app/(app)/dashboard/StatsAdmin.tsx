import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'

interface Kpi {
  aprobaciones_pendientes: number
  procesos_desactualizados: number
  total_procesos: number
  usuarios_activos: number
}

export default async function StatsAdmin() {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.rpc('dashboard_admin_kpis')
  const stats: Kpi = (Array.isArray(data) ? data[0] : data) ?? {
    aprobaciones_pendientes: 0,
    procesos_desactualizados: 0,
    total_procesos: 0,
    usuarios_activos: 0,
  }
  if (error) console.error('Error KPIs admin:', error)

  const items = [
    { titulo: 'Aprobaciones pendientes', cuenta: stats.aprobaciones_pendientes, icono: 'inbox', tono: 'warning', href: '/admin/aprobaciones' },
    { titulo: 'Procesos desactualizados', cuenta: stats.procesos_desactualizados, icono: 'history', tono: 'danger', href: '/gestiones' },
    { titulo: 'Usuarios activos', cuenta: stats.usuarios_activos, icono: 'users', tono: 'primary', href: '/admin/usuarios' },
    { titulo: 'Total de procesos', cuenta: stats.total_procesos, icono: 'grid', tono: 'neutral', href: '/gestiones' },
  ]

  return (
    <div className="grid-stats" style={{ marginBottom: 36 }}>
      {items.map(a => (
        <Link key={a.titulo} href={a.href} className="card" style={{
          textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14, padding: 18,
        }}>
          <div className={`badge badge--${a.tono} badge--no-dot`} style={{ alignSelf: 'flex-start', padding: '5px 8px' }}>
            <Icono nombre={a.icono} className="icon icon--sm" />
          </div>
          <div>
            <div className="stat-number">{a.cuenta}</div>
            <div className="stat-label">{a.titulo}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function StatsAdminSkeleton() {
  return (
    <div className="grid-stats" style={{ marginBottom: 36 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skeleton" style={{ width: 28, height: 24, borderRadius: 6 }} />
          <div>
            <div className="skeleton skeleton--title" style={{ width: 60, height: 28, marginBottom: 6 }} />
            <div className="skeleton skeleton--text" style={{ width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
