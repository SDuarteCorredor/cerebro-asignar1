import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import BloqueQuiz from './BloqueQuiz'
import type { PreguntaData } from './EditorPregunta'

export default async function AdminQuizzes() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const [{ data: quizzes }, { data: preguntasRaw }] = await Promise.all([
    supabase.from('quizzes').select('id, numero, titulo, descripcion, va_despues_de')
      .eq('activo', true).order('numero'),
    supabase.from('quiz_preguntas')
      .select('id, quiz_id, orden, enunciado, opciones, correcta, explicacion, verificada')
      .order('orden'),
  ])

  const porQuiz = new Map<string, PreguntaData[]>()
  for (const p of preguntasRaw ?? []) {
    const lista = porQuiz.get(p.quiz_id) ?? []
    lista.push({
      id: p.id,
      orden: p.orden,
      enunciado: p.enunciado,
      opciones: (p.opciones as string[]) ?? [],
      correcta: p.correcta,
      explicacion: p.explicacion,
      verificada: p.verificada,
    })
    porQuiz.set(p.quiz_id, lista)
  }

  const totalSinConfirmar = (preguntasRaw ?? []).filter(p => !p.verificada).length

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Quizzes' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Acogida laboral</div>
            <h1 className="page__title">Quizzes de la inducción</h1>
            <p className="page__subtitle">
              Las preguntas que validan la charla. Se abren en vivo durante la jornada y el avance
              de cada participante se calcula con ellas.
            </p>
          </div>
        </div>

        {totalSinConfirmar > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 20, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
            <div className="hstack" style={{ gap: 8, color: 'var(--warning-ink)', alignItems: 'flex-start' }}>
              <Icono nombre="info" className="icon icon--sm" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13.5 }}>
                Hay <strong>{totalSinConfirmar} pregunta{totalSinConfirmar === 1 ? '' : 's'}</strong> cuya
                respuesta correcta no se pudo verificar contra la presentación (datos de historia interna
                de Asignar). Revísalas y confírmalas antes de la primera jornada: si están mal, los
                participantes recibirán una retroalimentación equivocada.
              </span>
            </div>
          </div>
        )}

        <div className="vstack" style={{ gap: 20 }}>
          {(quizzes ?? []).map(q => (
            <BloqueQuiz
              key={q.id}
              quizId={q.id}
              numero={q.numero}
              titulo={q.titulo}
              descripcion={q.descripcion}
              vaDespuesDe={q.va_despues_de}
              preguntas={porQuiz.get(q.id) ?? []}
            />
          ))}
        </div>
      </main>
    </>
  )
}
