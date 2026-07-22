'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

async function exigirAdmin() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { supabase, error: 'Solo administradores' as const }
  return { supabase, error: null }
}

export interface DatosPregunta {
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string
  verificada: boolean
}

/** Valida lo que comparten crear y actualizar. */
function validar(d: DatosPregunta): string | null {
  if (!d.enunciado.trim()) return 'El enunciado es obligatorio'
  const limpias = d.opciones.map(o => o.trim()).filter(Boolean)
  if (limpias.length < 2) return 'Se necesitan al menos dos opciones'
  if (d.correcta < 0 || d.correcta >= limpias.length) return 'Marca cuál es la respuesta correcta'
  return null
}

export async function actualizarPregunta(id: string, d: DatosPregunta) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const err = validar(d)
  if (err) return { error: err }

  const { error } = await supabase.from('quiz_preguntas').update({
    enunciado: d.enunciado.trim(),
    opciones: d.opciones.map(o => o.trim()).filter(Boolean),
    correcta: d.correcta,
    explicacion: d.explicacion.trim() || null,
    verificada: d.verificada,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/quizzes')
  return { ok: true }
}

export async function crearPregunta(quizId: string, d: DatosPregunta) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const err = validar(d)
  if (err) return { error: err }

  const { data: ultima } = await supabase
    .from('quiz_preguntas').select('orden').eq('quiz_id', quizId)
    .order('orden', { ascending: false }).limit(1).maybeSingle()

  const { error } = await supabase.from('quiz_preguntas').insert({
    quiz_id: quizId,
    orden: (ultima?.orden ?? 0) + 1,
    enunciado: d.enunciado.trim(),
    opciones: d.opciones.map(o => o.trim()).filter(Boolean),
    correcta: d.correcta,
    explicacion: d.explicacion.trim() || null,
    verificada: d.verificada,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/quizzes')
  return { ok: true }
}

export async function eliminarPregunta(id: string) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }

  // Si ya se respondió en alguna jornada, borrarla dejaría resultados incoherentes
  const { count } = await supabase
    .from('quiz_respuestas').select('id', { count: 'exact', head: true }).eq('pregunta_id', id)
  if ((count ?? 0) > 0) {
    return { error: 'No se puede eliminar: esta pregunta ya fue respondida en una jornada.' }
  }

  const { error } = await supabase.from('quiz_preguntas').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/quizzes')
  return { ok: true }
}

export async function moverPregunta(id: string, direccion: 'arriba' | 'abajo') {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }

  const { data: actual } = await supabase
    .from('quiz_preguntas').select('id, quiz_id, orden').eq('id', id).single()
  if (!actual) return { error: 'Pregunta no encontrada' }

  const base = supabase.from('quiz_preguntas').select('id, orden').eq('quiz_id', actual.quiz_id)
  const { data: vecina } = await (direccion === 'arriba'
    ? base.lt('orden', actual.orden).order('orden', { ascending: false })
    : base.gt('orden', actual.orden).order('orden', { ascending: true })
  ).limit(1).maybeSingle()

  if (!vecina) return { ok: true }

  await supabase.from('quiz_preguntas').update({ orden: vecina.orden }).eq('id', actual.id)
  await supabase.from('quiz_preguntas').update({ orden: actual.orden }).eq('id', vecina.id)

  revalidatePath('/admin/quizzes')
  return { ok: true }
}

/** Marca como confirmada sin abrir el editor completo. */
export async function marcarVerificada(id: string, verificada: boolean) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const { error } = await supabase.from('quiz_preguntas').update({ verificada }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/quizzes')
  return { ok: true }
}
