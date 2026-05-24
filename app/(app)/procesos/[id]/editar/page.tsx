import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import FormularioProceso from '../../FormularioProceso'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export default async function PaginaEditarProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  if (sesion.rol === 'colaborador') redirect(`/procesos/${id}`)

  const { data: proceso } = await supabase
    .from('procesos')
    .select('*, pasos(id, numero_orden, nombre, descripcion, cargo_responsable, entradas, periodicidad, salidas, acuerdo_servicio, tiempos), documentos(id, nombre, tipo_archivo, url_descarga, tamano_bytes)')
    .eq('id', id)
    .single()

  if (!proceso) notFound()

  // Solo el admin o el líder de esa gestión pueden editar
  if (sesion.rol === 'lider' && sesion.gestion_id !== proceso.gestion_id) {
    redirect(`/procesos/${id}`)
  }

  const { data: gestiones } = await supabase
    .from('gestiones').select('id, nombre').eq('activa', true).order('nombre')

  type PasoForm = {
    id: string; numero_orden: number; nombre: string | null; descripcion: string; cargo_responsable: string
    entradas: string | null; periodicidad: string | null; salidas: string | null; acuerdo_servicio: string | null; tiempos: string | null
  }
  const pasosOrdenados = (proceso.pasos as PasoForm[])
    .sort((a, b) => a.numero_orden - b.numero_orden)
    .map(p => ({
      id: p.id, numero_orden: p.numero_orden, nombre: p.nombre ?? '', descripcion: p.descripcion,
      cargo_responsable: p.cargo_responsable, entradas: p.entradas ?? '', periodicidad: p.periodicidad ?? '',
      salidas: p.salidas ?? '', acuerdo_servicio: p.acuerdo_servicio ?? '', tiempos: p.tiempos ?? '',
    }))

  return (
    <>
      <Topbar
        usuario={sesion}
        migas={[{ etiqueta: proceso.nombre, href: `/procesos/${id}` }, { etiqueta: 'Editar' }]}
      />
      <main className="page page--narrow fade-up">
        <FormularioProceso
          gestiones={gestiones ?? []}
          gestionIdInicial={proceso.gestion_id}
          rol={sesion.rol}
          procesoExistente={{
            id: proceso.id,
            nombre: proceso.nombre,
            objetivo: proceso.objetivo,
            version: proceso.version,
            estado: proceso.estado,
            gestion_id: proceso.gestion_id,
            pasos: pasosOrdenados,
            documentos: proceso.documentos as { id: string; nombre: string; tipo_archivo: string; url_descarga: string; tamano_bytes: number | null }[],
            es_proceso_cliente: proceso.es_proceso_cliente ?? false,
            cliente_nombre: proceso.cliente_nombre,
            cliente_contactos: (proceso.cliente_contactos as { nombre: string; telefono: string; correo: string }[]) ?? [],
            acuerdo_tarifa: proceso.acuerdo_tarifa,
            acuerdo_tipo_servicio: proceso.acuerdo_tipo_servicio,
            acuerdo_uniforme: proceso.acuerdo_uniforme,
            acuerdo_detalles: proceso.acuerdo_detalles,
          }}
        />
      </main>
    </>
  )
}
