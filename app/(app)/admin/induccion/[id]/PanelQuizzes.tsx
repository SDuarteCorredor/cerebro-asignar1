'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { cambiarEstadoQuiz, obtenerAvanceQuizzes, obtenerResultadosQuiz,
         type AvanceQuiz, type ResultadoPersona } from '../accionesQuiz'

export interface QuizData {
  id: string
  numero: number
  titulo: string
  descripcion: string | null
  va_despues_de: string | null
  preguntas: number
  estado: string          // bloqueado | abierto | cerrado
}

export default function PanelQuizzes({ sesionId, quizzes, inscritos, jornadaEnCurso }: {
  sesionId: string
  quizzes: QuizData[]
  inscritos: number
  jornadaEnCurso: boolean
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [avance, setAvance] = useState<AvanceQuiz[]>([])
  const [resultados, setResultados] = useState<Record<string, ResultadoPersona[]>>({})
  const [abierto, setAbierto] = useState<string | null>(null)

  const hayAbierto = quizzes.some(q => q.estado === 'abierto')

  // Sondeo mientras un quiz está abierto: así Paula ve llegar las respuestas
  useEffect(() => {
    if (!hayAbierto) return
    let vivo = true
    async function traer() {
      const res = await obtenerAvanceQuizzes(sesionId)
      if (vivo) setAvance(res.avance)
    }
    void traer()
    const t = setInterval(traer, 4000)
    return () => { vivo = false; clearInterval(t) }
  }, [sesionId, hayAbierto])

  function cambiar(quizId: string, estado: string) {
    setError('')
    startTransition(async () => {
      const res = await cambiarEstadoQuiz(sesionId, quizId, estado)
      if (res.error) { setError(res.error); return }
      if (estado === 'cerrado') {
        const r = await obtenerResultadosQuiz(sesionId, quizId)
        setResultados(prev => ({ ...prev, [quizId]: r }))
        setAbierto(quizId)
      }
      router.refresh()
    })
  }

  async function verResultados(quizId: string) {
    if (abierto === quizId) { setAbierto(null); return }
    const r = await obtenerResultadosQuiz(sesionId, quizId)
    setResultados(prev => ({ ...prev, [quizId]: r }))
    setAbierto(quizId)
  }

  return (
    <section className="card card--padded">
      <div className="page__eyebrow" style={{ marginBottom: 4 }}>Quizzes</div>
      <h2 className="section-title" style={{ marginTop: 0, marginBottom: 4 }}>Consola de la jornada</h2>
      <p className="text-muted text-sm" style={{ margin: '0 0 14px' }}>
        {jornadaEnCurso
          ? 'Abre cada quiz cuando llegues a ese punto de la presentación. Al cerrarlo verás los resultados.'
          : 'Inicia la jornada para poder abrir los quizzes.'}
      </p>

      <div className="vstack" style={{ gap: 10 }}>
        {quizzes.map(q => {
          const av = avance.find(a => a.quiz_id === q.id)
          const respondieron = av?.respondieron ?? 0
          const res = resultados[q.id]

          return (
            <div key={q.id} className="paso-card">
              <div className="hstack" style={{ gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="paso-num">{q.numero}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13.5 }}>{q.titulo}</strong>
                    {q.estado === 'abierto' && <span className="badge badge--warning">Abierto</span>}
                    {q.estado === 'cerrado' && <span className="badge badge--success">Cerrado</span>}
                    <span className="text-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {q.preguntas} pregunta{q.preguntas === 1 ? '' : 's'}
                    </span>
                  </div>
                  {q.va_despues_de && (
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      Va después de: {q.va_despues_de}
                    </div>
                  )}

                  {q.estado === 'abierto' && (
                    <div style={{ marginTop: 8 }}>
                      <div className="hstack" style={{ gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--warning-ink)' }}>
                          <strong>{respondieron}</strong> de {inscritos} respondieron
                        </span>
                      </div>
                      <div style={{ background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{
                          width: `${inscritos > 0 ? (respondieron / inscritos) * 100 : 0}%`,
                          height: '100%', background: 'var(--warning)', transition: 'width 300ms ease',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="hstack" style={{ gap: 6 }}>
                  {q.estado !== 'abierto' && (
                    <button type="button" className="btn btn--primary btn--sm"
                      disabled={pendiente || !jornadaEnCurso || hayAbierto}
                      title={hayAbierto ? 'Cierra el quiz abierto primero' : undefined}
                      onClick={() => cambiar(q.id, 'abierto')}>
                      {q.estado === 'cerrado' ? 'Reabrir' : 'Abrir'}
                    </button>
                  )}
                  {q.estado === 'abierto' && (
                    <button type="button" className="btn btn--secondary btn--sm" disabled={pendiente}
                      onClick={() => cambiar(q.id, 'cerrado')}>
                      Cerrar y ver resultados
                    </button>
                  )}
                  {q.estado === 'cerrado' && (
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => verResultados(q.id)}>
                      <Icono nombre="chart" className="icon icon--sm" />
                      {abierto === q.id ? 'Ocultar' : 'Resultados'}
                    </button>
                  )}
                </div>
              </div>

              {abierto === q.id && res && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--divider)', paddingTop: 10 }}>
                  {res.length === 0 ? (
                    <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Nadie respondió este quiz.</span>
                  ) : (
                    <div className="vstack" style={{ gap: 4 }}>
                      {res.map(p => {
                        const pct = p.total > 0 ? Math.round((p.aciertos / p.total) * 100) : 0
                        return (
                          <div key={p.usuario_id} className="hstack" style={{ gap: 10, fontSize: 12.5 }}>
                            <span style={{ flex: 1, minWidth: 0 }}>{p.nombre}</span>
                            <span className="text-mono" style={{
                              color: pct >= 70 ? 'var(--success-ink)' : 'var(--danger-ink)', fontWeight: 600,
                            }}>
                              {p.aciertos}/{p.total} · {pct}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 10 }}>{error}</div>}
    </section>
  )
}
