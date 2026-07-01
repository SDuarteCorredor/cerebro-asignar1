import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import FormularioProceso from '../FormularioProceso'

export default async function PaginaNuevoProceso({ searchParams }: { searchParams: Promise<{ gestion?: string }> }) {
  const { gestion: gestionId } = await searchParams
  const sesion = await obtenerSesion()

  if (sesion.rol === 'colaborador') redirect('/dashboard')

  const supabase = await crearClienteServidor()

  const { data: gestiones } = await supabase
    .from('gestiones').select('id, nombre').eq('activa', true).order('nombre')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Nuevo proceso' }]} />
      <main className="page page--narrow fade-up">
        <FormularioProceso
          gestiones={gestiones ?? []}
          gestionIdInicial={gestionId ?? sesion.gestion_id ?? ''}
          rol={sesion.rol}
        />
      </main>
    </>
  )
}
