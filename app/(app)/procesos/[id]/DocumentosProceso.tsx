'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { subirDocumentoProceso, eliminarDocumentoProceso, obtenerUrlDocumento } from '../acciones-documentos'

interface Doc {
  id: string
  nombre: string
  tipo_archivo: string
  tamano_bytes: number | null
  storage_path: string | null
}

export default function DocumentosProceso({
  procesoId, documentos, puedeSubir,
}: {
  procesoId: string
  documentos: Doc[]
  puedeSubir: boolean
}) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function descargar(doc: Doc) {
    if (!doc.storage_path) return
    const url = await obtenerUrlDocumento(doc.storage_path)
    if (!url) { setError('No se pudo generar el enlace de descarga'); return }
    const a = document.createElement('a')
    a.href = url; a.download = doc.nombre; a.target = '_blank'
    document.body.appendChild(a); a.click(); a.remove()
  }

  return (
    <section className="card card--padded">
      <div className="section-header">
        <div>
          <div className="page__eyebrow" style={{ marginBottom: 4 }}>Recursos</div>
          <h2 className="section-title">Documentos Relacionados</h2>
        </div>
        <div className="hstack" style={{ gap: 8 }}>
          <span className="section-count">{documentos.length} archivos</span>
          {puedeSubir && !subiendo && (
            <button className="btn btn--primary btn--sm" onClick={() => { setSubiendo(true); setError(null) }}>
              <Icono nombre="plus" className="icon icon--sm" /> Subir
            </button>
          )}
        </div>
      </div>

      {puedeSubir && subiendo && (
        <form
          className="card"
          style={{ padding: 14, margin: '4px 0 14px', background: 'var(--surface-sunken)' }}
          action={(fd) => startTransition(async () => {
            setError(null)
            fd.append('proceso_id', procesoId)
            const res = await subirDocumentoProceso(fd)
            if (res.error) setError(res.error)
            else { setSubiendo(false); router.refresh() }
          })}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Nombre (opcional)</div>
              <input name="nombre" className="input" placeholder="Ej. Formato de solicitud" />
            </label>
            <label style={{ fontSize: 12 }}>
              <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Archivo* (PDF, Word, Excel o imagen — máx 20 MB)</div>
              <input name="archivo" type="file" required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif"
                className="input" />
            </label>
            {error && (
              <div style={{ padding: 8, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12 }}>{error}</div>
            )}
            <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setSubiendo(false); setError(null) }}>Cancelar</button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>
                {isPending ? 'Subiendo…' : 'Subir documento'}
              </button>
            </div>
          </div>
        </form>
      )}

      {error && !subiendo && (
        <div style={{ padding: 8, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>{error}</div>
      )}

      {documentos.length > 0 ? (
        <div className="grid-2col" style={{ gap: 10 }}>
          {documentos.map(d => (
            <div key={d.id} className="doc-link" style={{ cursor: 'default' }}>
              <button
                onClick={() => descargar(d)}
                className="doc-link__info"
                style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, flex: 1, minWidth: 0 }}
                title="Descargar"
              >
                <div className="doc-link__name">{d.nombre}</div>
                <div className="doc-link__meta">
                  {d.tipo_archivo}{d.tamano_bytes ? ` · ${Math.round(d.tamano_bytes / 1024)} KB` : ''}
                </div>
              </button>
              <button onClick={() => descargar(d)} className="btn btn--ghost btn--sm" title="Descargar">
                <Icono nombre="download" className="icon icon--sm" />
              </button>
              {puedeSubir && (
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ color: 'var(--danger-ink)' }}
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
                    if (!confirm(`¿Eliminar "${d.nombre}"?`)) return
                    const res = await eliminarDocumentoProceso(d.id, procesoId)
                    if (res.error) setError(res.error)
                    else router.refresh()
                  })}
                  title="Eliminar"
                >×</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Aún no hay documentos vinculados.{puedeSubir && ' Usa “Subir” para agregar formatos o plantillas.'}
        </div>
      )}
    </section>
  )
}
