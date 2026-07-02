'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cerrarComite } from '../acciones'

export default function BotonCerrar({ comiteId }: { comiteId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      className="btn btn--primary btn--sm"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        if (!confirm('¿Cerrar el comité? Se calculará el cumplimiento final y ya no se podrá editar.')) return
        const res = await cerrarComite(comiteId)
        if (res.error) alert(res.error)
        else router.refresh()
      })}
    >
      {isPending ? 'Cerrando…' : 'Cerrar comité'}
    </button>
  )
}
