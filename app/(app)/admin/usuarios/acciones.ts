'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('id, rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { supabase: null, sesion: null, error: 'Solo administradores' }
  return { supabase, sesion: perfil, error: null as string | null }
}

export async function crearUsuarioPreregistro(formData: FormData) {
  const { supabase, sesion, error } = await requireAdmin()
  if (error || !supabase || !sesion) return { error: error ?? 'No autorizado' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const rol = String(formData.get('rol') ?? 'colaborador')
  const gestionId = String(formData.get('gestion_id') ?? '') || null
  const cargoId = String(formData.get('cargo_id') ?? '') || null
  const jefeId = String(formData.get('jefe_id') ?? '') || null
  const codigoContrato = String(formData.get('codigo_contrato') ?? '').trim() || null
  const enviarInvitacion = formData.get('invitar') === 'on'

  if (!nombre) return { error: 'Nombre requerido' }
  if (!correo || !/@/.test(correo)) return { error: 'Correo válido requerido' }

  const { data: existente } = await supabase.from('usuarios').select('id').eq('correo', correo).maybeSingle()
  if (existente) return { error: 'Ya existe un usuario con ese correo (usa el editor)' }

  const { data: nuevo, error: errIns } = await supabase.from('usuarios').insert({
    nombre, correo, rol,
    gestion_id: gestionId, cargo_id: cargoId, jefe_id: jefeId,
    codigo_contrato: codigoContrato,
    activo: true, tiene_login: false,
  }).select('id').single()
  if (errIns || !nuevo) return { error: errIns?.message ?? 'No se pudo crear el usuario' }

  if (enviarInvitacion) {
    const res = await enviarInvitacion_(supabase, sesion.id, nuevo.id, correo)
    if (res.error) return { ok: true, id: nuevo.id, warn: `Usuario creado pero no se pudo enviar invitación: ${res.error}` }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, id: nuevo.id }
}

export async function enviarInvitacion(usuarioId: string) {
  const { supabase, sesion, error } = await requireAdmin()
  if (error || !supabase || !sesion) return { error: error ?? 'No autorizado' }

  const { data: u } = await supabase.from('usuarios').select('id, nombre, correo, tiene_login').eq('id', usuarioId).single()
  if (!u) return { error: 'Usuario no encontrado' }
  if (!u.correo) return { error: 'El usuario no tiene correo registrado' }
  if (u.tiene_login) return { error: 'El usuario ya tiene sesión activa' }

  const res = await enviarInvitacion_(supabase, sesion.id, u.id, u.correo)
  if (res.error) return { error: res.error }
  revalidatePath('/admin/usuarios')
  revalidatePath(`/admin/usuarios/${usuarioId}`)
  return { ok: true }
}

async function enviarInvitacion_(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>['supabase']>,
  invitadoPor: string,
  usuarioId: string,
  correo: string,
) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const { error } = await supabase.auth.signInWithOtp({
    email: correo,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: site ? `${site}/dashboard` : undefined,
    },
  })
  if (error) return { error: error.message }

  await supabase.from('usuarios')
    .update({ invitado_at: new Date().toISOString(), invitado_por: invitadoPor })
    .eq('id', usuarioId)
  return { ok: true }
}

export async function asignarLiderGestion(gestionId: string, usuarioId: string | null) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error: error ?? 'No autorizado' }

  const { error: errG } = await supabase.from('gestiones').update({ lider_id: usuarioId }).eq('id', gestionId)
  if (errG) return { error: errG.message }

  if (usuarioId) {
    await supabase.from('usuarios')
      .update({ rol: 'lider', gestion_id: gestionId })
      .eq('id', usuarioId)
      .neq('rol', 'admin')
  }

  revalidatePath('/admin/gestiones')
  return { ok: true }
}
