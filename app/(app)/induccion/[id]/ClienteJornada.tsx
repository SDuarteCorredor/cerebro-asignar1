'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { obtenerPreguntas, enviarRespuestas, obtenerRetroalimentacion,
         type PreguntaPublica, type Retroalimentacion } from './acciones'

export interface QuizVista {
  id: string
  numero: number
  titulo: string
  estado: string        // bloqueado | abierto | cerrado
  yaRespondi: boolean
  aciertos: number
  total: number
}

export default function ClienteJornada({ sesionId, quizzesIniciales, jornadaEstado }: {
  sesionId: string
  quizzesIniciales: QuizVista[]
  jornadaEstado: string
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  // Se usan las props directamente: router.refresh() ya trae el estado nuevo
  const quizzes = quizzesIniciales
  const [activo, setActivo] = useState<QuizVista | null>(null)
  const [preguntas, setPreguntas] = useState<PreguntaPublica[]>([])
  const [elegidas, setElegidas] = useState<Record<string, number>>({})
  const [retro, setRetro] = useState<Retroalimentacion[] | null>(null)
  const [error, setError] = useState('')

  // Mientras la jornada corre, revisamos si Paula abrió un quiz
  useEffect(() => {
    if (jornadaEstado !== 'en_curso') return
    const t = setInterval(() => router.refresh(), 6000)
    return () => clearInterval(t)
  }, [jornadaEstado, router])

  const abrirQuiz = useCallback((q: QuizVista) => {
    setError(''); setRetro(null); setElegidas({})
    startTransition(async () => {
      const res = await obtenerPreguntas(sesionId, q.id)
      if (res.error) { setError(res.error); return }
      setPreguntas(res.preguntas ?? [])
      setActivo(q)
    })
  }, [sesionId])

  function enviar() {
    if (!activo) return
    if (preguntas.some(p => elegidas[p.id] === undefined)) {
      setError('Responde todas las preguntas antes de enviar.')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await enviarRespuestas(sesionId, activo.id,
        preguntas.map(p => ({ pregunta_id: p.id, opcion: elegidas[p.id] })))
      if (res.error) { setError(res.error); return }
      const r = await obtenerRetroalimentacion(sesionId, activo.id)
      if (r.detalle) setRetro(r.detalle)
      router.refresh()
    })
  }

  async function verRetro(q: QuizVista) {
    setError('')
    const r = await obtenerRetroalimentacion(sesionId, q.id)
    if (r.error) { setError(r.error); return }
    setActivo(q); setPreguntas([]); setRetro(r.detalle ?? [])
  }

  // ---------- Retroalimentación ----------
  if (activo && retro) {
    const ok = retro.filter(d => d.acerte).length
    const pct = retro.length > 0 ? Math.round((ok / retro.length) * 100) : 0
    return (
      <section className="card card--padded">
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="page__eyebrow">Resultado</div>
            <h2 className="section-title" style={{ margin: 0 }}>{activo.titulo}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: pct >= 70 ? 'var(--success-ink)' : 'var(--warning-ink)' }}>{pct}%</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{ok} de {retro.length} correctas</div>
          </div>
        </div>

        <div className="vstack" style={{ gap: 10 }}>
          {retro.map((d, i) => (
            <div key={i} className="paso-card" style={{
              background: d.acerte ? 'var(--success-soft)' : 'var(--danger-soft)',
              borderColor: d.acerte ? 'var(--success)' : 'var(--danger)',
            }}>
              <div className="hstack" style={{ gap: 8, alignItems: 'flex-start' }}>
                <Icono nombre={d.acerte ? 'check' : 'x'} className="icon icon--sm"
                  style={{ color: d.acerte ? 'var(--success-ink)' : 'var(--danger-ink)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{d.enunciado}</div>
                  {!d.acerte && (
                    <div style={{ fontSize: 12.5, marginBottom: 2 }}>
                      Respondiste: <em>{d.opciones[d.mi_opcion]}</em>
                    </div>
                  )}
                  <div style={{ fontSize: 12.5 }}>
                    Correcta: <strong>{d.opciones[d.correcta]}</strong>
                  </div>
                  {d.explicacion && (
                    <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                      {d.explicacion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn--secondary btn--sm" style={{ marginTop: 14 }}
          onClick={() => { setActivo(null); setRetro(null) }}>
          Volver a la jornada
        </button>
      </section>
    )
  }

  // ---------- Respondiendo ----------
  if (activo && preguntas.length > 0) {
    return (
      <section className="card card--padded">
        <div className="page__eyebrow">Quiz {activo.numero}</div>
        <h2 className="section-title" style={{ marginTop: 0, marginBottom: 14 }}>{activo.titulo}</h2>

        <div className="vstack" style={{ gap: 14 }}>
          {preguntas.map((p, i) => (
            <div key={p.id} className="paso-card">
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>
                {i + 1}. {p.enunciado}
              </div>
              <div className="vstack" style={{ gap: 6 }}>
                {p.opciones.map((op, idx) => (
                  <label key={idx} className="hstack" style={{
                    gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid var(${elegidas[p.id] === idx ? '--primary' : '--border'})`,
                    background: elegidas[p.id] === idx ? 'var(--primary-soft)' : 'transparent',
                  }}>
                    <input type="radio" name={p.id} checked={elegidas[p.id] === idx}
                      onChange={() => setElegidas(prev => ({ ...prev, [p.id]: idx }))} />
                    <span style={{ fontSize: 13 }}>{op}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 10 }}>{error}</div>}

        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setActivo(null)} disabled={pendiente}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={enviar} disabled={pendiente}>
            {pendiente ? 'Enviando…' : 'Enviar respuestas'}
          </button>
        </div>
      </section>
    )
  }

  // ---------- Lista de quizzes ----------
  const completados = quizzes.filter(q => q.yaRespondi).length
  const pct = quizzes.length > 0 ? Math.round((completados / quizzes.length) * 100) : 0

  return (
    <>
      <section className="card card--padded" style={{ marginBottom: 18 }}>
        <div className="hstack" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{pct}%</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
              {completados} de {quizzes.length} quizzes completados
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--border)', height: 8, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', transition: 'width 300ms ease',
            background: pct === 100 ? 'var(--success)' : 'var(--primary)' }} />
        </div>
      </section>

      {error && (
        <div className="card" style={{ padding: 12, marginBottom: 14, background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
          <span style={{ fontSize: 13, color: 'var(--danger-ink)' }}>{error}</span>
        </div>
      )}

      <div className="vstack" style={{ gap: 10 }}>
        {quizzes.map(q => (
          <div key={q.id} className="paso-card">
            <div className="hstack" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="paso-num">{q.numero}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong style={{ fontSize: 13.5 }}>{q.titulo}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {q.yaRespondi
                    ? `Respondido · ${q.aciertos} de ${q.total} correctas`
                    : q.estado === 'abierto' ? 'Abierto: puedes responderlo ahora'
                    : 'Aún no está disponible'}
                </div>
              </div>
              {q.yaRespondi ? (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => verRetro(q)}>
                  Ver resultado
                </button>
              ) : q.estado === 'abierto' ? (
                <button type="button" className="btn btn--primary btn--sm"
                  onClick={() => abrirQuiz(q)} disabled={pendiente}>
                  {pendiente ? 'Abriendo…' : 'Responder'}
                </button>
              ) : (
                <span className="badge badge--neutral">En espera</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
