import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import FormularioProceso from '../../FormularioProceso'

export default async function PaginaEditarProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()

  if (sesion.rol === 'colaborador') redirect(`/procesos/${id}`)

  const supabase = await crearClienteServidor()

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

  const [{ data: gestiones }, { data: tiposDoc }] = await Promise.all([
    supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre'),
    supabase.from('tipos_documento').select('id, nombre, prefijo').order('orden'),
  ])

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
          tiposDocumento={tiposDoc ?? []}
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
            tipo_documento_id: proceso.tipo_documento_id,
            codigo: proceso.codigo,
            fecha_emision: proceso.fecha_emision,
            elaborado_por: proceso.elaborado_por,
            revisado_por: proceso.revisado_por,
            aprobado_por: proceso.aprobado_por,
            fecha_proxima_revision: proceso.fecha_proxima_revision,
          }}
        />
      </main>
    </>
  )
}
