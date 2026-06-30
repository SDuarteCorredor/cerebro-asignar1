// Motor de cálculo de ECO-Asignar.
// Implementa las reglas §5.1 a §5.5 de la especificación.

export type Modalidad = '360°' | '270°'
export type TipoEvaluador = 'Jefe inmediato' | 'Par' | 'Reporte directo' | 'Autoevaluación'
export type Prioridad = 'Cumple' | 'Monitorear' | 'Desarrollar' | 'Prioridad alta'

export interface Respuesta {
  plan_evaluacion_id: string
  item_id: string
  calificacion: number | null
}
export interface Plan {
  id: string
  tipo_evaluador: TipoEvaluador
}
export interface Item {
  id: string
  competencia: string
}
export interface Ponderacion {
  modalidad: Modalidad
  tipo_evaluador: TipoEvaluador
  peso: number
}
export interface NivelEsperado {
  banda: string
  competencia: string
  nivel: number
}

export interface PromedioPorFuente {
  tipo: TipoEvaluador
  promedio: number | null   // null = sin respuestas observadas
  numRespuestas: number
}
export interface ResultadoCompetencia {
  competencia: string
  promedios: PromedioPorFuente[]
  promedioPonderado: number | null
  nivelEsperado: number
  brecha: number | null
  prioridad: Prioridad | null
}
export interface ResultadoEvaluacion {
  porCompetencia: ResultadoCompetencia[]
  promedioGeneral: number | null
  requiereRevision: boolean // si es B3-B5 y < 4.0
  modalidad: Modalidad
}

/** Calcula el promedio simple ignorando los null (no observados). */
function promedioSimple(valores: (number | null)[]): { promedio: number | null; n: number } {
  const validos = valores.filter((v): v is number => v !== null && v !== undefined)
  if (validos.length === 0) return { promedio: null, n: 0 }
  const sum = validos.reduce((a, b) => a + b, 0)
  return { promedio: sum / validos.length, n: validos.length }
}

/** Redondea a 2 decimales. */
function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

/** §5.3 — clasifica la prioridad según el tamaño de brecha. */
export function clasificarPrioridad(brecha: number | null): Prioridad | null {
  if (brecha === null || brecha === undefined) return null
  if (brecha <= 0) return 'Cumple'
  if (brecha <= 0.5) return 'Monitorear'
  if (brecha <= 1) return 'Desarrollar'
  return 'Prioridad alta'
}

/**
 * Calcula el reporte completo para una evaluación.
 * §5.1 + §5.2 + §5.3 + §5.4.
 */
export function calcularReporte(args: {
  banda: string
  modalidad: Modalidad
  planes: Plan[]
  items: Item[]
  respuestas: Respuesta[]
  ponderaciones: Ponderacion[]
  nivelesEsperados: NivelEsperado[]
}): ResultadoEvaluacion {
  const { banda, modalidad, planes, items, respuestas, ponderaciones, nivelesEsperados } = args

  // Mapa de planes por tipo
  const planesPorTipo = new Map<TipoEvaluador, string[]>()
  for (const p of planes) {
    const arr = planesPorTipo.get(p.tipo_evaluador) ?? []
    arr.push(p.id)
    planesPorTipo.set(p.tipo_evaluador, arr)
  }

  // Mapa de competencia → items
  const itemsPorCompetencia = new Map<string, string[]>()
  for (const it of items) {
    const arr = itemsPorCompetencia.get(it.competencia) ?? []
    arr.push(it.id)
    itemsPorCompetencia.set(it.competencia, arr)
  }

  // Mapa de niveles esperados de esta banda
  const nivelPorComp = new Map<string, number>()
  for (const ne of nivelesEsperados.filter(n => n.banda === banda)) {
    nivelPorComp.set(ne.competencia, ne.nivel)
  }

  // Mapa de pesos por tipo en esta modalidad
  const pesoPorTipo = new Map<TipoEvaluador, number>()
  for (const p of ponderaciones.filter(p => p.modalidad === modalidad)) {
    pesoPorTipo.set(p.tipo_evaluador, p.peso)
  }

  const tiposEsperados: TipoEvaluador[] = modalidad === '360°'
    ? ['Jefe inmediato', 'Par', 'Reporte directo', 'Autoevaluación']
    : ['Jefe inmediato', 'Par', 'Autoevaluación']

  // Una competencia por fila
  const competencias = Array.from(itemsPorCompetencia.keys()).sort()
  const porCompetencia: ResultadoCompetencia[] = competencias.map(comp => {
    const itemsComp = itemsPorCompetencia.get(comp) ?? []
    const itemIds = new Set(itemsComp)

    // Promedios por fuente (§5.1)
    const promedios: PromedioPorFuente[] = tiposEsperados.map(tipo => {
      const planIds = planesPorTipo.get(tipo) ?? []
      const planSet = new Set(planIds)
      const rels = respuestas.filter(r => planSet.has(r.plan_evaluacion_id) && itemIds.has(r.item_id))
      const { promedio, n } = promedioSimple(rels.map(r => r.calificacion))
      return { tipo, promedio, numRespuestas: n }
    })

    // Promedio ponderado (§5.2) — redistribuyendo pesos
    let sumPesos = 0
    let sumPond = 0
    for (const p of promedios) {
      if (p.promedio === null) continue
      const peso = pesoPorTipo.get(p.tipo) ?? 0
      sumPond += p.promedio * peso
      sumPesos += peso
    }
    const promedioPonderado = sumPesos > 0 ? redondear(sumPond / sumPesos) : null

    const nivelEsperado = nivelPorComp.get(comp) ?? 0
    const brecha = promedioPonderado === null ? null : redondear(nivelEsperado - promedioPonderado)
    const prioridad = clasificarPrioridad(brecha)

    return { competencia: comp, promedios, promedioPonderado, nivelEsperado, brecha, prioridad }
  })

  // Promedio general (§5.4)
  const ponderadosValidos = porCompetencia.map(p => p.promedioPonderado).filter((v): v is number => v !== null)
  const promedioGeneral = ponderadosValidos.length > 0
    ? redondear(ponderadosValidos.reduce((a, b) => a + b, 0) / ponderadosValidos.length)
    : null

  const requiereRevision = !!(
    ['B3', 'B4', 'B5'].includes(banda) &&
    promedioGeneral !== null && promedioGeneral < 4.0
  )

  return { porCompetencia, promedioGeneral, requiereRevision, modalidad }
}

