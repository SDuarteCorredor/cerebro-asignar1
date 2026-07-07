import { colorHeatmap } from '@/lib/comites/puntaje'

export interface CeldaSemana {
  semana: number
  pct: number | null   // null = sin comité esa semana
  cumplidos: number
  total: number
}

export default function HeatmapSemanal({
  titulo, celdas, semanaActual,
}: {
  titulo: string
  celdas: CeldaSemana[]
  semanaActual: number | null
}) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div className="page__eyebrow" style={{ margin: 0 }}>{titulo}</div>
        <div className="hstack" style={{ gap: 6, fontSize: 11, color: 'var(--text-3)', alignItems: 'center' }}>
          <span>Menos</span>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--border)' }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--danger)' }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--warning)' }} />
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)' }} />
          <span>Más</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {celdas.map(c => {
          const esActual = c.semana === semanaActual
          const tip = c.pct === null
            ? `Semana ${c.semana}: sin comité`
            : `Semana ${c.semana}: ${c.pct}% (${c.cumplidos}/${c.total})`
          return (
            <div
              key={c.semana}
              title={tip}
              style={{
                width: 16, height: 16, borderRadius: 3,
                background: colorHeatmap(c.pct),
                border: esActual ? '2px solid var(--primary)' : '1px solid var(--surface)',
                boxSizing: 'border-box',
              }}
            />
          )
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
        Cada celda es una semana. Verde ≥80%, amarillo 50-79%, rojo &lt;50%, gris sin comité.
      </div>
    </div>
  )
}
