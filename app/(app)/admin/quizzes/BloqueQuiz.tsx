'use client'

import { useState } from 'react'
import Icono from '@/components/app/Icono'
import EditorPregunta, { type PreguntaData } from './EditorPregunta'

export default function BloqueQuiz({ quizId, numero, titulo, descripcion, vaDespuesDe, preguntas }: {
  quizId: string
  numero: number
  titulo: string
  descripcion: string | null
  vaDespuesDe: string | null
  preguntas: PreguntaData[]
}) {
  const [agregando, setAgregando] = useState(false)
  const sinConfirmar = preguntas.filter(p => !p.verificada).length

  return (
    <section className="card card--padded">
      <div className="hstack" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
        <div className="paso-num">{numero}</div>
        <h2 className="section-title" style={{ margin: 0 }}>{titulo}</h2>
        <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'}
        </span>
        {sinConfirmar > 0 && (
          <span className="badge badge--warning">{sinConfirmar} sin confirmar</span>
        )}
      </div>
      {descripcion && (
        <p className="text-muted text-sm" style={{ margin: '0 0 2px' }}>{descripcion}</p>
      )}
      {vaDespuesDe && (
        <p className="text-muted text-sm" style={{ margin: '0 0 14px' }}>
          Va después de: <strong>{vaDespuesDe}</strong>
        </p>
      )}

      <div className="vstack" style={{ gap: 8 }}>
        {preguntas.map((p, i) => (
          <EditorPregunta
            key={p.id}
            quizId={quizId}
            pregunta={p}
            esPrimera={i === 0}
            esUltima={i === preguntas.length - 1}
          />
        ))}

        {agregando ? (
          <EditorPregunta quizId={quizId} pregunta={null} alCerrar={() => setAgregando(false)} />
        ) : (
          <button type="button" className="btn btn--secondary btn--sm" style={{ alignSelf: 'flex-start' }}
            onClick={() => setAgregando(true)}>
            <Icono nombre="plus" className="icon icon--sm" /> Agregar pregunta
          </button>
        )}
      </div>
    </section>
  )
}
