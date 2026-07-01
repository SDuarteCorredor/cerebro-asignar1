import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import AppShell from '@/components/app/AppShell'
import Sidebar from '@/components/app/Sidebar'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion()

  const supabase = await crearClienteServidor()
  const { count } = await supabase
    .from('procesos')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'en_revision')

  return (
    <AppShell>
      <Sidebar
        rol={sesion.rol}
        aprobacionesPendientes={count ?? 0}
        gestionId={sesion.gestion_id}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </div>
    </AppShell>
  )
}
