'use client'

import { useState, useTransition } from 'react'
import { obtenerUrlDescarga } from './acciones'

export default function BotonDescarga({
  path, nombre, variante = 'primary',
}: {
  path: string
  nombre: string
  variante?: 'primary' | 'ghost'
}) {
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <>
      <button
        className={`btn btn--${variante} btn--sm`}
        disabled={isPending}
        onClick={() => startTransition(async () => {
          setErr(null)
          const url = await obtenerUrlDescarga(path)
          if (!url) { setErr('No se pudo generar el enlace'); return }
          const a = document.createElement('a')
          a.href = url
          a.download = nombre
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          a.remove()
        })}
      >
        {isPending ? 'Preparando…' : 'Descargar'}
      </button>
      {err && <div style={{ fontSize: 11, color: 'var(--danger-ink)' }}>{err}</div>}
    </>
  )
}
