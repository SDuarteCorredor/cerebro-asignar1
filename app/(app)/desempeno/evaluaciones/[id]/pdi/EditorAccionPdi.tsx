'use client'

import { useState, useTransition } from 'react'
import { reemplazarAccionPdi } from './acciones'

interface AccionCat {
  id: string
  competencia: string
  tipo: string
  nombre: string
  banda_min: string
  banda_max: string
  esfuerzo_th: string
  duracion: string | null
}

export default function EditorAccionPdi({
  pdiId,
  pdiAccionId,
  accionActualId,
  evaluacionId,
  candidatas,
  editable,
}: {
  pdiId: string
  pdiAccionId: string
  accionActualId: string
  evaluacionId: string
  candidatas: AccionCat[]
  editable: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const [seleccion, setSeleccion] = useState(accionActualId)
  const [isPending, startTransition] = useTransition()

  if (!editable) return null

  return (
    <>
      <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(true)}>
        Cambiar acción
      </button>

      {abierto && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--overlay)',
          display: 'grid', placeItems: 'center', zIndex: 100, padding: 16,
        }} onClick={() => setAbierto(false)}>
          <div className="card" style={{
            maxWidth: 640, width: '100%', maxHeight: '80vh', overflow: 'auto', padding: 22,
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Cambiar acción del PDI</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
              Elige una acción del catálogo aplicable a esta competencia y banda.
            </p>

            <div className="vstack" style={{ gap: 6, marginBottom: 16 }}>
              {candidatas.map(c => (
                <label key={c.id} className="hstack" style={{
                  gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8,
                  cursor: 'pointer', background: seleccion === c.id ? 'var(--primary-soft)' : 'var(--surface)',
                }}>
                  <input
                    type="radio"
                    name="accion"
                    value={c.id}
                    checked={seleccion === c.id}
                    onChange={() => setSeleccion(c.id)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {c.id} · {c.tipo} · {c.duracion ?? '—'} · Esfuerzo TH: {c.esfuerzo_th}
                    </div>
                  </div>
                </label>
              ))}
              {candidatas.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: 0 }}>
                  No hay más acciones aplicables a esta competencia y banda.
                </p>
              )}
            </div>

            <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setAbierto(false)}>Cancelar</button>
              <button
                className="btn btn--primary"
                disabled={isPending || seleccion === accionActualId}
                onClick={() => startTransition(async () => {
                  await reemplazarAccionPdi({
                    pdi_id: pdiId,
                    pdi_accion_id: pdiAccionId,
                    nueva_accion_id: seleccion,
                    evaluacion_id: evaluacionId,
                  })
                  setAbierto(false)
                })}
              >
                {isPending ? 'Guardando…' : 'Guardar cambio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
