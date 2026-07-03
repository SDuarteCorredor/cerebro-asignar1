'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registrarSeguimiento } from './acciones'

interface Corte {
  fecha_corte: string
  avance_pct: number
  comentario: string | null
}

export default function Seguimiento({
  pdiAccionId, evaluacionId, cortes, avanceActual, puedeRegistrar,
}: {
  pdiAccionId: string
  evaluacionId: string
  cortes: Corte[]
  avanceActual: number
  puedeRegistrar: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [avance, setAvance] = useState(avanceActual)
  const [comentario, setComentario] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div style={{ marginTop: 10 }}>
      <div className="hstack" style={{ gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ flex: 1, background: 'var(--border)', height: 8, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            width: `${avanceActual}%`,
            height: '100%',
            background: avanceActual === 100 ? 'var(--success)' : 'var(--primary)',
            transition: 'width .3s',
          }} />
        </div>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: 40, textAlign: 'right' }}>
          {avanceActual}%
        </span>
        {puedeRegistrar && (
          <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(v => !v)}>
            {abierto ? 'Cerrar' : 'Registrar corte'}
          </button>
        )}
      </div>

      {abierto && puedeRegistrar && (
        <div className="card" style={{ padding: 12, marginTop: 8, background: 'var(--surface)' }}>
          <div className="form-row-seguimiento">
            <label style={{ display: 'block', fontSize: 12 }}>
              <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Fecha</div>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input" />
            </label>
            <label style={{ display: 'block', fontSize: 12 }}>
              <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Avance %</div>
              <input type="number" min={0} max={100} value={avance} onChange={e => setAvance(Number(e.target.value))} className="input" />
            </label>
            <label style={{ display: 'block', fontSize: 12 }}>
              <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Comentario</div>
              <input type="text" value={comentario} onChange={e => setComentario(e.target.value)} className="input" placeholder="Opcional" />
            </label>
            <button
              className="btn btn--primary btn--sm"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                const res = await registrarSeguimiento({
                  pdiAccionId, evaluacionId,
                  fechaCorte: fecha, avancePct: avance, comentario,
                })
                if (res.error) alert(res.error)
                else {
                  setAbierto(false); setComentario('')
                  router.refresh()
                }
              })}
            >
              {isPending ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </div>
      )}

      {cortes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--text-2)' }}>Historial:</strong>{' '}
          {cortes.map((c, i) => (
            <span key={i} style={{ marginRight: 10 }}>
              {c.fecha_corte}: {c.avance_pct}%{c.comentario ? ` — ${c.comentario}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
