'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'
import { registrarPresentacion, obtenerUrlPresentacion } from '../acciones'

const BUCKET = 'presentaciones-induccion'
const MAX_MB = 50

export default function PanelPresentacion({ sesionId, nombreActual }: {
  sesionId: string
  nombreActual: string | null
}) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [pendiente, startTransition] = useTransition()
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  async function alSubir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    if (archivo.type !== 'application/pdf') {
      setError('La presentación debe ser un PDF. Exporta el PowerPoint a PDF antes de subirlo.')
      return
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_MB} MB.`)
      return
    }

    setError('')
    setSubiendo(true)
    try {
      const ruta = `${sesionId}/${Date.now()}-${archivo.name.replace(/[^\w.\-]/g, '_')}`
      const { error: errSubida } = await supabase.storage.from(BUCKET).upload(ruta, archivo)
      if (errSubida) throw errSubida

      const res = await registrarPresentacion(sesionId, ruta, archivo.name)
      if (res.error) throw new Error(res.error)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la presentación')
    } finally {
      setSubiendo(false)
    }
  }

  function proyectar() {
    setError('')
    startTransition(async () => {
      const res = await obtenerUrlPresentacion(sesionId)
      if (res.error || !res.url) { setError(res.error ?? 'No se pudo abrir'); return }
      window.open(res.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <section className="card card--padded">
      <div className="page__eyebrow" style={{ marginBottom: 4 }}>Presentación</div>
      <h2 className="section-title" style={{ marginTop: 0, marginBottom: 4 }}>Material de la jornada</h2>
      <p className="text-muted text-sm" style={{ margin: '0 0 14px' }}>
        Sube el mazo exportado a <strong>PDF</strong>. Podrás proyectarlo desde aquí durante la charla.
      </p>

      {nombreActual ? (
        <div className="hstack" style={{ gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="hstack" style={{ gap: 8, minWidth: 0 }}>
            <Icono nombre="file" className="icon" style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nombreActual}
            </span>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer' }}>
              <Icono nombre="upload" className="icon icon--sm" />
              {subiendo ? 'Subiendo…' : 'Reemplazar'}
              <input type="file" accept="application/pdf" onChange={alSubir} style={{ display: 'none' }} disabled={subiendo} />
            </label>
            <button type="button" className="btn btn--primary btn--sm" onClick={proyectar} disabled={pendiente}>
              <Icono nombre="eye" className="icon icon--sm" />
              {pendiente ? 'Abriendo…' : 'Proyectar'}
            </button>
          </div>
        </div>
      ) : (
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, border: '2px dashed var(--border-strong)', borderRadius: 12, padding: 26,
          color: 'var(--text-3)', cursor: 'pointer', background: 'var(--surface-sunken)',
        }}>
          <Icono nombre="upload" className="icon icon--lg" style={{ color: 'var(--primary)' }} />
          <strong style={{ color: 'var(--text)' }}>
            {subiendo ? 'Subiendo…' : 'Sube la presentación en PDF'}
          </strong>
          <span style={{ fontSize: 12 }}>Máximo {MAX_MB} MB</span>
          <input type="file" accept="application/pdf" onChange={alSubir} style={{ display: 'none' }} disabled={subiendo} />
        </label>
      )}

      {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 10 }}>{error}</div>}
    </section>
  )
}
