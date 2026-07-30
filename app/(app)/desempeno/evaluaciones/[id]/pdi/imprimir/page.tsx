import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Icono from '@/components/app/Icono'
import {
  calcularReporte,
  type Plan, type Item, type Respuesta, type Ponderacion,
  type NivelEsperado, type Modalidad,
} from '@/lib/desempeno/calculo'
import BotonImprimir from './BotonImprimir'

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
}
function hoyBogota() {
  return new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}
function fFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
// "a, b y c"
function listaEs(items: string[]) {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}
// La firma se guarda como "Nombre — ISO"; extrae solo el nombre.
function nombreFirma(firma: string | null): string | null {
  if (!firma) return null
  return firma.split('—')[0].trim() || null
}

export default async function ImprimirActaPdi({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: pdi } = await supabase
    .from('pdi')
    .select('id, estado, fecha_acuerdo, proxima_revision, firma_colaborador, firma_jefe, firma_th, observaciones')
    .eq('evaluacion_id', evaluacionId).maybeSingle()
  if (!pdi) redirect(`/desempeno/evaluaciones/${evaluacionId}/pdi`)

  const [{ data: ciclo }, { data: cargo }, { data: jefe }] = await Promise.all([
    supabase.from('ciclos_evaluacion').select('id, nombre').eq('id', evaluacion.ciclo_id).single(),
    colaborador.cargo_id
      ? supabase.from('cargos').select('nombre, banda').eq('id', colaborador.cargo_id).single()
      : Promise.resolve({ data: null }),
    colaborador.jefe_id
      ? supabase.from('usuarios').select('nombre, cargo:cargos(nombre)').eq('id', colaborador.jefe_id).single()
      : Promise.resolve({ data: null }),
  ])
  const banda = cargo?.banda ?? 'B1'
  const modalidad: Modalidad = ['B3', 'B4', 'B5'].includes(banda) ? '360°' : '270°'
  const jefeCargo = uno(jefe?.cargo as { nombre: string } | { nombre: string }[] | null)?.nombre ?? null

  // Acciones del plan + catálogo
  const { data: accionesPdi } = await supabase
    .from('pdi_acciones')
    .select('id, accion_id, fecha_inicio, fecha_fin, responsable_seguimiento')
    .eq('pdi_id', pdi.id)
  const accionIds = (accionesPdi ?? []).map(a => a.accion_id)
  const { data: catalogo } = accionIds.length > 0
    ? await supabase.from('acciones_desarrollo').select('id, competencia, tipo, nombre').in('id', accionIds)
    : { data: [] as { id: string; competencia: string; tipo: string; nombre: string }[] }
  const mapAccion = new Map((catalogo ?? []).map(a => [a.id, a]))

  // Cálculo del reporte → brechas identificadas
  const [
    { data: planes }, { data: ponderaciones }, { data: nivelesEsperados },
    { data: items }, { data: competenciasMeta },
  ] = await Promise.all([
    supabase.from('plan_evaluacion').select('id, tipo_evaluador').eq('evaluacion_id', evaluacionId),
    supabase.from('ponderaciones_desempeno').select('modalidad, tipo_evaluador, peso'),
    supabase.from('matriz_niveles_esperados').select('banda, competencia, nivel'),
    supabase.from('items_cuestionario').select('id, competencia').eq('activo', true),
    supabase.from('competencias').select('codigo, nombre, orden').order('orden'),
  ])
  const planIds = (planes ?? []).map(p => p.id)
  const { data: respuestas } = planIds.length > 0
    ? await supabase.from('respuestas').select('plan_evaluacion_id, item_id, calificacion').in('plan_evaluacion_id', planIds)
    : { data: [] }

  const reporte = calcularReporte({
    banda, modalidad,
    planes: (planes ?? []) as Plan[],
    items: (items ?? []) as Item[],
    respuestas: (respuestas ?? []) as Respuesta[],
    ponderaciones: (ponderaciones ?? []) as Ponderacion[],
    nivelesEsperados: (nivelesEsperados ?? []) as NivelEsperado[],
  })
  const mapCompMeta = new Map((competenciasMeta ?? []).map(c => [c.codigo, c]))
  const compsConBrecha = reporte.porCompetencia
    .filter(c => c.prioridad && c.prioridad !== 'Cumple' && c.brecha !== null && c.brecha > 0)
    .map(c => ({
      nombre: mapCompMeta.get(c.competencia)?.nombre ?? c.competencia,
      orden: mapCompMeta.get(c.competencia)?.orden ?? 0,
      brecha: c.brecha as number,
      prioridad: c.prioridad as string,
    }))
    .sort((a, b) => a.orden - b.orden)

  const objetivoGeneral = compsConBrecha.length > 0
    ? `Fortalecer las competencias de ${listaEs(compsConBrecha.map(c => c.nombre.toLowerCase()))}, con el fin de cerrar las brechas identificadas en la evaluación ${ciclo?.nombre ?? ''} y mejorar el desempeño en el cargo ${cargo?.nombre ?? ''}.`
    : `Consolidar el desempeño de ${colaborador.nombre} en el cargo ${cargo?.nombre ?? ''}, sosteniendo los niveles alcanzados en la evaluación ${ciclo?.nombre ?? ''}.`

  const filasPlan = (accionesPdi ?? []).map(a => {
    const cat = mapAccion.get(a.accion_id)
    return {
      competencia: mapCompMeta.get(cat?.competencia ?? '')?.nombre ?? cat?.competencia ?? '—',
      accion: cat?.nombre ?? '—',
      responsable: a.responsable_seguimiento ?? '—',
      periodo: `${fFecha(a.fecha_inicio)} → ${fFecha(a.fecha_fin)}`,
    }
  })

  const firmaColabNom = nombreFirma(pdi.firma_colaborador) ?? colaborador.nombre
  const firmaJefeNom = nombreFirma(pdi.firma_jefe) ?? jefe?.nombre ?? ''
  const firmaThNom = nombreFirma(pdi.firma_th) ?? ''

  return (
    <main className="page fade-up">
      <div className="no-print hstack" style={{ gap: 10, marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Link href={`/desempeno/evaluaciones/${evaluacionId}/pdi`} className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
        </Link>
        <div className="hstack" style={{ gap: 10, alignItems: 'center' }}>
          <span className="text-muted text-sm">Usa &ldquo;Guardar como PDF&rdquo; como destino de impresión.</span>
          <BotonImprimir />
        </div>
      </div>

      {/* ===== Documento oficial ===== */}
      <div className="doc-print">
        <table className="doc-head">
          <tbody>
            <tr>
              <td className="doc-head__marca">
                <Image src="/logo-asignar.png" alt="Asignar S.A.S." width={150} height={150} priority className="doc-head__logo" />
                <span>Talento Humano</span>
              </td>
              <td className="doc-head__titulo">
                <strong>Plan de Desarrollo Individual — {cargo?.nombre ?? 'Colaborador'}</strong>
                <span>{ciclo?.nombre} · {modalidad}</span>
              </td>
              <td className="doc-head__control" style={{ width: '32%' }}>
                <div style={{ display: 'block' }}><b>Colaborador:</b> <span style={{ whiteSpace: 'normal' }}>{colaborador.nombre}</span></div>
                {colaborador.codigo_contrato && <div><b>Contrato:</b> <span>{colaborador.codigo_contrato}</span></div>}
                <div><b>Banda:</b> <span>{banda}</span></div>
                <div><b>Acuerdo:</b> <span>{fFecha(pdi.fecha_acuerdo)}</span></div>
                <div><b>Generado:</b> <span>{hoyBogota()}</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        <section className="doc-seccion">
          <h2>Objetivo general</h2>
          <p>{objetivoGeneral}</p>
        </section>

        <section className="doc-seccion">
          <h2>1. Brechas identificadas</h2>
          {compsConBrecha.length === 0 ? (
            <p>No se identificaron competencias por debajo del nivel esperado en esta evaluación.</p>
          ) : (
            <table className="doc-tabla">
              <thead>
                <tr>
                  <th>Competencia</th>
                  <th className="doc-tabla__num" style={{ width: 90 }}>Brecha</th>
                  <th style={{ width: 140 }}>Prioridad</th>
                </tr>
              </thead>
              <tbody>
                {compsConBrecha.map((c, i) => (
                  <tr key={i}>
                    <td>{c.nombre}</td>
                    <td className="doc-tabla__num">{c.brecha.toFixed(2)}</td>
                    <td>{c.prioridad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="doc-seccion">
          <h2>2. Plan de desarrollo</h2>
          {filasPlan.length === 0 ? (
            <p>Aún no se han definido acciones de desarrollo para este plan.</p>
          ) : (
            <table className="doc-tabla">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Competencia</th>
                  <th>Acción de desarrollo</th>
                  <th style={{ width: '16%' }}>Indicador</th>
                  <th style={{ width: '15%' }}>Responsable</th>
                  <th style={{ width: '17%' }}>Periodo</th>
                </tr>
              </thead>
              <tbody>
                {filasPlan.map((f, i) => (
                  <tr key={i}>
                    <td>{f.competencia}</td>
                    <td>{f.accion}</td>
                    <td>—</td>
                    <td>{f.responsable}</td>
                    <td>{f.periodo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="doc-seccion">
          <h2>3. Seguimiento del plan</h2>
          <p>
            Se realizarán reuniones de seguimiento entre el colaborador y el líder inmediato para revisar avances,
            dificultades y cumplimiento de las acciones acordadas. La próxima revisión está prevista para el{' '}
            <b>{fFecha(pdi.proxima_revision)}</b>, fecha en la que se evaluará el cierre de las brechas identificadas.
          </p>
          {pdi.observaciones && <p><b>Observaciones:</b> {pdi.observaciones}</p>}
        </section>

        <section className="doc-seccion">
          <h2>4. Aprobación y firmas</h2>
          <table className="doc-firmas">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Líder inmediato</th>
                <th>Gestión Humana</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
              <tr>
                <td>
                  <div><b>{firmaColabNom}</b></div>
                  <div style={{ fontSize: 10, color: '#555' }}>{cargo?.nombre ?? ''}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{pdi.firma_colaborador ? `Firmado ${fFecha(pdi.fecha_acuerdo)}` : 'Fecha: __________'}</div>
                </td>
                <td>
                  <div><b>{firmaJefeNom || '__________'}</b></div>
                  <div style={{ fontSize: 10, color: '#555' }}>{jefeCargo ?? ''}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{pdi.firma_jefe ? `Firmado ${fFecha(pdi.fecha_acuerdo)}` : 'Fecha: __________'}</div>
                </td>
                <td>
                  <div><b>{firmaThNom || '__________'}</b></div>
                  <div style={{ fontSize: 10, color: '#555' }}>Talento Humano</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{pdi.firma_th ? `Firmado ${fFecha(pdi.fecha_acuerdo)}` : 'Fecha: __________'}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="doc-pie">
          <span>{colaborador.nombre} · {cargo?.nombre ?? ''} · Banda {banda}</span>
          <span>Plan de Desarrollo Individual — Cerebro Asignar</span>
        </div>
      </div>
    </main>
  )
}
