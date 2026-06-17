import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import ClienteImportador from './ClienteImportador'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export default async function PaginaImportar() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const { data: cargos } = await supabase
    .from('cargos').select('id, nombre, banda').order('nombre')

  return (
    <>
      <Topbar
        usuario={sesion}
        migas={[{ etiqueta: 'Gestionar Usuarios', href: '/admin/usuarios' }, { etiqueta: 'Importar lista' }]}
      />
      <main className="page page--narrow fade-up">
        <ClienteImportador cargos={cargos ?? []} />
      </main>
    </>
  )
}
