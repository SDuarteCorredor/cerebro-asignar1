import type { EstadoProceso } from '@/types'

const variantes: Record<string, string> = {
  activo: 'badge--success',
  borrador: 'badge--neutral',
  desactualizado: 'badge--warning',
  en_revision: 'badge--primary',
}

const etiquetas: Record<string, string> = {
  activo: 'Activo',
  borrador: 'Borrador',
  desactualizado: 'Desactualizado',
  en_revision: 'En revisión',
}

export default function BadgeEstado({ estado }: { estado: EstadoProceso }) {
  return (
    <span className={`badge ${variantes[estado] ?? 'badge--neutral'}`}>
      {etiquetas[estado] ?? estado}
    </span>
  )
}
