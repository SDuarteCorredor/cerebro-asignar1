import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Sidebar from '@/components/app/Sidebar'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, rol, gestion_id')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id,
    nombre: perfil.nombre,
    correo: perfil.correo,
    rol: perfil.rol as Rol,
    gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const { count } = await supabase
    .from('procesos')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'en_revision')

  return (
    <div className="app-shell">
      <Sidebar
        rol={sesion.rol}
        aprobacionesPendientes={count ?? 0}
        gestionId={sesion.gestion_id}
      />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  )
}
