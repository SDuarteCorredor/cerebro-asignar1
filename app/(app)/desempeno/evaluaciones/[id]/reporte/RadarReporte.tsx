'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface DatoRadar {
  competencia: string
  nombre: string
  actual: number
  esperado: number
}

export default function RadarReporte({ data }: { data: DatoRadar[] }) {
  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <RadarChart data={data} margin={{ top: 12, right: 30, bottom: 12, left: 30 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
          <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
          <Radar name="Esperado" dataKey="esperado" stroke="var(--success)" fill="var(--success)" fillOpacity={0.18} />
          <Radar name="Actual" dataKey="actual" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v ?? '—'))}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
