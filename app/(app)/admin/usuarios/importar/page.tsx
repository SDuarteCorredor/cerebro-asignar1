import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import ClienteImportador from './ClienteImportador'

export default async function PaginaImportar() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

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
