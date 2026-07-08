'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

export async function actualizarMiPerfil(args: {
  nombre_preferido: string
  celular: string
}) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('actualizar_mi_perfil', {
    p_nombre_preferido: args.nombre_preferido,
    p_celular: args.celular,
  })
  if (error) return { error: error.message }

  revalidatePath(`/perfil/${user.id}`)
  revalidatePath('/dashboard')
  return { ok: true }
}
