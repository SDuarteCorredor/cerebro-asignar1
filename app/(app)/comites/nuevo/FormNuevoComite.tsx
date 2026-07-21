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
      style={{ padding: 24, maxWidth: 640 }}
      action={(fd) => startTransition(async () => {
        setError(null)
        const res = await crearComite(fd)
        if (res.error) setError(res.error)
        else if (res.id) router.push(`/comites/${res.id}`)
      })}
    >
      <div className="form-row-comite" style={{ marginBottom: 16 }}>
        <div className="field">
          <label className="field__label" htmlFor="gestion_id">Gestion</label>
          <select name="gestion_id" id="gestion_id" required className="input" defaultValue={gestiones.length === 1 ? gestiones[0].id : ''}>
            {gestiones.length !== 1 && <option value="">Selecciona...</option>}
            {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="fecha">Fecha</label>
          <input name="fecha" id="fecha" type="date" required defaultValue={hoy} className="input" />
        </div>
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field__label" htmlFor="titulo">Titulo (opcional)</label>
        <input name="titulo" id="titulo" className="input" placeholder="Ej. Comite semanal Comercial" />
      </div>

      <div className="field" style={{ marginBottom: 16 }}>
        <label className="field__label" htmlFor="notas">Notas de apertura</label>
        <textarea name="notas" id="notas" className="input" rows={3} placeholder="Objetivos, contexto..." />
      </div>

      {error && (
        <div style={{ padding: 12, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Creando...' : 'Crear comite'}
        </button>
      </div>
    </form>
  )
}
