'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

export type Categoria = 'Reglamento' | 'Política' | 'Manual' | 'Circular' | 'Código'

function slug(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function crearPolitica(formData: FormData) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { error: 'Solo administradores' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const categoria = String(formData.get('categoria') ?? '') as Categoria
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const version = String(formData.get('version') ?? '1.0').trim()
  const archivo = formData.get('archivo') as File | null

  if (!nombre) return { error: 'Nombre requerido' }
  if (!categoria) return { error: 'Categoría requerida' }
  if (!archivo || archivo.size === 0) return { error: 'Archivo requerido' }
  if (archivo.size > 20 * 1024 * 1024) return { error: 'El archivo excede 20 MB' }

  const path = `${slug(categoria)}/${slug(nombre)}/${version}-${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error: upErr } = await supabase.storage.from('politicas').upload(path, archivo, {
    cacheControl: '3600',
    upsert: false,
    contentType: archivo.type || 'application/octet-stream',
  })
  if (upErr) return { error: `Storage: ${upErr.message}` }

  const { data: pol, error: polErr } = await supabase
    .from('politicas')
    .insert({ nombre, categoria, descripcion, version_actual: version, creado_por: user.id })
    .select('id').single()
  if (polErr || !pol) {
    await supabase.storage.from('politicas').remove([path])
    return { error: polErr?.message ?? 'No se pudo crear' }
  }

  const { error: verErr } = await supabase.from('politicas_versiones').insert({
    politica_id: pol.id,
    version,
    archivo_path: path,
    archivo_nombre: archivo.name,
    archivo_tipo: archivo.type || 'application/octet-stream',
    archivo_tamano: archivo.size,
    resumen_cambio: 'Versión inicial',
    subido_por: user.id,
  })
  if (verErr) return { error: verErr.message }

  revalidatePath('/politicas')
  revalidatePath('/admin/politicas')
  return { ok: true, id: pol.id }
}

export async function agregarVersion(formData: FormData) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { error: 'Solo administradores' }

  const politicaId = String(formData.get('politica_id') ?? '')
  const version = String(formData.get('version') ?? '').trim()
  const resumen = String(formData.get('resumen') ?? '').trim() || null
  const archivo = formData.get('archivo') as File | null

  if (!politicaId || !version) return { error: 'Datos incompletos' }
  if (!archivo || archivo.size === 0) return { error: 'Archivo requerido' }
  if (archivo.size > 20 * 1024 * 1024) return { error: 'El archivo excede 20 MB' }

  const { data: pol } = await supabase.from('politicas').select('nombre, categoria').eq('id', politicaId).single()
  if (!pol) return { error: 'Política no encontrada' }

  const path = `${slug(pol.categoria)}/${slug(pol.nombre)}/${version}-${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error: upErr } = await supabase.storage.from('politicas').upload(path, archivo, {
    contentType: archivo.type || 'application/octet-stream',
  })
  if (upErr) return { error: `Storage: ${upErr.message}` }

  const { error: verErr } = await supabase.from('politicas_versiones').insert({
    politica_id: politicaId,
    version,
    archivo_path: path,
    archivo_nombre: archivo.name,
    archivo_tipo: archivo.type || 'application/octet-stream',
    archivo_tamano: archivo.size,
    resumen_cambio: resumen,
    subido_por: user.id,
  })
  if (verErr) {
    await supabase.storage.from('politicas').remove([path])
    return { error: verErr.message }
  }
  await supabase.from('politicas')
    .update({ version_actual: version, updated_at: new Date().toISOString() })
    .eq('id', politicaId)

  revalidatePath('/politicas')
  revalidatePath('/admin/politicas')
  revalidatePath(`/politicas/${politicaId}`)
  return { ok: true }
}

export async function actualizarMetadata(formData: FormData) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { error: 'Solo administradores' }

  const id = String(formData.get('id') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const categoria = String(formData.get('categoria') ?? '') as Categoria
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const activo = formData.get('activo') === 'on'

  const { error } = await supabase.from('politicas')
    .update({ nombre, categoria, descripcion, activo, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/politicas')
  revalidatePath('/admin/politicas')
  revalidatePath(`/politicas/${id}`)
  return { ok: true }
}

export async function eliminarPolitica(politicaId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') return { error: 'Solo administradores' }

  const { data: versiones } = await supabase.from('politicas_versiones')
    .select('archivo_path').eq('politica_id', politicaId)
  const paths = (versiones ?? []).map(v => v.archivo_path)
  if (paths.length > 0) await supabase.storage.from('politicas').remove(paths)

  const { error } = await supabase.from('politicas').delete().eq('id', politicaId)
  if (error) return { error: error.message }
  revalidatePath('/politicas')
  revalidatePath('/admin/politicas')
  return { ok: true }
}

export async function obtenerUrlDescarga(path: string): Promise<string | null> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.storage.from('politicas').createSignedUrl(path, 60 * 10)
  if (error) return null
  return data.signedUrl
}
