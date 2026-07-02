'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { asignarLiderGestion } from '../usuarios/acciones'

interface Candidato { id: string; nombre: string; codigo_contrato: string | null }

export default function SelectorLider({
  gestionId, gestionNombre, liderActual, candidatos,
}: {
  gestionId: string
  gestionNombre: string
  liderActual: { id: string; nombre: string } | null
  candidatos: Candidato[]
}) {
  const [abierto, setAbierto] = useState(false)
  const [seleccion, setSeleccion] = useState(liderActual?.id ?? '')
  const [q, setQ] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const filtrados = q
    ? candidatos.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()) || (c.codigo_contrato ?? '').toLowerCase().includes(q.toLowerCase()))
    : candidatos.slice(0, 30)

  return (
    <>
      <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(true)}>
        {liderActual ? 'Cambiar' : 'Asignar líder'}
      </button>

      {abierto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'grid', placeItems: 'center', zIndex: 100, padding: 16,
        }} onClick={() => setAbierto(false)}>
          <div className="card" style={{
            maxWidth: 520, width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 22,
          }} onClick={e => e.stopPropagation()}>
            <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Líder de {gestionNombre}</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>×</button>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-3)' }}>
              El líder queda con rol <strong>lider</strong> y su gestión asignada automáticamente.
            </p>

            <input
              className="input"
              placeholder="Buscar por nombre o código…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ marginBottom: 10 }}
              autoFocus
            />

            <div className="vstack" style={{ gap: 4, overflow: 'auto', flex: 1, marginBottom: 14, paddingRight: 4 }}>
              <label className="hstack" style={{
                gap: 10, padding: 8, borderRadius: 6, cursor: 'pointer',
                background: seleccion === '' ? 'var(--primary-soft)' : 'transparent',
              }}>
                <input type="radio" checked={seleccion === ''} onChange={() => setSeleccion('')} />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>— Sin líder —</span>
              </label>
              {filtrados.map(c => (
                <label key={c.id} className="hstack" style={{
                  gap: 10, padding: 8, borderRadius: 6, cursor: 'pointer',
                  background: seleccion === c.id ? 'var(--primary-soft)' : 'transparent',
                }}>
                  <input type="radio" checked={seleccion === c.id} onChange={() => setSeleccion(c.id)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nombre}</div>
                    {c.codigo_contrato && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{c.codigo_contrato}</div>
                    )}
                  </div>
                </label>
              ))}
              {filtrados.length === 0 && (
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', padding: 8 }}>Sin resultados.</p>
              )}
            </div>

            <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setAbierto(false)}>Cancelar</button>
              <button
                className="btn btn--primary"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                  const res = await asignarLiderGestion(gestionId, seleccion || null)
                  if (res.error) alert(res.error)
                  else { setAbierto(false); router.refresh() }
                })}
              >
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
