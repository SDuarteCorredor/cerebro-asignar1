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
      <form className="dash-buscador" onSubmit={(e) => { e.preventDefault(); buscar(q) }}>
        <Icono nombre="search" className="icon" style={{ color: 'var(--text-3)' }} />
        <input
          className="dash-buscador__input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="¿Qué proceso buscas? Ej: cotización, nómina, vinculación, ARL…"
          aria-label="Buscar procesos"
        />
        <button className="btn btn--primary" type="submit">Buscar</button>
      </form>

      <div className="dash-buscador__sugerencias">
        <span className="dash-buscador__sugerencias-label">Sugerencias:</span>
        {sugerencias.map((s) => (
          <button
            key={s}
            type="button"
            className="badge badge--neutral badge--no-dot dash-buscador__chip"
            onClick={() => buscar(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </>
  )
}
