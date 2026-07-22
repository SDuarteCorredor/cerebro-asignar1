'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

/** Abre o cierra un quiz durante la jornada. */
export async function cambiarEstadoQuiz(sesionId: string, quizId: string, estado: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('cambiar_estado_quiz', {
    p_sesion: sesionId, p_quiz: quizId, p_estado: estado,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/induccion/${sesionId}`)
  return { ok: true }
}

export interface AvanceQuiz {
  quiz_id: string
  respondieron: number
  promedio: number | null
}

/** Avance en vivo: cuántos respondieron cada quiz y su promedio de aciertos. */
export async function obtenerAvanceQuizzes(sesionId: string): Promise<{ avance: AvanceQuiz[]; inscritos: number }> {
  const supabase = await crearClienteServidor()

  const [{ data: respuestas }, { count: inscritos }] = await Promise.all([
    supabase.from('quiz_respuestas').select('quiz_id, usuario_id, correcta').eq('sesion_id', sesionId),
    supabase.from('induccion_participantes').select('id', { count: 'exact', head: true }).eq('sesion_id', sesionId),
  ])

  // Agrupa por quiz: personas distintas que respondieron y % de acierto
  const porQuiz = new Map<string, { personas: Set<string>; total: number; ok: number }>()
  for (const r of respuestas ?? []) {
    const e = porQuiz.get(r.quiz_id) ?? { personas: new Set<string>(), total: 0, ok: 0 }
    e.personas.add(r.usuario_id)
    e.total += 1
    if (r.correcta) e.ok += 1
    porQuiz.set(r.quiz_id, e)
  }

  return {
    inscritos: inscritos ?? 0,
    avance: [...porQuiz.entries()].map(([quiz_id, e]) => ({
      quiz_id,
      respondieron: e.personas.size,
      promedio: e.total > 0 ? Math.round((e.ok / e.total) * 100) : null,
    })),
  }
}

export interface ResultadoPersona {
  usuario_id: string
  nombre: string
  aciertos: number
  total: number
}

/** Resultados por persona de un quiz, para la retroalimentación al cerrarlo. */
export async function obtenerResultadosQuiz(sesionId: string, quizId: string): Promise<ResultadoPersona[]> {
  const supabase = await crearClienteServidor()

  const { data } = await supabase
    .from('quiz_respuestas')
    .select('usuario_id, correcta, usuario:usuarios(nombre)')
    .eq('sesion_id', sesionId)
    .eq('quiz_id', quizId)

  const porPersona = new Map<string, ResultadoPersona>()
  for (const r of data ?? []) {
    const uRaw = r.usuario as unknown as { nombre: string }[] | { nombre: string } | null
    const u = Array.isArray(uRaw) ? (uRaw[0] ?? null) : uRaw
    const e = porPersona.get(r.usuario_id) ?? {
      usuario_id: r.usuario_id, nombre: u?.nombre ?? 'Sin nombre', aciertos: 0, total: 0,
    }
    e.total += 1
    if (r.correcta) e.aciertos += 1
    porPersona.set(r.usuario_id, e)
  }

  return [...porPersona.values()].sort((a, b) => b.aciertos - a.aciertos || a.nombre.localeCompare(b.nombre))
}
