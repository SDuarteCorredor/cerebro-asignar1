import { notFound } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import ClienteJornada, { type QuizVista } from './ClienteJornada'

export default async function PaginaJornadaParticipante({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  // La RLS solo deja ver la jornada a inscritos, facilitador o admin
  const { data: jornada } = await supabase
    .from('induccion_sesiones')
    .select('id, titulo, fecha, hora_inicio, modalidad, ciudad, enlace_reunion, estado')
    .eq('id', id)
    .maybeSingle()

  if (!jornada) notFound()

  const [{ data: quizzesRaw }, { data: estados }, { data: misRespuestas }] = await Promise.all([
    supabase.from('quizzes').select('id, numero, titulo').eq('activo', true).order('numero'),
    supabase.from('sesion_quiz').select('quiz_id, estado').eq('sesion_id', id),
    supabase.from('quiz_respuestas').select('quiz_id, correcta').eq('sesion_id', id).eq('usuario_id', sesion.id),
  ])

  const mapEstado = new Map((estados ?? []).map(e => [e.quiz_id, e.estado]))
  const porQuiz = new Map<string, { total: number; ok: number }>()
  for (const r of misRespuestas ?? []) {
    const e = porQuiz.get(r.quiz_id) ?? { total: 0, ok: 0 }
    e.total += 1
    if (r.correcta) e.ok += 1
    porQuiz.set(r.quiz_id, e)
  }

  const quizzes: QuizVista[] = (quizzesRaw ?? []).map(q => {
    const mio = porQuiz.get(q.id)
    return {
      id: q.id, numero: q.numero, titulo: q.titulo,
      estado: mapEstado.get(q.id) ?? 'bloqueado',
      yaRespondi: !!mio,
      aciertos: mio?.ok ?? 0,
      total: mio?.total ?? 0,
    }
  })

  const [a, m, d] = jornada.fecha.split('-')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Inducción' }, { etiqueta: jornada.titulo }]} />
      <main className="page page--narrow fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Acogida laboral</div>
            <h1 className="page__title">{jornada.titulo}</h1>
            <div className="meta-row" style={{ marginTop: 10 }}>
              <span className="text-mono">{d}/{m}/{a}</span>
              {jornada.hora_inicio && (
                <><div className="meta-divider" /><span className="text-mono">{jornada.hora_inicio.slice(0, 5)}</span></>
              )}
              <div className="meta-divider" />
              <span>{jornada.modalidad === 'presencial' ? `Presencial${jornada.ciudad ? ` · ${jornada.ciudad}` : ''}` : 'Virtual'}</span>
            </div>
          </div>
        </div>

        {jornada.estado === 'programada' && (
          <div className="card" style={{ padding: 14, marginBottom: 18, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
            <div className="hstack" style={{ gap: 8, color: 'var(--warning-ink)' }}>
              <Icono nombre="info" className="icon icon--sm" />
              <span style={{ fontSize: 13.5 }}>
                La jornada aún no ha comenzado. Los quizzes se irán activando durante la charla.
              </span>
            </div>
          </div>
        )}

        {jornada.enlace_reunion && jornada.estado === 'en_curso' && (
          <a href={jornada.enlace_reunion} target="_blank" rel="noopener noreferrer"
            className="btn btn--secondary btn--sm" style={{ marginBottom: 18 }}>
            <Icono nombre="externalLink" className="icon icon--sm" /> Entrar a la reunión
          </a>
        )}

        <ClienteJornada sesionId={id} quizzesIniciales={quizzes} jornadaEstado={jornada.estado} />
      </main>
    </>
  )
}
