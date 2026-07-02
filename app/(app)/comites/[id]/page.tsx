import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import PanelRevision from './PanelRevision'
import PanelCompromisos from './PanelCompromisos'
import BotonCerrar from './BotonCerrar'

export default async function PaginaComite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: comite } = await supabase
    .from('comites')
    .select('id, gestion_id, fecha, semana_iso, anio, titulo, notas, cerrado, creado_por, created_at')
    .eq('id', id).single()
  if (!comite) notFound()

  const [{ data: gestion }, { data: asistentes }, { data: compromisosActuales }] = await Promise.all([
    supabase.from('gestiones').select('id, nombre, lider_id').eq('id', comite.gestion_id).single(),
    supabase.from('comite_asistentes')
      .select('usuario_id, presente, usuarios:usuario_id(id, nombre, codigo_contrato)')
      .eq('comite_id', id),
    supabase.from('compromisos')
      .select('id, responsable_id, descripcion, fecha_limite, estado, notas_revision, revisado_en_id')
      .eq('comite_origen_id', id).order('created_at'),
  ])
  if (!gestion) notFound()

  const esAdmin = sesion.rol === 'admin'
  const esLiderGestion = sesion.id === gestion.lider_id
  const puedeEditar = esAdmin || esLiderGestion
  if (!esAdmin && sesion.gestion_id !== gestion.id && !esLiderGestion) redirect('/comites')

  // Comité anterior de la misma gestión para revisar sus compromisos pendientes
  const { data: comiteAnterior } = await supabase
    .from('comites').select('id, fecha, semana_iso, anio')
    .eq('gestion_id', gestion.id)
    .lt('fecha', comite.fecha)
    .order('fecha', { ascending: false }).limit(1).maybeSingle()

  const { data: compromisosARevisar } = comiteAnterior
    ? await supabase.from('compromisos')
        .select('id, responsable_id, descripcion, fecha_limite, estado, notas_revision, revisado_en_id')
        .eq('comite_origen_id', comiteAnterior.id)
    : { data: [] as { id: string; responsable_id: string; descripcion: string; fecha_limite: string | null; estado: string; notas_revision: string | null; revisado_en_id: string | null }[] }

  const asisArr = (asistentes ?? []).map(a => {
    const rawU = a.usuarios as unknown as { id: string; nombre: string; codigo_contrato: string | null }[] | { id: string; nombre: string; codigo_contrato: string | null } | null
    const u = Array.isArray(rawU) ? (rawU[0] ?? null) : rawU
    return { usuario_id: a.usuario_id, presente: a.presente, u }
  }).filter(x => x.u !== null)

  const mapUsuario = new Map(asisArr.map(a => [a.usuario_id, a.u!]))

  // Estadísticas del comité actual (compromisos propuestos aquí)
  const total = (compromisosActuales ?? []).length
  const cumplidos = (compromisosActuales ?? []).filter(c => c.estado === 'cumplido').length
  const noCumplidos = (compromisosActuales ?? []).filter(c => c.estado === 'no_cumplido').length
  const evaluados = cumplidos + noCumplidos
  const pct = evaluados > 0 ? Math.round((cumplidos / evaluados) * 100) : null

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Comités', href: '/comites' },
        { etiqueta: `W${comite.semana_iso}/${comite.anio}` },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 20 }}>
          <Link href="/comites" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
          {puedeEditar && !comite.cerrado && total > 0 && evaluados === total && (
            <BotonCerrar comiteId={comite.id} />
          )}
        </div>

        <div style={{ marginBottom: 22 }}>
          <div className="page__eyebrow">{gestion.nombre} · Semana ISO {comite.semana_iso}/{comite.anio}</div>
          <h1 className="page__title">{comite.titulo ?? 'Comité semanal'}</h1>
          <div className="hstack" style={{ gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{comite.fecha}</span>
            {comite.cerrado
              ? <span className="badge badge--neutral">Cerrado</span>
              : <span className="badge badge--success">Abierto</span>}
            {pct !== null && (
              <span className={`badge ${pct >= 80 ? 'badge--success' : pct >= 50 ? 'badge--warning' : 'badge--danger'}`}>
                Cumplimiento {pct}% ({cumplidos}/{evaluados})
              </span>
            )}
          </div>
        </div>

        {/* Asistentes */}
        <section className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Asistentes</div>
            <span className="section-count">{asisArr.filter(a => a.presente).length} / {asisArr.length}</span>
          </div>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
            {asisArr.map(a => (
              <div key={a.usuario_id} className="hstack" style={{
                gap: 6, padding: '4px 10px', borderRadius: 999,
                background: a.presente ? 'var(--success-soft)' : 'var(--surface-sunken)',
                border: `1px solid ${a.presente ? 'var(--success)' : 'var(--border)'}`,
                fontSize: 12,
              }}>
                <div className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                  {obtenerIniciales(a.u!.nombre)}
                </div>
                <span style={{ opacity: a.presente ? 1 : 0.6 }}>{a.u!.nombre}</span>
              </div>
            ))}
            {asisArr.length === 0 && (
              <span className="text-muted text-sm">Sin asistentes registrados.</span>
            )}
          </div>
        </section>

        {/* Revisión del comité anterior */}
        {comiteAnterior && (compromisosARevisar ?? []).length > 0 && (
          <section className="card" style={{ padding: 22, marginBottom: 18 }}>
            <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div>
                <div className="page__eyebrow" style={{ marginBottom: 4 }}>Revisión</div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Compromisos de la semana anterior (W{comiteAnterior.semana_iso}/{comiteAnterior.anio})
                </h2>
              </div>
              <Link href={`/comites/${comiteAnterior.id}`} className="btn btn--ghost btn--sm">Ver acta anterior</Link>
            </div>
            <PanelRevision
              comiteActualId={comite.id}
              compromisos={(compromisosARevisar ?? []).map(c => ({
                ...c,
                responsable_nombre: mapUsuario.get(c.responsable_id)?.nombre ?? '—',
              }))}
              editable={puedeEditar && !comite.cerrado}
            />
          </section>
        )}

        {/* Compromisos nuevos (los del comité actual) */}
        <section className="card" style={{ padding: 22, marginBottom: 18 }}>
          <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="page__eyebrow" style={{ marginBottom: 4 }}>Esta semana</div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Compromisos para la próxima revisión</h2>
            </div>
            {pct !== null && (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {cumplidos} cumplidos · {noCumplidos} no cumplidos · {total - evaluados} sin revisar
              </span>
            )}
          </div>
          <PanelCompromisos
            comiteId={comite.id}
            compromisos={(compromisosActuales ?? []).map(c => ({
              ...c,
              responsable_nombre: mapUsuario.get(c.responsable_id)?.nombre ?? '—',
            }))}
            asistentes={asisArr.map(a => ({ id: a.usuario_id, nombre: a.u!.nombre }))}
            editable={puedeEditar && !comite.cerrado}
          />
        </section>

        {comite.notas && (
          <section className="card" style={{ padding: 18 }}>
            <div className="page__eyebrow" style={{ marginBottom: 6 }}>Notas del comité</div>
            <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{comite.notas}</div>
          </section>
        )}
      </main>
    </>
  )
}
