'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { actualizarPregunta, crearPregunta, eliminarPregunta, moverPregunta,
         marcarVerificada, type DatosPregunta } from './acciones'

export interface PreguntaData {
  id: string
  orden: number
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string | null
  verificada: boolean
}

const MAX_OPCIONES = 6

/** Editor de una pregunta. Si `pregunta` es null, funciona como formulario de creación. */
export default function EditorPregunta({ quizId, pregunta, esPrimera, esUltima, alCerrar }: {
  quizId: string
  pregunta: PreguntaData | null
  esPrimera?: boolean
  esUltima?: boolean
  alCerrar?: () => void
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [editando, setEditando] = useState(pregunta === null)
  const [error, setError] = useState('')

  const [enunciado, setEnunciado] = useState(pregunta?.enunciado ?? '')
  const [opciones, setOpciones] = useState<string[]>(pregunta?.opciones ?? ['', ''])
  const [correcta, setCorrecta] = useState(pregunta?.correcta ?? 0)
  const [explicacion, setExplicacion] = useState(pregunta?.explicacion ?? '')
  const [verificada, setVerificada] = useState(pregunta?.verificada ?? true)

  function reiniciar() {
    setEnunciado(pregunta?.enunciado ?? '')
    setOpciones(pregunta?.opciones ?? ['', ''])
    setCorrecta(pregunta?.correcta ?? 0)
    setExplicacion(pregunta?.explicacion ?? '')
    setVerificada(pregunta?.verificada ?? true)
    setError('')
  }

  function correr(fn: () => Promise<{ error?: string; ok?: boolean }>, alTerminar?: () => void) {
    setError('')
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      alTerminar?.()
      router.refresh()
    })
  }

  function quitarOpcion(i: number) {
    if (opciones.length <= 2) return
    setOpciones(opciones.filter((_, j) => j !== i))
    // El índice correcto se recoloca si la opción eliminada estaba antes o era la marcada
    if (correcta === i) setCorrecta(0)
    else if (correcta > i) setCorrecta(correcta - 1)
  }

  function guardar() {
    const datos: DatosPregunta = { enunciado, opciones, correcta, explicacion, verificada }
    if (pregunta) {
      correr(() => actualizarPregunta(pregunta.id, datos), () => setEditando(false))
    } else {
      correr(() => crearPregunta(quizId, datos), () => {
        setEnunciado(''); setOpciones(['', '']); setCorrecta(0)
        setExplicacion(''); setVerificada(true)
        alCerrar?.()
      })
    }
  }

  // ---------- Vista compacta ----------
  if (!editando && pregunta) {
    return (
      <div className="paso-card" style={{
        borderColor: pregunta.verificada ? undefined : 'var(--warning)',
        background: pregunta.verificada ? undefined : 'var(--warning-soft)',
      }}>
        <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="paso-num">{String(pregunta.orden).padStart(2, '0')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{pregunta.enunciado}</div>
            <div className="vstack" style={{ gap: 3 }}>
              {pregunta.opciones.map((op, i) => (
                <div key={i} className="hstack" style={{ gap: 6, fontSize: 12.5 }}>
                  <Icono nombre={i === pregunta.correcta ? 'check' : 'x'} className="icon icon--sm"
                    style={{
                      width: 13, height: 13, flexShrink: 0,
                      color: i === pregunta.correcta ? 'var(--success-ink)' : 'var(--text-muted)',
                      opacity: i === pregunta.correcta ? 1 : 0.4,
                    }} />
                  <span style={{
                    color: i === pregunta.correcta ? 'var(--success-ink)' : 'var(--text-2)',
                    fontWeight: i === pregunta.correcta ? 600 : 400,
                  }}>{op}</span>
                </div>
              ))}
            </div>
            {pregunta.explicacion && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                {pregunta.explicacion}
              </p>
            )}
            {!pregunta.verificada && (
              <div className="hstack" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="badge badge--warning">Respuesta sin confirmar</span>
                <button type="button" className="btn btn--secondary btn--sm" disabled={pendiente}
                  onClick={() => correr(() => marcarVerificada(pregunta.id, true))}>
                  Confirmar que es correcta
                </button>
              </div>
            )}
            {error && <div style={{ fontSize: 12, color: 'var(--danger-ink)', marginTop: 6 }}>{error}</div>}
          </div>

          <div className="hstack" style={{ gap: 2, flexShrink: 0 }}>
            <button type="button" className="btn btn--ghost btn--sm" title="Subir"
              disabled={pendiente || esPrimera}
              onClick={() => correr(() => moverPregunta(pregunta.id, 'arriba'))}>
              <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(-90deg)' }} />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" title="Bajar"
              disabled={pendiente || esUltima}
              onClick={() => correr(() => moverPregunta(pregunta.id, 'abajo'))}>
              <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(90deg)' }} />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" title="Editar" disabled={pendiente}
              onClick={() => setEditando(true)}>
              <Icono nombre="edit" className="icon icon--sm" />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" title="Eliminar" disabled={pendiente}
              onClick={() => {
                if (!confirm('¿Eliminar esta pregunta?')) return
                correr(() => eliminarPregunta(pregunta.id))
              }}>
              <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Formulario ----------
  return (
    <div className="paso-card">
      <div className="vstack" style={{ gap: 12 }}>
        <div className="field">
          <label className="field__label">Enunciado</label>
          <textarea className="ca-textarea" style={{ minHeight: 56 }} value={enunciado}
            onChange={e => setEnunciado(e.target.value)} placeholder="Escribe la pregunta…" autoFocus />
        </div>

        <div>
          <label className="field__label" style={{ display: 'block', marginBottom: 6 }}>
            Opciones — marca la correcta
          </label>
          <div className="vstack" style={{ gap: 6 }}>
            {opciones.map((op, i) => (
              <div key={i} className="hstack" style={{ gap: 8 }}>
                <input type="radio" name={`correcta-${pregunta?.id ?? 'nueva'}`}
                  checked={correcta === i} onChange={() => setCorrecta(i)}
                  title="Marcar como respuesta correcta" style={{ flexShrink: 0 }} />
                <input className="ca-input ca-input--sm" value={op}
                  onChange={e => setOpciones(opciones.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Opción ${i + 1}`} />
                <button type="button" className="btn btn--ghost btn--sm" title="Quitar opción"
                  disabled={opciones.length <= 2} onClick={() => quitarOpcion(i)}>
                  <Icono nombre="x" className="icon icon--sm" />
                </button>
              </div>
            ))}
          </div>
          {opciones.length < MAX_OPCIONES && (
            <button type="button" className="btn btn--ghost btn--sm" style={{ marginTop: 6 }}
              onClick={() => setOpciones([...opciones, ''])}>
              <Icono nombre="plus" className="icon icon--sm" /> Agregar opción
            </button>
          )}
        </div>

        <div className="field">
          <label className="field__label">Explicación (se muestra al responder)</label>
          <textarea className="ca-textarea" style={{ minHeight: 48 }} value={explicacion}
            onChange={e => setExplicacion(e.target.value)}
            placeholder="Por qué esa es la respuesta correcta…" />
        </div>

        <label className="hstack" style={{ gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={verificada} onChange={e => setVerificada(e.target.checked)} />
          Respuesta confirmada
        </label>

        {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}

        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost btn--sm" disabled={pendiente}
            onClick={() => {
              reiniciar()
              if (pregunta) setEditando(false); else alCerrar?.()
            }}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
            {pendiente ? 'Guardando…' : pregunta ? 'Guardar' : 'Agregar pregunta'}
          </button>
        </div>
      </div>
    </div>
  )
}