// ============================================================================
// §5.5 — TOP 3 de acciones de desarrollo
// ============================================================================

export interface Accion {
  id: string
  competencia: string
  tipo: string
  nombre: string
  banda_min: string
  banda_max: string
  prioridad_min: 'Monitorear' | 'Desarrollar' | 'Prioridad alta'
  esfuerzo_th: string
  duracion: string | null
}

const PESO_TIPO: Record<string, number> = {
  'Lectura': 9, 'Feedback': 8, 'Aplicación': 7, 'Reto': 7,
  'Voluntariado': 6, 'Asignación': 5, 'Curso': 4, 'Taller': 4,
  'Mentoría': 3, 'Inmersión': 3, 'Coaching': 2, 'Programa': 1,
}
const VALOR_PRIORIDAD: Record<string, number> = {
  'Monitorear': 1, 'Desarrollar': 2, 'Prioridad alta': 3,
}
const ORDEN_BANDA = ['B1', 'B2', 'B3', 'B4', 'B5']

export function calcularTop3Acciones(args: {
  banda: string
  resultados: ResultadoCompetencia[]
  acciones: Accion[]
}): { accion: Accion; score: number; prioridadEnComp: Prioridad }[] {
  const { banda, resultados, acciones } = args
  const idxBandaEvaluado = ORDEN_BANDA.indexOf(banda)

  // Mapa: competencia → prioridad detectada
  const prioridadPorComp = new Map<string, Prioridad>()
  for (const r of resultados) {
    if (r.prioridad && r.prioridad !== 'Cumple') prioridadPorComp.set(r.competencia, r.prioridad)
  }

  // Filtrar acciones aplicables (§5.5 — 3 condiciones)
  const aplicables = acciones
    .map(a => {
      const prioridadDetectada = prioridadPorComp.get(a.competencia)
      if (!prioridadDetectada) return null
      // Banda dentro del rango
      const minIdx = ORDEN_BANDA.indexOf(a.banda_min)
      const maxIdx = ORDEN_BANDA.indexOf(a.banda_max)
      if (idxBandaEvaluado < minIdx || idxBandaEvaluado > maxIdx) return null
      // prioridad_min ≤ prioridad detectada
      const valMin = VALOR_PRIORIDAD[a.prioridad_min] ?? 1
      const valDet = VALOR_PRIORIDAD[prioridadDetectada] ?? 1
      if (valMin > valDet) return null
      const score = valDet * 100 + (PESO_TIPO[a.tipo] ?? 0)
      return { accion: a, score, prioridadEnComp: prioridadDetectada }
    })
    .filter(<T,>(x: T | null): x is T => x !== null)
    .sort((a, b) => b.score - a.score)

  // Regla de diversidad: máximo 2 por competencia en el TOP 3
  const top: typeof aplicables = []
  const contadorComp = new Map<string, number>()
  for (const cand of aplicables) {
    if (top.length >= 3) break
    const n = contadorComp.get(cand.accion.competencia) ?? 0
    if (n < 2) {
      top.push(cand)
      contadorComp.set(cand.accion.competencia, n + 1)
    }
  }
  // Completar si quedó incompleto (caso: 1 sola brecha con muchas acciones)
  if (top.length < 3) {
    for (const cand of aplicables) {
      if (top.length >= 3) break
      if (top.find(t => t.accion.id === cand.accion.id)) continue
      top.push(cand)
    }
  }

  return top
}
