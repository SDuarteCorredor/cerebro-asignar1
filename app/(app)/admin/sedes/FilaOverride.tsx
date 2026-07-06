'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarOverride } from './acciones'

export default function FilaOverride({
  codigo, sede, motivo, nombre,
}: {
  codigo: string
  sede: string
  motivo: string | null
  nombre: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <tr>
      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{codigo}</td>
      <td>{nombre}</td>
      <td><span className="badge badge--neutral badge--no-dot">{sede}</span></td>
      <td className="text-sm text-2" style={{ maxWidth: 380 }}>{motivo ?? '—'}</td>
      <td>
        <button
          className="btn btn--ghost btn--sm"
          disabled={isPending}
          style={{ color: 'var(--danger-ink)' }}
          onClick={() => startTransition(async () => {
            if (!confirm(`¿Eliminar la excepción de ${codigo}?`)) return
            await eliminarOverride(codigo)
            router.refresh()
          })}
        >Eliminar</button>
      </td>
    </tr>
  )
}
