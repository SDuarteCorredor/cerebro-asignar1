import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { BotonGenerarPdi, BotonEnviarAFirma } from './BotonesPdi'
import EditorAccionPdi from './EditorAccionPdi'
import PanelFirmas from './PanelFirmas'
import Seguimiento from './Seguimiento'
import type { TipoFirma } from './acciones'

const ORDEN_BANDA = ['B1', 'B2', 'B3', 'B4', 'B5']

const badgeEstado: Record<string, string> = {
  borrador: 'badge--warning',
  en_firma: 'badge--neutral',
  vigente: 'badge--success',
  completado: 'badge--success',
  cancelado: 'badge--danger',
}

export default async function PaginaPdi({ params }: { params: Promise<{ id: string }> }) {
  const { id: evaluacionId } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: evaluacion } = await supabase
    .from('evaluaciones').select('id, ciclo_id, colaborador_id').eq('id', evaluacionId).single()
  if (!evaluacion) notFound()

  const { data: colaborador } = await supabase
    .from('usuarios').select('id, nombre, codigo_contrato, cargo_id, jefe_id, sede')
    .eq('id', evaluacion.colaborador_id).single()
  if (!colaborador) notFound()

  const esAdmin = sesion.rol === 'admin'
  const esElColaborador = sesion.id === colaborador.id
  const esJefeDirecto = sesion.id === colaborador.jefe_id
  if (!esAdmin && !esElColaborador && !esJefeDirecto) redirect('/desempeno')

  const [{ data: ciclo }, { data: cargo }] = await Promise.all([
    supabase.from('ciclos_evaluacion').select('id, nombre').eq('id', evaluacion.ciclo_id).single(),
    colaborador.cargo_id
      ? supabase.from('cargos').select('nombre, banda').eq('id', colaborador.cargo_id).single()
      : Promise.resolve({ data: null }),
  ])
  const banda = cargo?.banda ?? 'B1'
  const idxBanda = ORDEN_BANDA.indexOf(banda)

  const { data: pdi } = await supabase
    .from('pdi')
    .select('id, estado, fecha_acuerdo, proxima_revision, firma_colaborador, firma_jefe, firma_th, observaciones, updated_at')
    .eq('evaluacion_id', evaluacionId)
    .maybeSingle()

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'Ciclos', href: '/desempeno/ciclos' },
        { etiqueta: ciclo?.nombre ?? '', href: `/desempeno/ciclos/${ciclo?.id}` },
        { etiqueta: 'PDI' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link href={`/desempeno/evaluaciones/${evaluacionId}/reporte`} className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver al reporte
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="page__eyebrow">Plan de Desarrollo Individual · {ciclo?.nombre}</div>
          <h1 className="page__title">{colaborador.nombre}</h1>
          <div className="hstack" style={{ gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            {colaborador.codigo_contrato && <span style={{ fontFamily: 'var(--font-mono)' }}>{colaborador.codigo_contrato}</span>}
            {cargo?.nombre && <span>· {cargo.nombre}</span>}
            <span style={{ fontFamily: 'var(--font-mono)' }}>· {banda}</span>
            {pdi && (
              <span className={`badge ${badgeEstado[pdi.estado] ?? 'badge--neutral'}`}>{pdi.estado}</span>
            )}
          </div>
        </div>

        {!pdi ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>Aún no hay PDI para esta evaluación</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-3)', maxWidth: 480, marginInline: 'auto' }}>
              Se generará un borrador con las 3 acciones recomendadas por el motor de cálculo (TOP 3).
              Luego podrás cambiar cualquiera por otra del catálogo antes de enviar a firma.
            </p>
            <BotonGenerarPdi evaluacionId={evaluacionId} />
          </section>
        ) : (
          <PdiDetalle
            pdiId={pdi.id}
            evaluacionId={evaluacionId}
            estado={pdi.estado}
            fechaAcuerdo={pdi.fecha_acuerdo}
            proximaRevision={pdi.proxima_revision}
            firmaColab={pdi.firma_colaborador}
            firmaJefe={pdi.firma_jefe}
            firmaTh={pdi.firma_th}
            observaciones={pdi.observaciones}
            idxBanda={idxBanda}
            editable={esAdmin || esJefeDirecto}
            esElColaborador={esElColaborador}
            esJefeDirecto={esJefeDirecto}
            esAdmin={esAdmin}
          />
        )}
      </main>
    </>
  )
}

