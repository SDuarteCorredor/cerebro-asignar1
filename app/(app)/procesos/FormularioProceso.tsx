'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import IconoArchivo from '@/components/app/IconoArchivo'
import BadgeEstado from '@/components/app/BadgeEstado'
import { crearClienteNavegador } from '@/lib/supabase/client'
import type { Rol, EstadoProceso } from '@/types'

interface Paso { id?: string; numero_orden: number; descripcion: string; cargo_responsable: string }
interface Documento { id?: string; nombre: string; tipo_archivo: string; url_descarga: string; tamano_bytes: number | null; archivo?: File }

interface Props {
  gestiones: { id: string; nombre: string }[]
  gestionIdInicial: string
  rol: Rol
  procesoExistente?: {
    id: string
    nombre: string
    objetivo: string
    version: string
    estado: string
    gestion_id: string
    pasos: Paso[]
    documentos: Documento[]
  }
}

const cargosFrecuentes = [
  'Analista de Selección', 'Coordinador de Selección', 'Líder de Talento Humano',
  'Auxiliar de Contratación', 'Analista de Nómina', 'Coordinador de Operaciones',
  'Líder de Tesorería', 'Supervisor de Operaciones', 'Asesor Comercial', 'Analista Jurídico',
]

export default function FormularioProceso({ gestiones, gestionIdInicial, rol, procesoExistente }: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const esAdmin = rol === 'admin'
  const esNuevo = !procesoExistente

  const [nombre, setNombre] = useState(procesoExistente?.nombre ?? '')
  const [gestionId, setGestionId] = useState(gestionIdInicial)
  const [objetivo, setObjetivo] = useState(procesoExistente?.objetivo ?? '')
  const [version, setVersion] = useState(procesoExistente?.version ?? '1.0')
  const [estado, setEstado] = useState<EstadoProceso>((procesoExistente?.estado as EstadoProceso) ?? 'borrador')
  const [pasos, setPasos] = useState<Paso[]>(
    procesoExistente?.pasos?.length
      ? procesoExistente.pasos
      : [{ numero_orden: 1, descripcion: '', cargo_responsable: '' }]
  )
  const [documentos, setDocumentos] = useState<Documento[]>(procesoExistente?.documentos ?? [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function agregarPaso() {
    setPasos([...pasos, { numero_orden: pasos.length + 1, descripcion: '', cargo_responsable: '' }])
  }

  function actualizarPaso(i: number, campo: keyof Paso, valor: string) {
    setPasos(pasos.map((p, j) => j === i ? { ...p, [campo]: valor } : p))
  }

  function eliminarPaso(i: number) {
    setPasos(pasos.filter((_, j) => j !== i).map((p, j) => ({ ...p, numero_orden: j + 1 })))
  }

  function moverPaso(desde: number, hacia: number) {
    if (desde === hacia) return
    const sig = [...pasos]
    const [item] = sig.splice(desde, 1)
    sig.splice(hacia, 0, item)
    setPasos(sig.map((p, j) => ({ ...p, numero_orden: j + 1 })))
  }

  function alSeleccionarArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    const nuevos: Documento[] = archivos.map(f => ({
      nombre: f.name,
      tipo_archivo: (f.name.split('.').pop() ?? 'pdf').toLowerCase(),
      url_descarga: '',
      tamano_bytes: f.size,
      archivo: f,
    }))
    setDocumentos([...documentos, ...nuevos])
    e.target.value = ''
  }

  function eliminarDocumento(i: number) {
    setDocumentos(documentos.filter((_, j) => j !== i))
  }

  async function guardar(estadoFinal: EstadoProceso) {
    if (!nombre.trim()) { setError('El nombre del proceso es obligatorio.'); return }
    if (!gestionId) { setError('Selecciona una gestión.'); return }
    setGuardando(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const dataProceso = {
        nombre: nombre.trim(),
        gestion_id: gestionId,
        objetivo: objetivo.trim(),
        version,
        estado: estadoFinal,
        fecha_actualizacion: new Date().toISOString().split('T')[0],
        creado_por: esNuevo ? user.id : undefined,
      }

      let procesoId: string

      if (esNuevo) {
        const { data, error: err } = await supabase.from('procesos').insert(dataProceso).select('id').single()
        if (err) throw err
        procesoId = data.id
      } else {
        const { error: err } = await supabase.from('procesos').update(dataProceso).eq('id', procesoExistente!.id)
        if (err) throw err
        procesoId = procesoExistente!.id
        // Eliminar pasos y documentos existentes para recriarlos
        await supabase.from('pasos').delete().eq('proceso_id', procesoId)
      }

      // Insertar pasos
      if (pasos.length > 0) {
        const pasosData = pasos.map((p, i) => ({
          proceso_id: procesoId,
          numero_orden: i + 1,
          descripcion: p.descripcion,
          cargo_responsable: p.cargo_responsable,
        }))
        const { error: errPasos } = await supabase.from('pasos').insert(pasosData)
        if (errPasos) throw errPasos
      }

      // Subir documentos nuevos
      for (const doc of documentos) {
        if (doc.archivo) {
          const ruta = `${procesoId}/${Date.now()}-${doc.nombre}`
          const { data: subida, error: errSubida } = await supabase.storage
            .from('documentos-procesos')
            .upload(ruta, doc.archivo)
          if (errSubida) throw errSubida

          const { data: { publicUrl } } = supabase.storage
            .from('documentos-procesos')
            .getPublicUrl(subida.path)

          await supabase.from('documentos').insert({
            proceso_id: procesoId,
            nombre: doc.nombre,
            tipo_archivo: doc.tipo_archivo,
            url_descarga: publicUrl,
            tamano_bytes: doc.tamano_bytes,
          })
        }
      }

      router.push(`/procesos/${procesoId}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={procesoExistente ? `/procesos/${procesoExistente.id}` : `/gestiones/${gestionId}`}
          className="btn btn--ghost btn--sm"
        >
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <div className="page__eyebrow">{esNuevo ? 'Nuevo proceso' : 'Editando proceso'}</div>
          <h1 className="page__title">{nombre || 'Crear nuevo proceso'}</h1>
        </div>
        <BadgeEstado estado={estado} />
      </div>

      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="vstack" style={{ gap: 20 }}>
        {/* Información general */}
        <section className="card" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Información general</h3>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">Nombre del proceso</label>
              <input className="ca-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Selección de Personal" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14 }}>
              <div className="field">
                <label className="field__label">Gestión</label>
                <select className="ca-select" value={gestionId} onChange={e => setGestionId(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Estado</label>
                <select className="ca-select" value={estado} onChange={e => setEstado(e.target.value as EstadoProceso)}
                  disabled={!esAdmin}>
                  <option value="borrador">Borrador</option>
                  {esAdmin && <option value="activo">Activo</option>}
                  {esAdmin && <option value="desactualizado">Desactualizado</option>}
                </select>
                {!esAdmin && <span className="field__hint">El Admin aprueba el estado final.</span>}
              </div>
              <div className="field">
                <label className="field__label">Versión</label>
                <input className="ca-input" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0" />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Objetivo</label>
              <textarea className="ca-textarea" value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Una línea que explica para qué existe este proceso." />
            </div>
          </div>
        </section>

        {/* Pasos */}
        <section className="card" style={{ padding: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Pasos del procedimiento</h3>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Arrastra para reordenar</span>
          </div>
          <div className="vstack" style={{ gap: 10 }}>
            {pasos.map((paso, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDraggingIdx(i)}
                onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                onDragEnd={() => {
                  if (draggingIdx !== null && overIdx !== null) moverPaso(draggingIdx, overIdx)
                  setDraggingIdx(null); setOverIdx(null)
                }}
                style={{
                  display: 'grid', gridTemplateColumns: 'auto 36px 1fr 200px auto', gap: 10, alignItems: 'flex-start',
                  padding: 12, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)',
                  outline: overIdx === i && draggingIdx !== null ? '2px solid var(--primary)' : 'none',
                  opacity: draggingIdx === i ? 0.4 : 1,
                }}
              >
                <button className="btn btn--ghost btn--sm" style={{ cursor: 'grab', padding: 4 }}>
                  <Icono nombre="drag" className="icon icon--sm" />
                </button>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-soft)', color: 'var(--primary-ink)', display: 'grid', placeItems: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <textarea
                  className="ca-textarea"
                  style={{ minHeight: 60 }}
                  placeholder="Descripción de la acción…"
                  value={paso.descripcion}
                  onChange={e => actualizarPaso(i, 'descripcion', e.target.value)}
                />
                <select className="ca-select" value={paso.cargo_responsable} onChange={e => actualizarPaso(i, 'cargo_responsable', e.target.value)}>
                  <option value="">Cargo responsable…</option>
                  {cargosFrecuentes.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="btn btn--ghost btn--sm" onClick={() => eliminarPaso(i)}>
                  <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
                </button>
              </div>
            ))}
            <button className="btn btn--secondary" onClick={agregarPaso} style={{ alignSelf: 'flex-start' }}>
              <Icono nombre="plus" className="icon icon--sm" /> Agregar paso
            </button>
          </div>
        </section>

        {/* Documentos */}
        <section className="card" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Documentos relacionados</h3>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, border: '2px dashed var(--border-strong)', borderRadius: 12, padding: 28,
            color: 'var(--text-3)', cursor: 'pointer', background: 'var(--surface-sunken)',
          }}>
            <Icono nombre="upload" className="icon icon--lg" style={{ color: 'var(--primary)' }} />
            <strong style={{ color: 'var(--text)' }}>Arrastra archivos aquí o haz clic para subir</strong>
            <span style={{ fontSize: 12 }}>Acepta PDF, DOCX, XLSX, PPTX. Máx 20 MB por archivo.</span>
            <input type="file" multiple accept=".pdf,.docx,.xlsx,.pptx" onChange={alSeleccionarArchivos} style={{ display: 'none' }} />
          </label>

          {documentos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              {documentos.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <IconoArchivo tipo={d.tipo_archivo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.tamano_bytes ? `${Math.round(d.tamano_bytes / 1024)} KB` : ''}
                      {d.archivo ? ' · Nuevo' : ''}
                    </div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminarDocumento(i)}>
                    <Icono nombre="trash" className="icon icon--sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '20px 0 0', borderTop: '1px solid var(--divider)' }}>
          <Link
            href={procesoExistente ? `/procesos/${procesoExistente.id}` : `/gestiones/${gestionId}`}
            className="btn btn--ghost"
          >
            Cancelar
          </Link>
          <div className="hstack" style={{ gap: 10 }}>
            <button className="btn btn--secondary" disabled={guardando} onClick={() => guardar('borrador')}>
              Guardar como borrador
            </button>
            {esAdmin ? (
              <button className="btn btn--primary" disabled={guardando} onClick={() => guardar('activo')}>
                <Icono nombre="check" className="icon icon--sm" />
                {guardando ? 'Publicando…' : 'Publicar'}
              </button>
            ) : (
              <button className="btn btn--primary" disabled={guardando} onClick={() => guardar('en_revision')}>
                <Icono nombre="upload" className="icon icon--sm" />
                {guardando ? 'Enviando…' : 'Enviar para aprobación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
