'use client'

import { useState } from 'react'
import Icono from '@/components/app/Icono'

export type PasoDetalle = {
  id: string
  numero_orden: number
  nombre: string | null
  descripcion: string
  cargo_responsable: string
  entradas: string | null
  periodicidad: string | null
  salidas: string | null
  acuerdo_servicio: string | null
  tiempos: string | null
}

function FilaInfo({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>
        {label}
      </span>
      <span style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{valor}</span>
    </div>
  )
}

export default function PasoExpandible({ paso, index, total }: { paso: PasoDetalle; index: number; total: number }) {
  const [abierto, setAbierto] = useState(false)
  const tieneDetalle = paso.entradas || paso.periodicidad || paso.salidas || paso.acuerdo_servicio || paso.tiempos

  return (
    <li style={{
      borderBottom: index < total - 1 ? '1px solid var(--divider)' : 'none',
      transition: 'background 120ms',
    }}>
      {/* Fila principal (siempre visible) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr auto',
          gap: 16,
          padding: '14px 0',
          alignItems: 'center',
          cursor: tieneDetalle ? 'pointer' : 'default',
        }}
        onClick={() => tieneDetalle && setAbierto(v => !v)}
      >
        {/* Número */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'var(--primary-soft)', color: 'var(--primary-ink)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>
            {String(paso.numero_orden).padStart(2, '0')}
          </div>
        </div>

        {/* Título + metadata */}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>
            {paso.nombre || paso.descripcion}
          </p>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {paso.cargo_responsable && (
              <span className="badge badge--neutral badge--no-dot badge--wrap" style={{ fontSize: 12 }}>
                <Icono nombre="users" className="icon icon--sm" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{paso.cargo_responsable}</span>
              </span>
            )}
            {paso.periodicidad && (
              <span className="badge badge--neutral badge--no-dot" style={{ fontSize: 12, background: 'var(--surface-2)' }}>
                <Icono nombre="history" className="icon icon--sm" /> {paso.periodicidad}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        {tieneDetalle && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: abierto ? 'var(--primary-soft)' : 'var(--surface-2)',
            display: 'grid', placeItems: 'center',
            transition: 'background 150ms, transform 150ms',
            transform: abierto ? 'rotate(180deg)' : 'none',
            flexShrink: 0,
          }}>
            <Icono nombre="chevronDown" className="icon icon--sm" style={{ color: abierto ? 'var(--primary)' : 'var(--text-3)' }} />
          </div>
        )}
      </div>

      {/* Detalle expandido */}
      {abierto && tieneDetalle && (
        <div style={{
          marginLeft: 60,
          marginBottom: 16,
          padding: '16px 18px',
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px 24px',
        }}>
          {/* Descripción ocupa columna completa */}
          {paso.nombre && paso.descripcion && (
            <div style={{ gridColumn: '1 / -1' }}>
              <FilaInfo label="Procedimiento" valor={paso.descripcion} />
            </div>
          )}
          <FilaInfo label="Entradas" valor={paso.entradas} />
          <FilaInfo label="Salidas" valor={paso.salidas} />
          <FilaInfo label="Acuerdo de servicio" valor={paso.acuerdo_servicio} />
          <FilaInfo label="Tiempos" valor={paso.tiempos} />
        </div>
      )}
    </li>
  )
}
