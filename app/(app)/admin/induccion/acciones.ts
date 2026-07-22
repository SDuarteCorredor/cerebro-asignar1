'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

const BUCKET = 'presentaciones-induccion'

async function exigirAdmin() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { supabase, error: 'Solo administradores' as const }
  return { supabase, error: null }
}

export async function crearSesion(datos: {
  titulo: string
  fecha: string
  hora_inicio: string
  modalidad: string
  ciudad: string
  enlace_reunion: string
}) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  if (!datos.titulo.trim()) return { error: 'El título es obligatorio' }
  if (!datos.fecha) return { error: 'La fecha es obligatoria' }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.from('induccion_sesiones').insert({
    titulo: datos.titulo.trim(),
    fecha: datos.fecha,
    hora_inicio: datos.hora_inicio || null,
    modalidad: datos.modalidad,
    ciudad: datos.ciudad.trim() || null,
    enlace_reunion: datos.enlace_reunion.trim() || null,
    facilitador_id: user?.id ?? null,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/admin/induccion')
  return { ok: true, id: data.id as string }
}

export async function actualizarSesion(id: string, datos: {
  titulo: string
  fecha: string
  hora_inicio: string
  modalidad: string
  ciudad: string
  enlace_reunion: string
}) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  if (!datos.titulo.trim()) return { error: 'El título es obligatorio' }

  const { error } = await supabase.from('induccion_sesiones').update({
    titulo: datos.titulo.trim(),
    fecha: datos.fecha,
    hora_inicio: datos.hora_inicio || null,
    modalidad: datos.modalidad,
    ciudad: datos.ciudad.trim() || null,
    enlace_reunion: datos.enlace_reunion.trim() || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${id}`)
  return { ok: true }
}

export async function cambiarEstadoSesion(id: string, estado: string) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  if (!['programada', 'en_curso', 'finalizada', 'cancelada'].includes(estado)) {
    return { error: 'Estado no válido' }
  }
  const { error } = await supabase.from('induccion_sesiones').update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${id}`)
  revalidatePath('/admin/induccion')
  return { ok: true }
}

export async function inscribirParticipantes(sesionId: string, usuarioIds: string[]) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  if (usuarioIds.length === 0) return { error: 'Selecciona al menos una persona' }

  // upsert: si ya estaba inscrito, no falla
  const { error } = await supabase.from('induccion_participantes')
    .upsert(usuarioIds.map(uid => ({ sesion_id: sesionId, usuario_id: uid })),
            { onConflict: 'sesion_id,usuario_id', ignoreDuplicates: true })

  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${sesionId}`)
  return { ok: true }
}

export async function quitarParticipante(sesionId: string, usuarioId: string) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const { error } = await supabase.from('induccion_participantes')
    .delete().eq('sesion_id', sesionId).eq('usuario_id', usuarioId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${sesionId}`)
  return { ok: true }
}

export async function marcarAsistencia(sesionId: string, usuarioId: string, asistio: boolean) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const { error } = await supabase.from('induccion_participantes')
    .update({ asistio }).eq('sesion_id', sesionId).eq('usuario_id', usuarioId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${sesionId}`)
  return { ok: true }
}

/** Guarda la ruta de la presentación ya subida a Storage desde el navegador. */
export async function registrarPresentacion(sesionId: string, path: string, nombre: string) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }

  // Si había otra, se borra para no dejar archivos huérfanos
  const { data: previa } = await supabase
    .from('induccion_sesiones').select('presentacion_path').eq('id', sesionId).single()
  if (previa?.presentacion_path && previa.presentacion_path !== path) {
    await supabase.storage.from(BUCKET).remove([previa.presentacion_path])
  }

  const { error } = await supabase.from('induccion_sesiones')
    .update({ presentacion_path: path, presentacion_nombre: nombre }).eq('id', sesionId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${sesionId}`)
  return { ok: true }
}

/** URL firmada para proyectar el PDF (el bucket es privado). */
export async function obtenerUrlPresentacion(sesionId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión requerida' }

  // La RLS de induccion_sesiones ya limita quién puede leerla
  const { data: sesion } = await supabase
    .from('induccion_sesiones').select('presentacion_path').eq('id', sesionId).maybeSingle()
  if (!sesion?.presentacion_path) return { error: 'Esta sesión aún no tiene presentación' }

  const { data, error } = await supabase.storage
    .from(BUCKET).createSignedUrl(sesion.presentacion_path, 60 * 60 * 8)  // dura la jornada
  if (error) return { error: error.message }
  return { ok: true, url: data.signedUrl }
}
