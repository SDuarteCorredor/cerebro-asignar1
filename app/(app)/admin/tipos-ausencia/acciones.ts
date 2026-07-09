'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

const CAMPOS_OK = ['remunerado', 'descuenta', 'requiere_soporte', 'requiere_doble_validacion', 'activo'] as const
type Campo = typeof CAMPOS_OK[number]

export async function actualizarTipoAusencia(id: string, campo: string, valor: boolean) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { error: 'Solo administradores' }

  if (!CAMPOS_OK.includes(campo as Campo)) return { error: 'Campo no permitido' }

  const { error } = await supabase.from('tipos_ausencia').update({ [campo]: valor }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/tipos-ausencia')
  return { ok: true }
}
