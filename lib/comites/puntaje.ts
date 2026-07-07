// Ponderación de compromisos por impacto (4DX — anti-sandbagging).
// El cumplimiento se mide por peso, no por conteo plano.

export type Impacto = 'bajo' | 'medio' | 'alto'
export type EstadoCompromiso = 'pendiente' | 'reportado' | 'cumplido' | 'no_cumplido' | 'arrastrado'

export const PESO_IMPACTO: Record<Impacto, number> = {
  bajo: 1,
  medio: 2,
  alto: 3,
}

export const ETIQUETA_IMPACTO: Record<Impacto, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
}

export const BADGE_IMPACTO: Record<Impacto, string> = {
  bajo: 'badge--neutral',
  medio: 'badge--warning',
  alto: 'badge--danger',
}

export function pesoDe(impacto: string | null | undefined): number {
  return PESO_IMPACTO[(impacto ?? 'medio') as Impacto] ?? 2
}

export interface CompromisoPuntuable {
  estado: string
  impacto: string | null
}

export interface ResultadoPonderado {
  total: number
  evaluados: number          // cumplidos + no_cumplidos
  pesoCumplido: number
  pesoEvaluado: number
  pctPonderado: number | null // null si no hay nada evaluado
  cumplidos: number
  noCumplidos: number
  reportados: number
  pendientes: number
}

/** §4DX — % de cumplimiento ponderado por impacto. */
export function calcularPonderado(compromisos: CompromisoPuntuable[]): ResultadoPonderado {
  let pesoCumplido = 0
  let pesoEvaluado = 0
  let cumplidos = 0, noCumplidos = 0, reportados = 0, pendientes = 0

  for (const c of compromisos) {
    const w = pesoDe(c.impacto)
    if (c.estado === 'cumplido') {
      pesoCumplido += w; pesoEvaluado += w; cumplidos++
    } else if (c.estado === 'no_cumplido') {
      pesoEvaluado += w; noCumplidos++
    } else if (c.estado === 'reportado') {
      reportados++
    } else if (c.estado === 'pendiente') {
      pendientes++
    }
    // 'arrastrado' no cuenta en el denominador
  }

  const pctPonderado = pesoEvaluado > 0 ? Math.round((pesoCumplido / pesoEvaluado) * 100) : null
  return {
    total: compromisos.length,
    evaluados: cumplidos + noCumplidos,
    pesoCumplido,
    pesoEvaluado,
    pctPonderado,
    cumplidos,
    noCumplidos,
    reportados,
    pendientes,
  }
}

export function colorPct(pct: number): string {
  return pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'
}

export function badgePct(pct: number): string {
  return pct >= 80 ? 'badge--success' : pct >= 50 ? 'badge--warning' : 'badge--danger'
}

/** Semana ISO + año ISO de una fecha (lunes = inicio de semana). */
export function semanaISOde(fecha: Date): { semana: number; anio: number } {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { semana, anio: d.getUTCFullYear() }
}

/** Nº de semanas ISO que tiene un año (52 o 53). */
export function numSemanasISO(anio: number): number {
  return semanaISOde(new Date(anio, 11, 28)).semana
}

/** Color del heatmap para el % de una semana (null = sin comité → neutro). */
export function colorHeatmap(pct: number | null): string {
  if (pct === null) return 'var(--border)'
  if (pct >= 80) return 'var(--success)'
  if (pct >= 50) return 'var(--warning)'
  return 'var(--danger)'
}
