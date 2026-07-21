'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { iniciarOnboarding } from '@/app/(app)/onboarding/acciones'

export default function BotonAcogida({ usuarioId, nombre, acogidaAbierta }: {
  usuarioId: string
  nombre: string
  acogidaAbierta: { id: string; estado: string; fecha_inicio: string } | null
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (acogidaAbierta) {
    return (
      <section className="card card--padded" style={{ marginTop: 18 }}>
        <div className="page__eyebrow" style={{ marginBottom: 6 }}>Acogida laboral</div>
        <div className="hstack" style={{ gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5 }}>
            {acogidaAbierta.estado === 'completado' ? 'Acogida completada' : 'Acogida en curso'} desde el{' '}
            <span className="text-mono">{acogidaAbierta.fecha_inicio.split('-').reverse().join('/')}</span>.
          </span>
          <Link href="/onboarding/seguimiento" className="btn btn--ghost btn--sm">
            <Icono nombre="eye" className="icon icon--sm" /> Ver seguimiento
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="card card--padded" style={{ marginTop: 18 }}>
      <div className="page__eyebrow" style={{ marginBottom: 6 }}>Acogida laboral</div>
      <div className="hstack" style={{ gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
          Aún no ha iniciado su proceso de acogida.
        </span>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={pendiente}
          onClick={() => {
            if (!confirm(`¿Iniciar la acogida laboral de ${nombre}? Se le notificará a la persona y a su jefe.`)) return
            setError('')
            startTransition(async () => {
              const res = await iniciarOnboarding(usuarioId)
              if (res.error) { setError(res.error); return }
              router.refresh()
            })
          }}
        >
          <Icono nombre="plus" className="icon icon--sm" />
          {pendiente ? 'Iniciando…' : 'Iniciar acogida'}
        </button>
      </div>
      {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 8 }}>{error}</div>}
    </section>
  )
}
