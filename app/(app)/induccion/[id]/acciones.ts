'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

export interface PreguntaPublica {
  id: string
  orden: number
  enunciado: string
  opciones: string[]
}

/** Preguntas SIN la respuesta correcta: la corrección ocurre en el servidor. */
export async function obtenerPreguntas(sesionId: string, quizId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('obtener_preguntas_quiz', {
    p_sesion: sesionId, p_quiz: quizId,
  })
  if (error) return { error: error.message }
  return { ok: true, preguntas: (data ?? []) as PreguntaPublica[] }
}

export async function enviarRespuestas(
  sesionId: string,
  quizId: string,
  respuestas: { pregunta_id: string; opcion: number }[],
) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('responder_quiz', {
    p_sesion: sesionId, p_quiz: quizId, p_respuestas: respuestas,
  })
  if (error) return { error: error.message }

  revalidatePath(`/induccion/${sesionId}`)
  return { ok: true, resultado: data as { total: number; correctas: number } }
}

export interface Retroalimentacion {
  enunciado: string
  mi_opcion: number
  correcta: number
  acerte: boolean
  explicacion: string | null
  opciones: string[]
}

export async function obtenerRetroalimentacion(sesionId: string, quizId: string) {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.rpc('mi_resultado_quiz', {
    p_sesion: sesionId, p_quiz: quizId,
  })
  if (error) return { error: error.message }
  return { ok: true, detalle: (data ?? []) as Retroalimentacion[] }
}
