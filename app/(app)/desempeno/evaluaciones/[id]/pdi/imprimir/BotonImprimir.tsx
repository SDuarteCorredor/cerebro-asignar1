'use client'

import Icono from '@/components/app/Icono'

export default function BotonImprimir() {
  return (
    <button className="btn btn--primary btn--sm" onClick={() => window.print()}>
      <Icono nombre="download" className="icon icon--sm" /> Descargar PDF
    </button>
  )
}
