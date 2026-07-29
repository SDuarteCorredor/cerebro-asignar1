'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

/** Devuelve el cliente y el perfil (rol + gestión) del usuario en sesión. */
async function sesionActual() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase
    .from('usuarios').select('rol, gestion_id').eq('id', user.id).single()
  return { supabase, rol: perfil?.rol ?? 'colaborador', gestionId: perfil?.gestion_id ?? null }
}

export async function crearTermino(datos: { gestion_id: string | null; termino: string; definicion: string }) {
  const { supabase, rol, gestionId } = await sesionActual()
  if (!datos.termino.trim() || !datos.definicion.trim()) return { error: 'Escribe el término y su definición' }

  // El líder solo puede crear en su gestión; el general es solo de admin
  const destino = rol === 'admin' ? datos.gestion_id : gestionId
  if (rol !== 'admin' && !destino) return { error: 'No tienes una gestión asignada' }

  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('glosario_terminos').insert({
    gestion_id: destino,
    termino: datos.termino.trim(),
    definicion: datos.definicion.trim(),
    creado_por: user?.id ?? null,
  })
  if (error) return { error: error.message }
  revalidatePath('/glosario')
  return { ok: true }
}

export async function actualizarTermino(id: string, datos: { termino: string; definicion: string }) {
  const { supabase } = await sesionActual()
  if (!datos.termino.trim() || !datos.definicion.trim()) return { error: 'Escribe el término y su definición' }
  // La RLS ya restringe a admin o líder de la gestión del término
  const { error } = await supabase.from('glosario_terminos')
    .update({ termino: datos.termino.trim(), definicion: datos.definicion.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/glosario')
  return { ok: true }
}

export async function eliminarTermino(id: string) {
  const { supabase } = await sesionActual()
  const { error } = await supabase.from('glosario_terminos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/glosario')
  return { ok: true }
}
