/**
 * Vigencia documental: se calcula desde `procesos.fecha_proxima_revision`.
 *
 * No se toca `procesos.estado`: un documento en estado `desactualizado` deja de ser
 * visible para los colaboradores (ver el control de acceso de /procesos/[id]), así que
 * marcar el vencimiento sobre el estado escondería procedimientos vencidos de toda la
 * empresa. La vigencia es un eje aparte del ciclo de aprobación.
 */

export type Vigencia = 'sin_fecha' | 'vencido' | 'por_vencer' | 'vigente'

/** Días de antelación con los que se empieza a avisar que un documento va a vencer. */
export const DIAS_AVISO = 30

/** Fecha de hoy en Colombia. El servidor (Vercel) corre en UTC, así que no sirve toISOString(). */
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

function aUTC(iso: string): number {
  const [a, m, d] = iso.split('-').map(Number)
  return Date.UTC(a, (m ?? 1) - 1, d ?? 1)
}

/** Días desde hoy hasta `fecha` (negativo = ya pasó). */
export function diasHasta(fecha: string, hoy: string = hoyISO()): number {
  return Math.round((aUTC(fecha) - aUTC(hoy)) / 86400000)
}

export interface EstadoVigencia {
  vigencia: Vigencia
  /** Días que faltan (o que ya pasaron, en negativo). null si no hay fecha. */
  dias: number | null
}

export function calcularVigencia(
  fechaProximaRevision: string | null | undefined,
  hoy: string = hoyISO(),
): EstadoVigencia {
  if (!fechaProximaRevision) return { vigencia: 'sin_fecha', dias: null }
  const dias = diasHasta(fechaProximaRevision, hoy)
  if (dias < 0) return { vigencia: 'vencido', dias }
  if (dias <= DIAS_AVISO) return { vigencia: 'por_vencer', dias }
  return { vigencia: 'vigente', dias }
}

export const etiquetaVigencia: Record<Vigencia, string> = {
  vencido: 'Vencido',
  por_vencer: 'Por vencer',
  vigente: 'Vigente',
  sin_fecha: 'Sin fecha de revisión',
}

/** Clase de badge del design system para cada vigencia. */
export const badgeVigencia: Record<Vigencia, string> = {
  vencido: 'badge--danger',
  por_vencer: 'badge--warning',
  vigente: 'badge--success',
  sin_fecha: 'badge--neutral',
}

/** Orden de urgencia para listar: primero lo que hay que atender. */
export const ordenVigencia: Record<Vigencia, number> = {
  vencido: 0,
  por_vencer: 1,
  sin_fecha: 2,
  vigente: 3,
}

/** Texto corto para mostrar junto a la fecha. */
export function textoVigencia(e: EstadoVigencia): string {
  if (e.vigencia === 'sin_fecha' || e.dias === null) return 'Sin fecha de revisión definida'
  if (e.dias < 0) {
    const d = Math.abs(e.dias)
    return `Venció hace ${d} ${d === 1 ? 'día' : 'días'}`
  }
  if (e.dias === 0) return 'Vence hoy'
  return `Vence en ${e.dias} ${e.dias === 1 ? 'día' : 'días'}`
}
