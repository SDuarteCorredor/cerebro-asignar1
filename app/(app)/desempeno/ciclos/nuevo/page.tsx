import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import FormularioCiclo from './FormularioCiclo'
import { obtenerIniciales } from '@/lib/sesion'
import type { SesionUsuario, Rol } from '@/types'

export default async function PaginaNuevoCiclo() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/desempeno')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  // Contar colaboradores por banda (para mostrar al usuario cuántos cubre)
  const { data: usuariosConBanda } = await supabase
    .from('usuarios')
    .select('id, jefe_id, cargo:cargos(banda)')
    .eq('activo', true)
    .not('cargo_id', 'is', null)

  const conteoPorBanda: Record<string, number> = { B1: 0, B2: 0, B3: 0, B4: 0, B5: 0 }
  for (const u of (usuariosConBanda ?? [])) {
    const cargoRaw = u.cargo as { banda: string }[] | { banda: string } | null
    const cargo = Array.isArray(cargoRaw) ? (cargoRaw[0] ?? null) : cargoRaw
    if (cargo?.banda && conteoPorBanda[cargo.banda] !== undefined) {
      conteoPorBanda[cargo.banda] += 1
    }
  }
  const totalConJefe = (usuariosConBanda ?? []).filter(u => u.jefe_id).length
  const totalActivosConCargo = (usuariosConBanda ?? []).length

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'Ciclos', href: '/desempeno/ciclos' },
        { etiqueta: 'Nuevo' },
      ]} />
      <main className="page page--narrow fade-up">
        <FormularioCiclo
          conteoPorBanda={conteoPorBanda}
          totalConJefe={totalConJefe}
          totalActivosConCargo={totalActivosConCargo}
        />
      </main>
    </>
  )
}
