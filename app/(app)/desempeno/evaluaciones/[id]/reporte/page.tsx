import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import dynamic from 'next/dynamic'

const RadarReporte = dynamic(() => import('./RadarReporte'), {
  loading: () => <div style={{ width: '100%', height: 360, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 13 }}>Cargando gráfico…</div>,
})
import { calcularReporte, calcularTop3Acciones, type Plan, type Item, type Respuesta, type Ponderacion, type NivelEsperado, type Accion, type Modalidad, type Prioridad } from '@/lib/desempeno/calculo'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const colorPrioridad: Record<Prioridad, string> = {
  'Cumple':         'badge--success',
  'Monitorear':     'badge--neutral',
  'Desarrollar':    'badge--warning',
  'Prioridad alta': 'badge--danger',
}

const categoriaPorPromedio = (n: number | null): { etiqueta: string; color: string } => {
  if (n === null) return { etiqueta: 'Sin datos', color: 'var(--text-3)' }
  if (n >= 4.6) return { etiqueta: 'Excelente / Excepcional', color: 'var(--success-ink)' }
  if (n >= 4.0) return { etiqueta: 'Competente / Sobresaliente', color: 'var(--primary-ink)' }
  if (n >= 3.0) return { etiqueta: 'Satisfactorio mínimo', color: 'var(--warning-ink)' }
  return { etiqueta: 'Insatisfactorio', color: 'var(--danger-ink)' }
}

