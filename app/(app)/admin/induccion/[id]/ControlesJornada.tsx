'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { cambiarEstadoSesion } from '../acciones'

export default function ControlesJornada({ sesionId, estado, participantes }: {
  sesionId: string
  estado: string
  participantes: number
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')

  function cambiar(nuevo: string, confirmacion?: string) {
    if (confirmacion && !confirm(confirmacion)) return
    setError('')
    startTransition(async () => {
      const res = await cambiarEstadoSesion(sesionId, nuevo)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <section className="card card--padded">
      <div className="page__eyebrow" style={{ marginBottom: 10 }}>Control de la jornada</div>

      {estado === 'programada' && (
        <>
          <p className="text-muted text-sm" style={{ margin: '0 0 12px' }}>
            Al iniciar, se avisa a los {participantes} participante{participantes === 1 ? '' : 's'} inscrito{participantes === 1 ? '' : 's'}.
          </p>
          <button type="button" className="btn btn--primary" disabled={pendiente || participantes === 0}
            onClick={() => cambiar('en_curso')}>
            <Icono nombre="check" className="icon icon--sm" />
            {pendiente ? 'Iniciando…' : 'Iniciar jornada'}
          </button>
          {participantes === 0 && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)' }}>
              Inscribe al menos una persona para poder iniciar.
            </p>
          )}
        </>
      )}

      {estado === 'en_curso' && (
        <>
          <div className="hstack" style={{ gap: 8, marginBottom: 12, color: 'var(--warning-ink)' }}>
            <Icono nombre="info" className="icon icon--sm" />
            <span style={{ fontSize: 13.5 }}><strong>Jornada en curso.</strong> Los participantes ya pueden seguirla.</span>
          </div>
          <button type="button" className="btn btn--secondary" disabled={pendiente}
            onClick={() => cambiar('finalizada', '¿Finalizar la jornada? Los participantes dejarán de verla como activa.')}>
            {pendiente ? 'Finalizando…' : 'Finalizar jornada'}
          </button>
        </>
      )}

      {estado === 'finalizada' && (
        <div className="hstack" style={{ gap: 8, color: 'var(--success-ink)' }}>
          <Icono nombre="check" className="icon icon--sm" />
          <span style={{ fontSize: 13.5 }}>Jornada finalizada.</span>
        </div>
      )}

      {estado === 'cancelada' && (
        <div className="hstack" style={{ gap: 8, color: 'var(--danger-ink)' }}>
          <Icono nombre="x" className="icon icon--sm" />
          <span style={{ fontSize: 13.5 }}>Jornada cancelada.</span>
        </div>
      )}

      {(estado === 'programada' || estado === 'en_curso') && (
        <button type="button" className="btn btn--ghost btn--sm" disabled={pendiente}
          style={{ marginTop: 10, color: 'var(--danger-ink)' }}
          onClick={() => cambiar('cancelada', '¿Cancelar esta jornada?')}>
          Cancelar jornada
        </button>
      )}

      {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 10 }}>{error}</div>}
    </section>
  )
}
