import { notFound } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import PanelPresentacion from './PanelPresentacion'
import PanelParticipantes, { type ParticipanteData } from './PanelParticipantes'
import ControlesJornada from './ControlesJornada'

const badgeEstado: Record<string, string> = {
  programada: 'badge--neutral', en_curso: 'badge--warning',
  finalizada: 'badge--success', cancelada: 'badge--danger',
}
const etiquetaEstado: Record<string, string> = {
  programada: 'Programada', en_curso: 'En curso',
  finalizada: 'Finalizada', cancelada: 'Cancelada',
}

export default async function DetalleSesionInduccion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const { data: jornada } = await supabase
    .from('induccion_sesiones')
    .select('id, titulo, fecha, hora_inicio, modalidad, ciudad, enlace_reunion, estado, presentacion_nombre')
    .eq('id', id)
    .maybeSingle()

  if (!jornada) notFound()

  const [{ data: inscritosRaw }, { data: candidatos }] = await Promise.all([
    supabase.from('induccion_participantes')
      .select('usuario_id, asistio, usuario:usuarios(nombre, codigo_contrato)')
      .eq('sesion_id', id),
    supabase.from('usuarios')
      .select('id, nombre, codigo_contrato')
      .eq('activo', true)
      .order('nombre'),
  ])

  const participantes: ParticipanteData[] = (inscritosRaw ?? []).map(p => {
    const uRaw = p.usuario as unknown as { nombre: string; codigo_contrato: string | null }[] | { nombre: string; codigo_contrato: string | null } | null
    const u = Array.isArray(uRaw) ? (uRaw[0] ?? null) : uRaw
    return {
      usuario_id: p.usuario_id,
      asistio: p.asistio,
      nombre: u?.nombre ?? 'Sin nombre',
      codigo_contrato: u?.codigo_contrato ?? null,
    }
  }).sort((a, b) => a.nombre.localeCompare(b.nombre))

  const [a, m, d] = jornada.fecha.split('-')

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Administración' },
        { etiqueta: 'Inducción', href: '/admin/induccion' },
        { etiqueta: jornada.titulo },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 18 }}>
          <Link href="/admin/induccion" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>

        <div className="page__header">
          <div>
            <div className="hstack" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className={`badge ${badgeEstado[jornada.estado] ?? 'badge--neutral'}`}>
                {etiquetaEstado[jornada.estado] ?? jornada.estado}
              </span>
              <span className="badge badge--neutral">
                {jornada.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
              </span>
            </div>
            <h1 className="page__title">{jornada.titulo}</h1>
            <div className="meta-row" style={{ marginTop: 10 }}>
              <span className="text-mono">{d}/{m}/{a}</span>
              {jornada.hora_inicio && (
                <>
                  <div className="meta-divider" />
                  <span className="text-mono">{jornada.hora_inicio.slice(0, 5)}</span>
                </>
              )}
              {jornada.ciudad && (
                <>
                  <div className="meta-divider" />
                  <span>{jornada.ciudad}</span>
                </>
              )}
              {jornada.enlace_reunion && (
                <>
                  <div className="meta-divider" />
                  <a href={jornada.enlace_reunion} target="_blank" rel="noopener noreferrer"
                    className="hstack" style={{ gap: 4, color: 'var(--primary)', textDecoration: 'underline' }}>
                    <Icono nombre="externalLink" className="icon icon--sm" style={{ width: 13, height: 13 }} />
                    Enlace de la reunión
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="layout-main-aside">
          <div className="vstack" style={{ gap: 18 }}>
            <PanelPresentacion sesionId={id} nombreActual={jornada.presentacion_nombre} />
            <PanelParticipantes
              sesionId={id}
              participantes={participantes}
              candidatos={candidatos ?? []}
            />
          </div>
          <aside className="vstack" style={{ gap: 18 }}>
            <ControlesJornada sesionId={id} estado={jornada.estado} participantes={participantes.length} />

            <div className="card callout">
              <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                <Icono nombre="info" className="icon" style={{ color: 'var(--primary)' }} />
                <strong style={{ color: 'var(--primary-ink)' }}>Quizzes</strong>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--primary-ink)', opacity: 0.85 }}>
                Los 3 quizzes de la jornada y la consola para activarlos en vivo llegan en la siguiente
                entrega. El avance de cada participante se calculará con ellos.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </>
  )
}
