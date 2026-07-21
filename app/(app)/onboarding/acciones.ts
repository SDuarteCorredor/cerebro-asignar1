'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

/** El colaborador marca o desmarca un paso de su propia acogida. */
export async function reportarItem(itemId: string, hecho: boolean) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // El RPC valida que el ítem sea suyo y que no esté ya aprobado
  const { error } = await supabase.rpc('reportar_item_onboarding', {
    p_item: itemId,
    p_hecho: hecho,
  })
  if (error) return { error: error.message }

  revalidatePath('/onboarding')
  return { ok: true }
}

/** TH inicia la acogida de una persona. */
export async function iniciarOnboarding(usuarioId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('iniciar_onboarding', { p_usuario: usuarioId })
  if (error) return { error: error.message }

  revalidatePath('/onboarding')
  revalidatePath(`/admin/usuarios/${usuarioId}`)
  return { ok: true, id: data as string }
}
