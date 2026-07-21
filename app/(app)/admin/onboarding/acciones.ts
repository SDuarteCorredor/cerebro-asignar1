'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

const ETAPAS = ['induccion', 'socializacion', 'entrenamiento'] as const
type Etapa = typeof ETAPAS[number]

/** Verifica sesión y rol admin. Devuelve el cliente o un error. */
async function exigirAdmin() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { supabase, error: 'Solo administradores' as const }
  return { supabase, error: null }
}

export async function crearItem(datos: {
  etapa: string
  gestion_id: string | null
  titulo: string
  descripcion: string
  obligatorio: boolean
  plazo_dias: number
  url_recurso: string
}) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }

  if (!ETAPAS.includes(datos.etapa as Etapa)) return { error: 'Etapa no válida' }
  if (!datos.titulo.trim()) return { error: 'El título es obligatorio' }
  // La misma regla que protege la BD: solo el entrenamiento se especializa por gestión
  const gestionId = datos.etapa === 'entrenamiento' ? datos.gestion_id : null

  // Se añade al final de su grupo (etapa + gestión)
  let qUltimo = supabase
    .from('onboarding_items_plantilla')
    .select('orden')
    .eq('etapa', datos.etapa)
  qUltimo = gestionId === null ? qUltimo.is('gestion_id', null) : qUltimo.eq('gestion_id', gestionId)
  const { data: ultimo } = await qUltimo
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('onboarding_items_plantilla').insert({
    etapa: datos.etapa,
    gestion_id: gestionId,
    orden: (ultimo?.orden ?? 0) + 1,
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim() || null,
    obligatorio: datos.obligatorio,
    plazo_dias: datos.plazo_dias,
    url_recurso: datos.url_recurso.trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/onboarding')
  return { ok: true }
}

export async function actualizarItem(id: string, datos: {
  titulo: string
  descripcion: string
  obligatorio: boolean
  plazo_dias: number
  url_recurso: string
}) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  if (!datos.titulo.trim()) return { error: 'El título es obligatorio' }

  const { error } = await supabase.from('onboarding_items_plantilla').update({
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim() || null,
    obligatorio: datos.obligatorio,
    plazo_dias: datos.plazo_dias,
    url_recurso: datos.url_recurso.trim() || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/onboarding')
  return { ok: true }
}

export async function alternarActivo(id: string, activo: boolean) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const { error } = await supabase.from('onboarding_items_plantilla').update({ activo }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/onboarding')
  return { ok: true }
}

export async function eliminarItem(id: string) {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }
  const { error } = await supabase.from('onboarding_items_plantilla').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/onboarding')
  return { ok: true }
}

/** Intercambia el orden con el ítem vecino dentro del mismo grupo (etapa + gestión). */
export async function moverItem(id: string, direccion: 'arriba' | 'abajo') {
  const { supabase, error: errAuth } = await exigirAdmin()
  if (errAuth) return { error: errAuth }

  const { data: actual } = await supabase
    .from('onboarding_items_plantilla')
    .select('id, etapa, gestion_id, orden')
    .eq('id', id).single()
  if (!actual) return { error: 'Ítem no encontrado' }

  let consulta = supabase
    .from('onboarding_items_plantilla')
    .select('id, orden')
    .eq('etapa', actual.etapa)
  consulta = actual.gestion_id === null
    ? consulta.is('gestion_id', null)
    : consulta.eq('gestion_id', actual.gestion_id)

  const { data: vecino } = await (direccion === 'arriba'
    ? consulta.lt('orden', actual.orden).order('orden', { ascending: false })
    : consulta.gt('orden', actual.orden).order('orden', { ascending: true })
  ).limit(1).maybeSingle()

  if (!vecino) return { ok: true }  // ya está en el extremo

  // Intercambio en dos pasos: no hay constraint de unicidad sobre `orden`
  await supabase.from('onboarding_items_plantilla').update({ orden: vecino.orden }).eq('id', actual.id)
  await supabase.from('onboarding_items_plantilla').update({ orden: actual.orden }).eq('id', vecino.id)

  revalidatePath('/admin/onboarding')
  return { ok: true }
}
