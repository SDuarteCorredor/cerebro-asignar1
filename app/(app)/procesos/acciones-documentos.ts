'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'

const BUCKET = 'documentos-procesos'
const MAX_BYTES = 20 * 1024 * 1024
const EXT_OK = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'gif']

function sanitizar(nombre: string) {
  return nombre.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function subirDocumentoProceso(formData: FormData) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const procesoId = String(formData.get('proceso_id') ?? '')
  const archivo = formData.get('archivo') as File | null
  const nombrePersonalizado = String(formData.get('nombre') ?? '').trim()

  if (!procesoId) return { error: 'Proceso no indicado' }
  if (!archivo || archivo.size === 0) return { error: 'Archivo requerido' }
  if (archivo.size > MAX_BYTES) return { error: 'El archivo excede 20 MB' }

  const ext = (archivo.name.split('.').pop() ?? '').toLowerCase()
  if (!EXT_OK.includes(ext)) return { error: `Tipo no permitido (.${ext}). Solo PDF, Word, Excel o imágenes.` }

  const path = `${procesoId}/${Date.now()}-${sanitizar(archivo.name)}`
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, archivo, {
    contentType: archivo.type || 'application/octet-stream',
    upsert: false,
  })
  if (upErr) return { error: `Storage: ${upErr.message}` }

  const { error: insErr } = await supabase.from('documentos').insert({
    proceso_id: procesoId,
    nombre: nombrePersonalizado || archivo.name,
    tipo_archivo: ext.toUpperCase(),
    tamano_bytes: archivo.size,
    storage_path: path,
    subido_por: user.id,
  })
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([path])
    return { error: insErr.message }
  }

  revalidatePath(`/procesos/${procesoId}`)
  return { ok: true }
}

export async function eliminarDocumentoProceso(docId: string, procesoId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: doc } = await supabase.from('documentos').select('storage_path').eq('id', docId).single()
  if (doc?.storage_path) await supabase.storage.from(BUCKET).remove([doc.storage_path])

  const { error } = await supabase.from('documentos').delete().eq('id', docId)
  if (error) return { error: error.message }
  revalidatePath(`/procesos/${procesoId}`)
  return { ok: true }
}

export async function obtenerUrlDocumento(path: string): Promise<string | null> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10)
  if (error) return null
  return data.signedUrl
}