export default async function PaginaReporteEvaluacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  // Cargar evaluación + colaborador + ciclo + cargo + planes + items + respuestas + ponderaciones + niveles + acciones
  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, ciclo_id, colaborador_id, estado, requiere_revision')
    .eq('id', id)
    .single()
  if (!evaluacion) notFound()

  // Control de acceso: admin o el propio colaborador o su jefe directo
  const { data: colaborador } = await supabase
    .from('usuarios')
    .select('id, nombre, codigo_contrato, cargo_id, jefe_id, sede')
    .eq('id', evaluacion.colaborador_id)
    .single()
  if (!colaborador) notFound()

  const esAdmin = perfil.rol === 'admin'
  const esElColaborador = perfil.id === colaborador.id
  const esJefeDirecto = perfil.id === colaborador.jefe_id
  if (!esAdmin && !esElColaborador && !esJefeDirecto) redirect('/desempeno')

  const [
    { data: ciclo },
    { data: cargo },
    { data: planes },
    { data: ponderaciones },
    { data: nivelesEsperados },
    { data: items },
    { data: competenciasMeta },
    { data: acciones },
  ] = await Promise.all([
    supabase.from('ciclos_evaluacion').select('id, nombre, fecha_inicio, fecha_fin_captura, estado').eq('id', evaluacion.ciclo_id).single(),
    colaborador.cargo_id
      ? supabase.from('cargos').select('nombre, banda').eq('id', colaborador.cargo_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('plan_evaluacion').select('id, tipo_evaluador').eq('evaluacion_id', id),
    supabase.from('ponderaciones_desempeno').select('modalidad, tipo_evaluador, peso'),
    supabase.from('matriz_niveles_esperados').select('banda, competencia, nivel'),
    supabase.from('items_cuestionario').select('id, competencia').eq('activo', true),
    supabase.from('competencias').select('codigo, nombre, tipo, orden').order('orden'),
    supabase.from('acciones_desarrollo').select('id, competencia, tipo, nombre, banda_min, banda_max, prioridad_min, esfuerzo_th, duracion').eq('activo', true),
  ])

  const banda = cargo?.banda ?? 'B1'
  const modalidad: Modalidad = ['B3', 'B4', 'B5'].includes(banda) ? '360°' : '270°'

  // Cargar respuestas SOLO de los planes de esta evaluación
  const planIds = (planes ?? []).map(p => p.id)
  const { data: respuestas } = planIds.length > 0
    ? await supabase.from('respuestas').select('plan_evaluacion_id, item_id, calificacion').in('plan_evaluacion_id', planIds)
    : { data: [] }

  const reporte = calcularReporte({
    banda,
    modalidad,
    planes: (planes ?? []) as Plan[],
    items: (items ?? []) as Item[],
    respuestas: (respuestas ?? []) as Respuesta[],
    ponderaciones: (ponderaciones ?? []) as Ponderacion[],
    nivelesEsperados: (nivelesEsperados ?? []) as NivelEsperado[],
  })

  const top3 = calcularTop3Acciones({
    banda,
    resultados: reporte.porCompetencia,
    acciones: (acciones ?? []) as Accion[],
  })

  const mapCompMeta = new Map((competenciasMeta ?? []).map(c => [c.codigo, c]))
  const competenciasEnReporte = reporte.porCompetencia
    .map(r => ({ ...r, meta: mapCompMeta.get(r.competencia) }))
    .sort((a, b) => (a.meta?.orden ?? 0) - (b.meta?.orden ?? 0))

  const categoria = categoriaPorPromedio(reporte.promedioGeneral)

  // Datos para radar
  const radarData = competenciasEnReporte.map(c => ({
    competencia: c.competencia,
    nombre: c.meta?.nombre ?? c.competencia,
    actual: c.promedioPonderado ?? 0,
    esperado: c.nivelEsperado,
  }))

  // Estado de captura
  const totalPlanes = (planes ?? []).length
  const planesRespondidos = (respuestas ?? []).length > 0
    ? new Set((respuestas ?? []).map(r => r.plan_evaluacion_id)).size
    : 0

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'Ciclos', href: '/desempeno/ciclos' },
        { etiqueta: ciclo?.nombre ?? '', href: `/desempeno/ciclos/${ciclo?.id}` },
        { etiqueta: 'Reporte' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
          <Link href={`/desempeno/ciclos/${ciclo?.id}`} className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver al ciclo
          </Link>
          <Link href={`/desempeno/evaluaciones/${id}/pdi`} className="btn btn--primary btn--sm">
            Ver / crear PDI
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="page__eyebrow">Reporte individual · {ciclo?.nombre}</div>
          <h1 className="page__title">{colaborador.nombre}</h1>
          <div className="hstack" style={{ gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            {colaborador.codigo_contrato && <span style={{ fontFamily: 'var(--font-mono)' }}>{colaborador.codigo_contrato}</span>}
            {cargo?.nombre && <span>· {cargo.nombre}</span>}
            <span style={{ fontFamily: 'var(--font-mono)' }}>· {banda}</span>
            <span className="badge badge--neutral badge--no-dot">{modalidad}</span>
            {colaborador.sede && <span>· {colaborador.sede}</span>}
          </div>
        </div>

        {reporte.requiereRevision && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'var(--danger-ink)', fontSize: 13.5 }}>
            <strong>⚠ Requiere revisión:</strong> el promedio general está por debajo de 4.0 (mínimo política Líder según TH-PL-02). Activa Plan de Mejora con Jefe Directo + TH.
          </div>
        )}

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: categoria.color }}>
              {reporte.promedioGeneral?.toFixed(2) ?? '—'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Promedio general</div>
            <div style={{ fontSize: 11.5, color: categoria.color, marginTop: 2 }}>{categoria.etiqueta}</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {planesRespondidos} / {totalPlanes}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Evaluadores respondidos</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {competenciasEnReporte.filter(c => c.prioridad === 'Cumple').length}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Competencias en nivel</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--danger-ink)' }}>
              {competenciasEnReporte.filter(c => c.prioridad && c.prioridad !== 'Cumple').length}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Con brecha</div>
          </div>
        </div>

        {/* Radar + Tabla */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 18, marginBottom: 24, alignItems: 'flex-start' }}>
          <section className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Radar — Actual vs Esperado</h3>
            <RadarReporte data={radarData} />
            <div className="hstack" style={{ gap: 14, fontSize: 12, color: 'var(--text-3)', marginTop: 8, justifyContent: 'center' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--primary)', borderRadius: 2, marginRight: 4 }} /> Actual</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--success)', borderRadius: 2, marginRight: 4 }} /> Esperado</span>
            </div>
          </section>

          <section className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Competencia</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Actual</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Esperado</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Brecha</th>
                  <th style={{ width: 140 }}>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {competenciasEnReporte.map(c => (
                  <tr key={c.competencia}>
                    <td>
                      <div className="row-title">{c.meta?.nombre ?? c.competencia}</div>
                      <div className="row-sub">{c.competencia} · {c.meta?.tipo}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {c.promedioPonderado?.toFixed(2) ?? '—'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                      {c.nivelEsperado}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: c.brecha === null || c.brecha <= 0 ? 'var(--success-ink)' : 'var(--danger-ink)' }}>
                      {c.brecha === null ? '—' : (c.brecha > 0 ? '+' : '') + c.brecha.toFixed(2)}
                    </td>
                    <td>
                      {c.prioridad && (
                        <span className={`badge ${colorPrioridad[c.prioridad]}`}>{c.prioridad}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* TOP 3 acciones */}
        <section className="card" style={{ padding: 22 }}>
          <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="page__eyebrow" style={{ marginBottom: 4 }}>Recomendación</div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>TOP 3 acciones de desarrollo</h2>
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Para construir el PDI</span>
          </div>
          {top3.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              No hay brechas que requieran acción, o no se calcularon promedios todavía.
            </p>
          ) : (
            <div className="vstack" style={{ gap: 10 }}>
              {top3.map((t, i) => (
                <div key={t.accion.id} className="card" style={{ padding: 16, background: 'var(--surface-sunken)' }}>
                  <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 999,
                      background: 'var(--primary)', color: 'var(--on-primary)',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="hstack" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14.5 }}>{t.accion.nombre}</strong>
                        <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 11 }}>{t.accion.tipo}</span>
                        <span className={`badge ${colorPrioridad[t.prioridadEnComp]}`}>{t.prioridadEnComp}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                        {t.accion.id} · {t.accion.competencia} · {t.accion.duracion} · Esfuerzo TH: {t.accion.esfuerzo_th}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
