/** Suma meses a una fecha ISO 'YYYY-MM-DD' y devuelve otra fecha ISO. 0 = no vence (null). */
export function fechaVencimiento(fechaRealizada: string, vigenciaMeses: number): string | null {
  if (!vigenciaMeses || vigenciaMeses <= 0) return null
  const [a, m, d] = fechaRealizada.split('-').map(Number)
  const base = new Date(Date.UTC(a, (m ?? 1) - 1, d ?? 1))
  base.setUTCMonth(base.getUTCMonth() + vigenciaMeses)
  return base.toISOString().slice(0, 10)
}

export function fFechaCorta(d?: string | null): string {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return a && m && dia ? `${dia}/${m}/${a}` : d
}
