'use client'

import Icono from './Icono'
import { usePreferenciaLocal } from '@/lib/usePreferenciaLocal'

export type Vista = 'tarjetas' | 'lista'

const esVista = (v: unknown): v is Vista => v === 'tarjetas' || v === 'lista'

/** Recuerda por usuario si prefiere ver la sección en tarjetas o en lista.
 *  Cada pantalla usa su propia llave: la preferencia en Gestiones no arrastra
 *  la de Políticas, igual que en Notion cada base tiene su vista. */
export function useVista(llave: string, porDefecto: Vista = 'tarjetas') {
  return usePreferenciaLocal<Vista>(llave, porDefecto, esVista)
}

interface SelectorVistaProps {
  vista: Vista
  onCambio: (vista: Vista) => void
}

export default function SelectorVista({ vista, onCambio }: SelectorVistaProps) {
  return (
    <div className="filter-pills selector-vista" role="group" aria-label="Forma de ver la lista">
      <button
        type="button"
        className={`filter-pill ${vista === 'tarjetas' ? 'is-active' : ''}`}
        aria-pressed={vista === 'tarjetas'}
        onClick={() => onCambio('tarjetas')}
      >
        <Icono nombre="grid" className="icon icon--sm" />
        <span className="selector-vista__texto">Tarjetas</span>
      </button>
      <button
        type="button"
        className={`filter-pill ${vista === 'lista' ? 'is-active' : ''}`}
        aria-pressed={vista === 'lista'}
        onClick={() => onCambio('lista')}
      >
        <Icono nombre="list" className="icon icon--sm" />
        <span className="selector-vista__texto">Lista</span>
      </button>
    </div>
  )
}
