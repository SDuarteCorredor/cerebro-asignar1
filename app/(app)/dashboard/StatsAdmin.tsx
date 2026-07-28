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
    <section className="dash-section">
      <div className="grid-stats">
        {items.map(a => (
          <Link key={a.titulo} href={a.href} className="card dash-stat">
            <div className={`badge badge--${a.tono} badge--no-dot dash-stat__icono`}>
              <Icono nombre={a.icono} className="icon icon--sm" />
            </div>
            <div>
              <div className="stat-number">{a.cuenta}</div>
              <div className="stat-label">{a.titulo}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function StatsAdminSkeleton() {
  return (
    <section className="dash-section">
      <div className="grid-stats">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card dash-stat">
            <div className="skeleton" style={{ width: 28, height: 24, borderRadius: 6 }} />
            <div>
              <div className="skeleton skeleton--title" style={{ width: 60, height: 28, marginBottom: 6 }} />
              <div className="skeleton skeleton--text" style={{ width: '80%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
