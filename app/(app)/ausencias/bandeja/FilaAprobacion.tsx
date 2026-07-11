'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aprobarAusencia, denegarAusencia, obtenerUrlSoporte } from '../acciones'

export interface SolicitudPendiente {
  id: string
  solicitante: string
  tipo: string
  dobleValidacion: boolean
  fecha_desde: string
  fecha_hasta: string
  horario: string
  horario_detalle: string | null
  observaciones: string | null
  diligencia_detalle: string | null
  soporte_path: string | null
  nivel: 1 | 2
}

export default function FilaAprobacion({ s }: { s: SolicitudPendiente }) {
  const [denegando, setDenegando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function descargarSoporte() {
    if (!s.soporte_path) return
    const url = await obtenerUrlSoporte(s.soporte_path)
    if (!url) { setError('No se pudo abrir el soporte'); return }
    window.open(url, '_blank')
  }

  const rango = s.fecha_desde === s.fecha_hasta ? s.fecha_desde : `${s.fecha_desde} → ${s.fecha_hasta}`

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="hstack" style={{ gap: 12, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <strong style={{ fontSize: 14.5 }}>{s.solicitante}</strong>
            <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 11 }}>{s.tipo}</span>
            {s.nivel === 2 && <span className="badge badge--warning" style={{ fontSize: 11 }}>2ª validación</span>}
            {s.dobleValidacion && s.nivel === 1 && (
              <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 10.5 }} title="Al aprobar, pasará a segunda validación de TH">requiere doble validación</span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {rango} · {s.horario}{s.horario_detalle ? ` (${s.horario_detalle})` : ''}
          </div>
          {s.observaciones && (
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 6 }}>{s.observaciones}</div>
          )}
          {s.diligencia_detalle && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic' }}>Diligencia: {s.diligencia_detalle}</div>
          )}
          {s.soporte_path && (
            <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={descargarSoporte}>Ver soporte</button>
          )}
        </div>

        {!denegando && (
          <div className="hstack" style={{ gap: 6, flexShrink: 0 }}>
            <button
              className="btn btn--primary btn--sm" disabled={isPending}
              onClick={() => startTransition(async () => {
                setError(null)
                const res = await aprobarAusencia(s.id)
                if (res.error) setError(res.error)
                else router.refresh()
              })}
            >
              {isPending ? '…' : (s.dobleValidacion && s.nivel === 1 ? 'Aprobar y enviar a TH' : 'Aprobar')}
            </button>
            <button className="btn btn--ghost btn--sm" style={{ color: 'var(--danger-ink)' }} onClick={() => { setDenegando(true); setError(null) }}>
              Denegar
            </button>
          </div>
        )}
      </div>

      {denegando && (
        <div className="hstack" style={{ gap: 6, marginTop: 12 }}>
          <input
            className="input" placeholder="Motivo del rechazo (opcional)"
            value={motivo} onChange={e => setMotivo(e.target.value)} style={{ flex: 1, fontSize: 12.5 }}
          />
          <button
            className="btn btn--danger btn--sm" disabled={isPending}
            onClick={() => startTransition(async () => {
              setError(null)
              const res = await denegarAusencia(s.id, motivo)
              if (res.error) setError(res.error)
              else router.refresh()
            })}
          >{isPending ? '…' : 'Confirmar rechazo'}</button>
          <button className="btn btn--ghost btn--sm" onClick={() => { setDenegando(false); setMotivo('') }}>Cancelar</button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12 }}>{error}</div>
      )}
    </div>
  )
}
