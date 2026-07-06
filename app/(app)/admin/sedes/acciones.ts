'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('id, rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { supabase: null, userId: null, error: 'Solo administradores' }
  return { supabase, userId: user.id, error: null as string | null }
}

export async function agregarOverride(formData: FormData) {
  const { supabase, userId, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'No autorizado' }

  const codigo = String(formData.get('codigo_contrato') ?? '').trim().toUpperCase()
  const sede = String(formData.get('sede') ?? '').trim()
  const motivo = String(formData.get('motivo') ?? '').trim() || null

  if (!codigo) return { error: 'Código de contrato requerido' }
  if (!sede) return { error: 'Sede requerida' }

  const { error: err } = await supabase.from('sede_overrides').upsert({
    codigo_contrato: codigo, sede, motivo, creado_por: userId, updated_at: new Date().toISOString(),
  })
  if (err) return { error: err.message }

  revalidatePath('/admin/sedes')
  return { ok: true }
}

export async function eliminarOverride(codigo: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'No autorizado' }
  const { error: err } = await supabase.from('sede_overrides').delete().eq('codigo_contrato', codigo)
  if (err) return { error: err.message }
  revalidatePath('/admin/sedes')
  return { ok: true }
}
