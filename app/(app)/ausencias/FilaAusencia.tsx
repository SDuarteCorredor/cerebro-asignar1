'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelarAusencia } from './acciones'

const badgeEstado: Record<string, string> = {
  pendiente_jefe: 'badge--warning',
  pendiente_segundo: 'badge--warning',
  aprobada: 'badge--success',
  denegada: 'badge--danger',
  cancelada: 'badge--neutral',
}
const etiquetaEstado: Record<string, string> = {
  pendiente_jefe: 'Pendiente de tu jefe',
  pendiente_segundo: 'Pendiente 2ª validación',
  aprobada: 'Aprobada',
  denegada: 'Denegada',
  cancelada: 'Cancelada',
}

export default function FilaAusencia({
  id, tipo, desde, hasta, horario, estado, motivoRechazo,
}: {
  id: string
  tipo: string
  desde: string
  hasta: string
  horario: string
  estado: string
  motivoRechazo: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const cancelable = estado === 'pendiente_jefe' || estado === 'pendiente_segundo'

  return (
    <tr>
      <td>
        <div className="row-title">{tipo}</div>
        {estado === 'denegada' && motivoRechazo && (
          <div className="row-sub" style={{ color: 'var(--danger-ink)' }}>Motivo: {motivoRechazo}</div>
        )}
      </td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>
        {desde}{hasta !== desde ? ` → ${hasta}` : ''}
      </td>
      <td style={{ fontSize: 12.5 }}>{horario}</td>
      <td><span className={`badge ${badgeEstado[estado] ?? 'badge--neutral'}`}>{etiquetaEstado[estado] ?? estado}</span></td>
      <td style={{ textAlign: 'right' }}>
        {cancelable && (
          <button
            className="btn btn--ghost btn--sm"
            style={{ color: 'var(--danger-ink)' }}
            disabled={isPending}
            onClick={() => startTransition(async () => {
              if (!confirm('¿Cancelar esta solicitud?')) return
              const res = await cancelarAusencia(id)
              if (res.error) alert(res.error)
              else router.refresh()
            })}
          >Cancelar</button>
        )}
      </td>
    </tr>
  )
}
