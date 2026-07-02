'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearComite } from '../acciones'

export default function FormNuevoComite({ gestiones }: { gestiones: { id: string; nombre: string }[] }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <form
      className="card"
      style={{ padding: 22, maxWidth: 640 }}
      action={(fd) => startTransition(async () => {
        setError(null)
        const res = await crearComite(fd)
        if (res.error) setError(res.error)
        else if (res.id) router.push(`/comites/${res.id}`)
      })}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Gestión*</div>
          <select name="gestion_id" required className="input" defaultValue={gestiones.length === 1 ? gestiones[0].id : ''}>
            {gestiones.length !== 1 && <option value="">Selecciona…</option>}
            {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Fecha*</div>
          <input name="fecha" type="date" required defaultValue={hoy} className="input" />
        </label>
      </div>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Título (opcional)</div>
        <input name="titulo" className="input" placeholder="Ej. Comité semanal Comercial" />
      </label>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Notas de apertura</div>
        <textarea name="notas" className="input" rows={3} placeholder="Objetivos, contexto…" style={{ resize: 'vertical' }} />
      </label>

      {error && (
        <div style={{ padding: 10, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Creando…' : 'Crear comité'}
        </button>
      </div>
    </form>
  )
}
