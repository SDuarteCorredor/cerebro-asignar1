'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearPolitica } from '@/app/(app)/politicas/acciones'

const CATEGORIAS = ['Reglamento', 'Política', 'Manual', 'Circular', 'Código'] as const

export default function FormularioNueva() {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!abierto) {
    return (
      <button className="btn btn--primary" onClick={() => setAbierto(true)}>
        + Nueva política
      </button>
    )
  }

  return (
    <form
      className="card"
      style={{ padding: 20, marginBottom: 20 }}
      action={(fd) => startTransition(async () => {
        setError(null)
        const res = await crearPolitica(fd)
        if (res.error) setError(res.error)
        else { setAbierto(false); router.refresh() }
      })}
    >
      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Nueva política</h3>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>×</button>
      </div>

      <div className="form-row-politica" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Nombre*</div>
          <input name="nombre" required className="input" placeholder="Ej. Reglamento Interno de Trabajo 2026" />
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Categoría*</div>
          <select name="categoria" required className="input">
            <option value="">—</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Versión</div>
          <input name="version" defaultValue="1.0" className="input" />
        </label>
      </div>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Descripción</div>
        <textarea name="descripcion" className="input" rows={2} placeholder="Opcional — para qué sirve este documento" style={{ resize: 'vertical' }} />
      </label>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Archivo* (PDF, DOCX, XLSX — máx 20 MB)</div>
        <input name="archivo" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf" className="input" />
      </label>

      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost" onClick={() => setAbierto(false)}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Subiendo…' : 'Crear política'}
        </button>
      </div>
    </form>
  )
}
