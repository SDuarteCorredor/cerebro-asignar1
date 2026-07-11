'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

const BUCKET = 'soportes-ausencias'
const MAX_BYTES = 20 * 1024 * 1024
const EXT_OK = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'gif']

function sanitizar(n: string) {
  return n.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function crearAusencia(formData: FormData) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, jefe_id, ciudad, sede').eq('id', user.id).single()
  if (!perfil) return { error: 'Perfil no encontrado' }

  const tipoId = String(formData.get('tipo_id') ?? '')
  const fechaDesde = String(formData.get('fecha_desde') ?? '')
  const fechaHasta = String(formData.get('fecha_hasta') ?? '')
  const horario = String(formData.get('horario') ?? 'TODO EL DÍA')
  const horarioDetalle = String(formData.get('horario_detalle') ?? '').trim() || null
  const observaciones = String(formData.get('observaciones') ?? '').trim() || null
  const diligenciaDetalle = String(formData.get('diligencia_detalle') ?? '').trim() || null
  const archivo = formData.get('soporte') as File | null

  if (!tipoId) return { error: 'Selecciona el tipo de ausencia' }
  if (!fechaDesde || !fechaHasta) return { error: 'Indica el rango de fechas' }
  if (fechaHasta < fechaDesde) return { error: 'La fecha hasta no puede ser anterior a la fecha desde' }

  const { data: tipo } = await supabase
    .from('tipos_ausencia').select('id, nombre, requiere_soporte').eq('id', tipoId).single()
  if (!tipo) return { error: 'Tipo de ausencia inválido' }

  // Soporte
  let soportePath: string | null = null
  if (archivo && archivo.size > 0) {
    if (archivo.size > MAX_BYTES) return { error: 'El soporte excede 20 MB' }
    const ext = (archivo.name.split('.').pop() ?? '').toLowerCase()
    if (!EXT_OK.includes(ext)) return { error: `Tipo de archivo no permitido (.${ext})` }
    const path = `${user.id}/${Date.now()}-${sanitizar(archivo.name)}`
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, archivo, {
      contentType: archivo.type || 'application/octet-stream', upsert: false,
    })
    if (upErr) return { error: `Soporte: ${upErr.message}` }
    soportePath = path
  } else if (tipo.requiere_soporte) {
    return { error: `El tipo "${tipo.nombre}" requiere adjuntar un soporte` }
  }

  const { error: insErr } = await supabase.from('ausencias').insert({
    solicitante_id: user.id,
    tipo_id: tipoId,
    jefe_id: perfil.jefe_id,
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    horario,
    horario_detalle: horarioDetalle,
    ciudad: perfil.ciudad ?? perfil.sede ?? null,
    observaciones,
    diligencia_detalle: diligenciaDetalle,
    soporte_path: soportePath,
    estado: 'pendiente_jefe',
  })
  if (insErr) {
    if (soportePath) await supabase.storage.from(BUCKET).remove([soportePath])
    return { error: insErr.message }
  }

  revalidatePath('/ausencias')
  return { ok: true }
}

export async function cancelarAusencia(id: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('ausencias')
    .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
    .eq('id', id).eq('solicitante_id', user.id)
    .in('estado', ['pendiente_jefe', 'pendiente_segundo'])
  if (error) return { error: error.message }
  revalidatePath('/ausencias')
  return { ok: true }
}

export async function obtenerUrlSoporte(path: string): Promise<string | null> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
  if (error) return null
  return data.signedUrl
}

export async function aprobarAusencia(id: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data, error } = await supabase.rpc('aprobar_ausencia', { p_id: id })
  if (error) return { error: error.message }
  const r = data as { ok: boolean; error?: string; estado?: string }
  if (!r.ok) return { error: r.error ?? 'No se pudo aprobar' }
  revalidatePath('/ausencias/bandeja')
  revalidatePath('/ausencias')
  return { ok: true, estado: r.estado }
}

export async function denegarAusencia(id: string, motivo: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data, error } = await supabase.rpc('denegar_ausencia', { p_id: id, p_motivo: motivo })
  if (error) return { error: error.message }
  const r = data as { ok: boolean; error?: string }
  if (!r.ok) return { error: r.error ?? 'No se pudo denegar' }
  revalidatePath('/ausencias/bandeja')
  revalidatePath('/ausencias')
  return { ok: true }
}
