'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

function semanaISO(fecha: Date): { semana: number; anio: number } {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { semana, anio: d.getUTCFullYear() }
}

async function autenticar() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

export async function crearComite(formData: FormData) {
  const { supabase, userId } = await autenticar()

  const gestionId = String(formData.get('gestion_id') ?? '')
  const fecha = String(formData.get('fecha') ?? new Date().toISOString().slice(0, 10))
  const titulo = String(formData.get('titulo') ?? '').trim() || null
  const notas = String(formData.get('notas') ?? '').trim() || null

  if (!gestionId) return { error: 'Gestión requerida' }
  const { semana, anio } = semanaISO(new Date(fecha + 'T12:00:00'))

  const { data: comite, error } = await supabase
    .from('comites')
    .insert({
      gestion_id: gestionId, fecha, semana_iso: semana, anio,
      titulo, notas, creado_por: userId,
    })
    .select('id').single()
  if (error || !comite) return { error: error?.message ?? 'No se pudo crear' }

  // Sembrar asistentes con los miembros de la gestión (activos)
  const { data: miembros } = await supabase
    .from('usuarios').select('id').eq('gestion_id', gestionId).eq('activo', true)
  if (miembros && miembros.length > 0) {
    await supabase.from('comite_asistentes').insert(
      miembros.map(m => ({ comite_id: comite.id, usuario_id: m.id, presente: true }))
    )
  }

  revalidatePath('/comites')
  return { ok: true, id: comite.id }
}

export async function togglePresente(args: { comite_id: string; usuario_id: string; presente: boolean }) {
  const { supabase } = await autenticar()
  const { error } = await supabase
    .from('comite_asistentes')
    .update({ presente: args.presente })
    .eq('comite_id', args.comite_id).eq('usuario_id', args.usuario_id)
  if (error) return { error: error.message }
  revalidatePath(`/comites/${args.comite_id}`)
  return { ok: true }
}

export async function agregarCompromiso(formData: FormData) {
  const { supabase } = await autenticar()

  const comiteId = String(formData.get('comite_id') ?? '')
  const responsableId = String(formData.get('responsable_id') ?? '')
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const fechaLimite = String(formData.get('fecha_limite') ?? '') || null

  if (!comiteId || !responsableId || !descripcion) return { error: 'Datos incompletos' }

  const { error } = await supabase.from('compromisos').insert({
    comite_origen_id: comiteId,
    responsable_id: responsableId,
    descripcion,
    fecha_limite: fechaLimite,
    estado: 'pendiente',
  })
  if (error) return { error: error.message }
  revalidatePath(`/comites/${comiteId}`)
  return { ok: true }
}

export async function editarCompromiso(args: {
  compromiso_id: string
  comite_id: string
  descripcion?: string
  fecha_limite?: string | null
  responsable_id?: string
}) {
  const { supabase } = await autenticar()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (args.descripcion !== undefined) patch.descripcion = args.descripcion
  if (args.fecha_limite !== undefined) patch.fecha_limite = args.fecha_limite
  if (args.responsable_id !== undefined) patch.responsable_id = args.responsable_id

  const { error } = await supabase.from('compromisos').update(patch).eq('id', args.compromiso_id)
  if (error) return { error: error.message }
  revalidatePath(`/comites/${args.comite_id}`)
  return { ok: true }
}

export async function eliminarCompromiso(compromisoId: string, comiteId: string) {
  const { supabase } = await autenticar()
  const { error } = await supabase.from('compromisos').delete().eq('id', compromisoId)
  if (error) return { error: error.message }
  revalidatePath(`/comites/${comiteId}`)
  return { ok: true }
}

export async function marcarEstado(args: {
  compromiso_id: string
  comite_id: string
  estado: 'cumplido' | 'no_cumplido' | 'arrastrado' | 'pendiente'
  notas?: string
  revisado_en_id?: string | null
}) {
  const { supabase } = await autenticar()
  const patch: Record<string, unknown> = {
    estado: args.estado,
    updated_at: new Date().toISOString(),
    revisado_en_id: args.revisado_en_id ?? null,
  }
  if (args.notas !== undefined) patch.notas_revision = args.notas

  const { error } = await supabase.from('compromisos').update(patch).eq('id', args.compromiso_id)
  if (error) return { error: error.message }
  revalidatePath(`/comites/${args.comite_id}`)
  return { ok: true }
}

export async function cerrarComite(comiteId: string) {
  const { supabase } = await autenticar()
  const { error } = await supabase
    .from('comites')
    .update({ cerrado: true, updated_at: new Date().toISOString() })
    .eq('id', comiteId)
  if (error) return { error: error.message }
  revalidatePath('/comites')
  revalidatePath(`/comites/${comiteId}`)
  return { ok: true }
}

export async function reabrirComite(comiteId: string) {
  const { supabase } = await autenticar()
  const { error } = await supabase
    .from('comites')
    .update({ cerrado: false, updated_at: new Date().toISOString() })
    .eq('id', comiteId)
  if (error) return { error: error.message }
  revalidatePath(`/comites/${comiteId}`)
  return { ok: true }
}

export async function eliminarComite(comiteId: string) {
  const { supabase } = await autenticar()
  const { error } = await supabase.from('comites').delete().eq('id', comiteId)
  if (error) return { error: error.message }
  revalidatePath('/comites')
  return { ok: true }
}
