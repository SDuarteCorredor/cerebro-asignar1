'use client'

import dynamic from 'next/dynamic'

const RadarReporte = dynamic(() => import('./RadarReporte'), {
  loading: () => <div style={{ width: '100%', height: 360, display: 'grid', placeItems: 'center', color: 'var(--text-3)', fontSize: 13 }}>Cargando gráfico…</div>,
  ssr: false,
})

interface DatoRadar {
  competencia: string
  nombre: string
  actual: number
  esperado: number
}

export default function RadarReporteLazy({ data }: { data: DatoRadar[] }) {
  return <RadarReporte data={data} />
}
