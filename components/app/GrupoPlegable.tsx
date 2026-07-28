'use client'

import Icono from './Icono'

interface Props {
  titulo: string
  /** Color de la franja lateral: cualquier var() del tema. */
  color: string
  conteo: number
  abierto: boolean
  onAlternar: () => void
  onSubir?: () => void
  onBajar?: () => void
  puedeSubir?: boolean
  puedeBajar?: boolean
  /** Qué mostrar cuando el grupo está abierto pero no tiene filas. */
  vacio?: string
  children: React.ReactNode
}

/** Grupo plegable con franja de color, contador y flechas para reordenar.
 *  Cada grupo se pliega solo y el orden lo decide quien mira. */
export default function GrupoPlegable({
  titulo, color, conteo, abierto, onAlternar,
  onSubir, onBajar, puedeSubir = false, puedeBajar = false,
  vacio, children,
}: Props) {
  return (
    <section className={`grupo${abierto ? ' is-abierto' : ''}`}>
      <div className="grupo__head">
        <div className="grupo__franja" style={{ background: color }} />
        <button
          type="button"
          className="hstack"
          style={{ gap: 10, flex: 1, minWidth: 0, padding: '0 0 0 4px', textAlign: 'left' }}
          onClick={onAlternar}
          aria-expanded={abierto}
        >
          <span className="grupo__toggle">
            <Icono nombre={abierto ? 'chevronDown' : 'chevronRight'} className="icon icon--sm" />
          </span>
          <span className="grupo__titulo">{titulo}</span>
          <span className="grupo__conteo">{conteo}</span>
        </button>
        {(onSubir || onBajar) && (
          <div className="grupo__acciones">
            <button
              type="button" className="grupo__mover" onClick={onSubir}
              disabled={!puedeSubir} aria-label={`Subir el grupo ${titulo}`} title="Subir"
            >
              <Icono nombre="arrowUp" className="icon icon--sm" />
            </button>
            <button
              type="button" className="grupo__mover" onClick={onBajar}
              disabled={!puedeBajar} aria-label={`Bajar el grupo ${titulo}`} title="Bajar"
            >
              <Icono nombre="arrowDown" className="icon icon--sm" />
            </button>
          </div>
        )}
      </div>
      {abierto && (
        <div className="grupo__cuerpo">
          {conteo === 0 && vacio
            ? <p className="grupo__vacio">{vacio}</p>
            : children}
        </div>
      )}
    </section>
  )
}
