'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'
import { fechaVencimiento } from '@/lib/capacitaciones'

async function sesion() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  return { supabase, userId: user.id, esAdmin: perfil?.rol === 'admin' }
}

// ---------- Catálogo (solo TH) ----------
export async function guardarCapacitacion(datos: {
  id?: string; nombre: string; descripcion: string; tipo: string
  certifica: boolean; vigencia_meses: number; activa: boolean
}) {
  const { supabase, esAdmin } = await sesion()
  if (!esAdmin) return { error: 'Solo Talento Humano' }
  if (!datos.nombre.trim()) return { error: 'El nombre es obligatorio' }

  const fila = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim() || null,
    tipo: datos.tipo,
    certifica: datos.certifica,
    vigencia_meses: Number.isFinite(datos.vigencia_meses) ? datos.vigencia_meses : 0,
    activa: datos.activa,
  }
  const { error } = datos.id
    ? await supabase.from('capacitaciones').update(fila).eq('id', datos.id)
    : await supabase.from('capacitaciones').insert(fila)
  if (error) return { error: error.message }
  revalidatePath('/admin/capacitaciones')
  return { ok: true }
}

// ---------- Registro de una capacitación a una persona ----------
export async function registrarCapacitacion(datos: {
  capacitacion_id: string; usuario_id: string; fecha_realizada: string
  horas: string; certificado_path: string | null; nota: string
}) {
  const { supabase, userId } = await sesion()
  if (!datos.capacitacion_id || !datos.usuario_id) return { error: 'Elige la capacitación y la persona' }
  if (!datos.fecha_realizada) return { error: 'Indica la fecha en que se realizó' }

  const { data: cap } = await supabase
    .from('capacitaciones').select('vigencia_meses').eq('id', datos.capacitacion_id).single()
  const vence = fechaVencimiento(datos.fecha_realizada, cap?.vigencia_meses ?? 0)

  const { error } = await supabase.from('capacitacion_registros').insert({
    capacitacion_id: datos.capacitacion_id,
    usuario_id: datos.usuario_id,
    fecha_realizada: datos.fecha_realizada,
    fecha_vence: vence,
    horas: datos.horas ? Number(datos.horas) : null,
    certificado_path: datos.certificado_path,
    nota: datos.nota.trim() || null,
    registrado_por: userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/capacitaciones')
  return { ok: true }
}

export async function eliminarRegistro(id: string) {
  const { supabase } = await sesion()
  const { error } = await supabase.from('capacitacion_registros').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/capacitaciones')
  return { ok: true }
}

/** URL firmada para descargar un certificado (bucket privado). */
export async function urlCertificado(path: string) {
  const { supabase } = await sesion()
  const { data, error } = await supabase.storage
    .from('certificados-capacitacion').createSignedUrl(path, 60 * 10)
  if (error || !data) return { error: error?.message ?? 'No se pudo abrir' }
  return { ok: true, url: data.signedUrl }
}
