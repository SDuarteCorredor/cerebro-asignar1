'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { agregarOverride } from './acciones'

const SEDES = ['Bogotá', 'Medellín', 'Rionegro', 'Cali', 'Pereira', 'Cartagena', 'Santa Marta', 'Barranquilla', 'Por confirmar']

export default function FormAgregar() {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!abierto) {
    return (
      <button className="btn btn--primary btn--sm" style={{ marginBottom: 20 }} onClick={() => setAbierto(true)}>
        + Nueva excepción
      </button>
    )
  }

  return (
    <form
      className="card"
      style={{ padding: 18, marginBottom: 20 }}
      action={(fd) => startTransition(async () => {
        setError(null)
        const res = await agregarOverride(fd)
        if (res.error) setError(res.error)
        else { setAbierto(false); router.refresh() }
      })}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '140px 160px 1fr', gap: 10, marginBottom: 12 }}>
        <label style={{ fontSize: 11.5 }}>
          <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Código*</div>
          <input name="codigo_contrato" required placeholder="ASI999" className="input" style={{ fontFamily: 'var(--font-mono)' }} />
        </label>
        <label style={{ fontSize: 11.5 }}>
          <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Sede*</div>
          <select name="sede" required defaultValue="" className="input">
            <option value="">—</option>
            {SEDES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11.5 }}>
          <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Motivo</div>
          <input name="motivo" className="input" placeholder="Ej. Trabaja en Rionegro pese al CCF Medellín" />
        </label>
      </div>
      {error && (
        <div style={{ padding: 8, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12, marginBottom: 10 }}>
          {error}
        </div>
      )}
      <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>Cancelar</button>
        <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar excepción'}
        </button>
      </div>
    </form>
  )
}
