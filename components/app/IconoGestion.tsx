import Icono from './Icono'
import type { Gestion } from '@/types'

interface IconoGestionProps {
  gestion: Pick<Gestion, 'icono' | 'color_soft' | 'color_primary'>
  size?: number
  rounded?: number
}

export default function IconoGestion({ gestion, size = 38, rounded = 10 }: IconoGestionProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: gestion.color_soft,
        color: gestion.color_primary,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Icono nombre={gestion.icono} style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  )
}
