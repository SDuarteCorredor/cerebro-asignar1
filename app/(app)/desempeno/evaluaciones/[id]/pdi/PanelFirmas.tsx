'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { firmarPdi, type TipoFirma } from './acciones'

interface FirmaData {
  tipo: TipoFirma
  label: string
  firma: string | null
  puedeFirmar: boolean
  emoji: string
}

export default function PanelFirmas({
  pdiId, evaluacionId, firmas,
}: {
  pdiId: string
  evaluacionId: string
  firmas: FirmaData[]
}) {
  return (
    <section className="card" style={{ padding: 20, marginBottom: 18 }}>
      <div className="page__eyebrow" style={{ marginBottom: 10 }}>Firmas</div>
      <div className="grid-stats-3">
        {firmas.map(f => (
          <TarjetaFirma key={f.tipo} pdiId={pdiId} evaluacionId={evaluacionId} data={f} />
        ))}
      </div>
    </section>
  )
}

function TarjetaFirma({
  pdiId, evaluacionId, data,
}: {
  pdiId: string
  evaluacionId: string
  data: FirmaData
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const firmado = !!data.firma

  return (
    <div className="card" style={{
      padding: 14,
      background: firmado ? 'var(--success-soft)' : 'var(--surface-sunken)',
      border: firmado ? '1px solid var(--success)' : '1px solid var(--border)',
    }}>
      <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{data.emoji}</span>
        <strong style={{ fontSize: 13 }}>{data.label}</strong>
      </div>
      {firmado ? (
        <div style={{ fontSize: 11.5, color: 'var(--success-ink)', wordBreak: 'break-word' }}>
          ✓ {data.firma}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 8 }}>Pendiente</div>
          {data.puedeFirmar && (
            <button
              className="btn btn--primary btn--sm"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                if (!confirm(`¿Confirmas la firma como ${data.label}?`)) return
                const res = await firmarPdi({ pdiId, evaluacionId, tipo: data.tipo })
                if (res.error) alert(res.error)
                else router.refresh()
              })}
            >
              {isPending ? 'Firmando…' : 'Firmar'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
