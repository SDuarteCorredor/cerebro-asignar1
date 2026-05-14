'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'

const sugerencias = ['Selección y Entrega', 'Compensación', 'Vinculación', 'Seguridad Social']

export default function BuscadorHero() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function buscar(termino: string) {
    const t = termino.trim()
    if (t) router.push(`/buscar?q=${encodeURIComponent(t)}`)
  }

  return (
    <>
      <form
        onSubmit={(e) => { e.preventDefault(); buscar(q) }}
        style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 14,
          padding: '8px 8px 8px 18px',
          maxWidth: 720,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Icono nombre="search" className="icon" style={{ color: 'var(--text-3)' }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Qué proceso buscas? Ej: cotización, nómina, vinculación, ARL…"
          style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 16, padding: '10px 0' }}
        />
        <button className="btn btn--primary" type="submit">Buscar</button>
      </form>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)', alignSelf: 'center' }}>Sugerencias:</span>
        {sugerencias.map((s) => (
          <button
            key={s}
            className="badge badge--neutral badge--no-dot"
            style={{ cursor: 'pointer', fontWeight: 500 }}
            onClick={() => buscar(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </>
  )
}