async function PdiDetalle({
  pdiId, evaluacionId, estado, fechaAcuerdo, proximaRevision,
  firmaColab, firmaJefe, firmaTh, observaciones, idxBanda, editable,
  esElColaborador, esJefeDirecto, esAdmin,
}: {
  pdiId: string
  evaluacionId: string
  estado: string
  fechaAcuerdo: string
  proximaRevision: string
  firmaColab: string | null
  firmaJefe: string | null
  firmaTh: string | null
  observaciones: string | null
  idxBanda: number
  editable: boolean
  esElColaborador: boolean
  esJefeDirecto: boolean
  esAdmin: boolean
}) {
  const supabase = await crearClienteServidor()

  const { data: accionesPdi } = await supabase
    .from('pdi_acciones')
    .select('id, accion_id, fecha_inicio, fecha_fin, responsable_seguimiento, estado')
    .eq('pdi_id', pdiId)

  const accionIds = (accionesPdi ?? []).map(a => a.accion_id)
  const pdiAccionIds = (accionesPdi ?? []).map(a => a.id)

  const [{ data: catalogo }, { data: seguimientos }] = await Promise.all([
    accionIds.length > 0
      ? supabase.from('acciones_desarrollo')
          .select('id, competencia, tipo, nombre, banda_min, banda_max, esfuerzo_th, duracion')
          .in('id', accionIds)
      : Promise.resolve({ data: [] as { id: string; competencia: string; tipo: string; nombre: string; banda_min: string; banda_max: string; esfuerzo_th: string; duracion: string | null }[] }),
    pdiAccionIds.length > 0
      ? supabase.from('pdi_seguimiento_mensual')
          .select('pdi_accion_id, fecha_corte, avance_pct, comentario')
          .in('pdi_accion_id', pdiAccionIds)
          .order('fecha_corte', { ascending: true })
      : Promise.resolve({ data: [] as { pdi_accion_id: string; fecha_corte: string; avance_pct: number; comentario: string | null }[] }),
  ])

  const mapAccion = new Map((catalogo ?? []).map(a => [a.id, a]))
  const cortesPorAccion = new Map<string, { fecha_corte: string; avance_pct: number; comentario: string | null }[]>()
  for (const s of seguimientos ?? []) {
    const arr = cortesPorAccion.get(s.pdi_accion_id) ?? []
    arr.push({ fecha_corte: s.fecha_corte, avance_pct: s.avance_pct, comentario: s.comentario })
    cortesPorAccion.set(s.pdi_accion_id, arr)
  }

  const competencias = new Set((catalogo ?? []).map(a => a.competencia))
  const { data: candidatasAll } = await supabase
    .from('acciones_desarrollo')
    .select('id, competencia, tipo, nombre, banda_min, banda_max, esfuerzo_th, duracion')
    .eq('activo', true)
    .in('competencia', Array.from(competencias))

  const candidatasPorComp = new Map<string, typeof candidatasAll>()
  for (const c of candidatasAll ?? []) {
    const min = ORDEN_BANDA.indexOf(c.banda_min)
    const max = ORDEN_BANDA.indexOf(c.banda_max)
    if (idxBanda < min || idxBanda > max) continue
    const arr = candidatasPorComp.get(c.competencia) ?? []
    arr.push(c)
    candidatasPorComp.set(c.competencia, arr)
  }

  const puedeEditar = editable && estado === 'borrador'
  const puedeEnviar = editable && estado === 'borrador' && (accionesPdi?.length ?? 0) > 0

  const enFirmaOVigente = estado === 'en_firma' || estado === 'vigente' || estado === 'completado'
  const firmas = [
    { tipo: 'colaborador' as TipoFirma, label: 'Colaborador', firma: firmaColab, emoji: '👤', puedeFirmar: esElColaborador && !firmaColab && estado === 'en_firma' },
    { tipo: 'jefe' as TipoFirma, label: 'Jefe directo', firma: firmaJefe, emoji: '👥', puedeFirmar: esJefeDirecto && !firmaJefe && estado === 'en_firma' },
    { tipo: 'th' as TipoFirma, label: 'Talento Humano', firma: firmaTh, emoji: '🏢', puedeFirmar: esAdmin && !firmaTh && estado === 'en_firma' },
  ]

  const puedeRegistrarSeguimiento = (estado === 'vigente' || estado === 'completado') && (esElColaborador || esJefeDirecto || esAdmin)

  return (
    <>
      {/* Datos generales */}
      <section className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div className="grid-stats">
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Fecha de acuerdo</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{fechaAcuerdo}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Próxima revisión</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{proximaRevision}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Estado</div>
            <div style={{ fontSize: 14, marginTop: 2 }}>
              <span className={`badge ${badgeEstado[estado] ?? 'badge--neutral'}`}>{estado}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Firmas</div>
            <div className="hstack" style={{ gap: 6, marginTop: 4, fontSize: 11.5 }}>
              <span aria-hidden="true" style={{ opacity: firmaColab ? 1 : 0.35 }}>👤</span>
              <span aria-hidden="true" style={{ opacity: firmaJefe ? 1 : 0.35 }}>👥</span>
              <span aria-hidden="true" style={{ opacity: firmaTh ? 1 : 0.35 }}>🏢</span>
            </div>
          </div>
        </div>
      </section>

      {enFirmaOVigente && (
        <PanelFirmas pdiId={pdiId} evaluacionId={evaluacionId} firmas={firmas} />
      )}

      {/* Lista de acciones */}
      <section className="card" style={{ padding: 22, marginBottom: 18 }}>
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div>
            <div className="page__eyebrow" style={{ marginBottom: 4 }}>Acciones del plan</div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Hasta 3 acciones de desarrollo</h2>
          </div>
          {puedeEnviar && <BotonEnviarAFirma pdiId={pdiId} evaluacionId={evaluacionId} />}
        </div>

        <div className="vstack" style={{ gap: 10 }}>
          {(accionesPdi ?? []).map((a, i) => {
            const cat = mapAccion.get(a.accion_id)
            if (!cat) return null
            const candidatas = (candidatasPorComp.get(cat.competencia) ?? []).filter(c => c.id !== a.accion_id)
            const cortes = cortesPorAccion.get(a.id) ?? []
            const avanceActual = cortes.length > 0 ? cortes[cortes.length - 1].avance_pct : 0
            return (
              <div key={a.id} className="card" style={{ padding: 16, background: 'var(--surface-sunken)' }}>
                <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 999,
                    background: avanceActual === 100 ? 'var(--success)' : 'var(--primary)',
                    color: 'var(--on-primary)',
                    display: 'grid', placeItems: 'center',
                    fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
                  }}>{avanceActual === 100 ? '✓' : i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="hstack" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 14.5 }}>{cat.nombre}</strong>
                      <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 11 }}>{cat.tipo}</span>
                      <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 11 }}>{cat.competencia}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                      {cat.id} · {cat.duracion ?? '—'} · Esfuerzo TH: {cat.esfuerzo_th} · {a.fecha_inicio} → {a.fecha_fin} · {a.responsable_seguimiento}
                    </div>
                    {enFirmaOVigente && estado !== 'en_firma' && (
                      <Seguimiento
                        pdiAccionId={a.id}
                        evaluacionId={evaluacionId}
                        cortes={cortes}
                        avanceActual={avanceActual}
                        puedeRegistrar={puedeRegistrarSeguimiento}
                      />
                    )}
                  </div>
                  <EditorAccionPdi
                    pdiId={pdiId}
                    pdiAccionId={a.id}
                    accionActualId={a.accion_id}
                    evaluacionId={evaluacionId}
                    candidatas={candidatas ?? []}
                    editable={puedeEditar}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {observaciones && (
        <section className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="page__eyebrow" style={{ marginBottom: 6 }}>Observaciones</div>
          <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{observaciones}</div>
        </section>
      )}
    </>
  )
}
