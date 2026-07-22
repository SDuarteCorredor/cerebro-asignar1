import { crearClienteServidor } from '@/lib/supabase/server'
import { calcularPonderado, semanaISOde, pesoDe } from '@/lib/comites/puntaje'
import { hoyISO } from '@/lib/documentos/vigencia'
import ClienteSaludEquipo, { type FilaEquipo } from './ClienteSaludEquipo'

interface Props {
  usuarioId: string
  esAdmin: boolean
}

/** Salud del equipo — 3 vistas: comités, desempeño y PDIs. Solo se muestra si
 *  el usuario lidera al menos una gestión (o es admin). Reusa la lógica ponderada
 *  del ranking de comités para consistencia. */
export default async function SaludEquipo({ usuarioId, esAdmin }: Props) {
  const supabase = await crearClienteServidor()

  // Gestiones que lidera (o todas activas si admin)
  const { data: gestionesLidera } = esAdmin
    ? await supabase.from('gestiones').select('id, nombre').eq('activa', true)
    : await supabase.from('gestiones').select('id, nombre').eq('lider_id', usuarioId).eq('activa', true)
  const gestionesIds = (gestionesLidera ?? []).map(g => g.id)
  if (gestionesIds.length === 0) return null

  // Equipo: usuarios activos donde jefe_id = me OR gestion_id ∈ mis gestiones lideradas
  const [{ data: reportesDirectos }, { data: miembrosGestion }] = await Promise.all([
    supabase.from('usuarios')
      .select('id, nombre, codigo_contrato, gestion_id, jefe_id, activo')
      .eq('jefe_id', usuarioId).eq('activo', true),
    supabase.from('usuarios')
      .select('id, nombre, codigo_contrato, gestion_id, jefe_id, activo')
      .in('gestion_id', gestionesIds).eq('activo', true),
  ])

  interface Miembro { id: string; nombre: string; codigo_contrato: string | null }
  const equipoMap = new Map<string, Miembro>()
  for (const u of [...(reportesDirectos ?? []), ...(miembrosGestion ?? [])]) {
    if (u.id === usuarioId) continue
    equipoMap.set(u.id, { id: u.id, nombre: u.nombre, codigo_contrato: u.codigo_contrato })
  }
  const equipo = Array.from(equipoMap.values())
  if (equipo.length === 0) return null
  const equipoIds = equipo.map(e => e.id)

  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const { semana: semanaActual } = semanaISOde(hoy)

  // 1. COMITES del año en las gestiones que lidera
  const { data: comitesAnio } = await supabase
    .from('comites').select('id, semana_iso').in('gestion_id', gestionesIds).eq('anio', anioActual)
  const comitesIds = (comitesAnio ?? []).map(c => c.id)
  const semanaPorComite = new Map((comitesAnio ?? []).map(c => [c.id, c.semana_iso]))

  const { data: compromisosEquipo } = comitesIds.length > 0 && equipoIds.length > 0
    ? await supabase.from('compromisos')
        .select('responsable_id, comite_origen_id, estado, impacto')
        .in('comite_origen_id', comitesIds).in('responsable_id', equipoIds)
    : { data: [] as { responsable_id: string; comite_origen_id: string; estado: string; impacto: string }[] }

  // 2. CICLO activo + planes donde son evaluadores + sus propias evaluaciones
  const { data: ciclos } = await supabase
    .from('ciclos_evaluacion').select('id, nombre, fecha_fin_captura')
    .lte('fecha_inicio_captura', hoyISO()).gte('fecha_fin_captura', hoyISO())
    .limit(1)
  const cicloId = ciclos?.[0]?.id
  const cicloNombre = ciclos?.[0]?.nombre ?? null

  let planesEquipo: { evaluador_id: string; estado: string }[] = []
  let miEvaluacionesEquipo: { colaborador_id: string; estado: string }[] = []
  if (cicloId) {
    const { data: evals } = await supabase
      .from('evaluaciones').select('id, colaborador_id, estado').eq('ciclo_id', cicloId).in('colaborador_id', equipoIds)
    const evalIds = (evals ?? []).map(e => e.id)
    miEvaluacionesEquipo = (evals ?? []).map(e => ({ colaborador_id: e.colaborador_id, estado: e.estado }))
    if (evalIds.length > 0) {
      const { data: planes } = await supabase
        .from('plan_evaluacion').select('evaluador_id, estado').in('evaluacion_id', evalIds)
        .in('evaluador_id', equipoIds)
      planesEquipo = planes ?? []
    }
  }

  // 3. PDIs vigentes del equipo (via evaluaciones del colaborador)
  const { data: evalsColab } = await supabase
    .from('evaluaciones').select('id, colaborador_id').in('colaborador_id', equipoIds)
  const evalPorColab = new Map<string, string[]>()
  for (const e of evalsColab ?? []) {
    const arr = evalPorColab.get(e.colaborador_id) ?? []
    arr.push(e.id)
    evalPorColab.set(e.colaborador_id, arr)
  }
  const todosEvalIds = (evalsColab ?? []).map(e => e.id)

  const { data: pdis } = todosEvalIds.length > 0
    ? await supabase.from('pdi').select('id, estado, evaluacion_id, proxima_revision')
        .in('evaluacion_id', todosEvalIds).eq('estado', 'vigente')
    : { data: [] as { id: string; estado: string; evaluacion_id: string; proxima_revision: string }[] }
  const pdiIds = (pdis ?? []).map(p => p.id)

  const { data: acciones } = pdiIds.length > 0
    ? await supabase.from('pdi_acciones').select('id, pdi_id').in('pdi_id', pdiIds)
    : { data: [] as { id: string; pdi_id: string }[] }
  const accsPorPdi = new Map<string, string[]>()
  for (const a of acciones ?? []) {
    const arr = accsPorPdi.get(a.pdi_id) ?? []
    arr.push(a.id)
    accsPorPdi.set(a.pdi_id, arr)
  }
  const todasAccIds = (acciones ?? []).map(a => a.id)
  const { data: segs } = todasAccIds.length > 0
    ? await supabase.from('pdi_seguimiento_mensual').select('pdi_accion_id, avance_pct').in('pdi_accion_id', todasAccIds)
    : { data: [] as { pdi_accion_id: string; avance_pct: number }[] }
  const ultimoAvance = new Map<string, number>()
  for (const s of segs ?? []) ultimoAvance.set(s.pdi_accion_id, s.avance_pct)

  // Cruzar todo por miembro
  const filas: FilaEquipo[] = equipo.map(m => {
    // Comités
    const mias = (compromisosEquipo ?? []).filter(c => c.responsable_id === m.id)
    const stats = calcularPonderado(mias)
    let deltaSemana = 0
    const compsPorSem = new Map<number, { estado: string; impacto: string }[]>()
    for (const c of mias) {
      const sem = semanaPorComite.get(c.comite_origen_id)
      if (!sem) continue
      const arr = compsPorSem.get(sem) ?? []
      arr.push({ estado: c.estado, impacto: c.impacto })
      compsPorSem.set(sem, arr)
      if (sem === semanaActual && c.estado === 'cumplido') deltaSemana += pesoDe(c.impacto)
    }
    const heatmap: { semana: number; pct: number | null }[] = []
    // Últimas 12 semanas
    for (let i = 11; i >= 0; i--) {
      const sem = semanaActual - i
      if (sem < 1) continue
      const arr = compsPorSem.get(sem)
      const pct = arr ? calcularPonderado(arr).pctPonderado : null
      heatmap.push({ semana: sem, pct })
    }

    // Desempeño (esta persona como evaluador)
    const misPlanes = planesEquipo.filter(p => p.evaluador_id === m.id)
    const planesPend = misPlanes.filter(p => p.estado === 'Pendiente').length
    const planesTotal = misPlanes.length
    const miEval = miEvaluacionesEquipo.find(e => e.colaborador_id === m.id)?.estado ?? null

    // PDI vigente (más reciente)
    const evalIdsMios = evalPorColab.get(m.id) ?? []
    const pdiMio = (pdis ?? []).find(p => evalIdsMios.includes(p.evaluacion_id))
    let pdiAvance: number | null = null
    let pdiProxima: string | null = null
    if (pdiMio) {
      const accIds = accsPorPdi.get(pdiMio.id) ?? []
      if (accIds.length > 0) {
        const avances = accIds.map(id => ultimoAvance.get(id) ?? 0)
        pdiAvance = Math.round(avances.reduce((a, b) => a + b, 0) / avances.length)
      } else {
        pdiAvance = 0
      }
      pdiProxima = pdiMio.proxima_revision
    }

    return {
      id: m.id,
      nombre: m.nombre,
      codigo: m.codigo_contrato,
      comites: {
        puntos: stats.pesoCumplido,
        pct: stats.pctPonderado,
        cumplidos: stats.cumplidos,
        total: stats.total,
        delta: deltaSemana,
        heatmap,
      },
      desempeno: {
        pendientes: planesPend,
        total: planesTotal,
        estadoMi: miEval,
      },
      pdi: {
        avance: pdiAvance,
        proxima: pdiProxima,
      },
    }
  })

  return (
    <ClienteSaludEquipo
      filas={filas}
      cicloNombre={cicloNombre}
      semanaActual={semanaActual}
      anio={anioActual}
    />
  )
}
