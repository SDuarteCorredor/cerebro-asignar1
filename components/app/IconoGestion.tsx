import Icono from './Icono'
import type { Gestion } from '@/types'

interface IconoGestionProps {
  gestion: Pick<Gestion, 'icono' | 'color_soft' | 'color_primary'>
  size?: number
  rounded?: number
}

/** Los colores vienen de `gestiones.color_soft` / `color_primary` y son tintes
 *  muy pálidos. El anillo del propio color y un trazo algo más grueso le dan
 *  peso al recuadro sin tocar los valores guardados en la base de datos. */
export default function IconoGestion({ gestion, size = 38, rounded = 10 }: IconoGestionProps) {
  const esHex = /^#[0-9a-f]{6}$/i.test(gestion.color_primary ?? '')

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: gestion.color_soft,
        color: gestion.color_primary,
        boxShadow: esHex ? `inset 0 0 0 1px ${gestion.color_primary}29` : undefined,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Icono
        nombre={gestion.icono}
        style={{ width: size * 0.5, height: size * 0.5, strokeWidth: 1.75 }}
      />
    </div>
  )
}
