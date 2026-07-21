'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { reportarItem } from './acciones'

export interface ItemAcogidaData {
  id: string
  titulo: string
  descripcion: string | null
  obligatorio: boolean
  url_recurso: string | null
  fecha_limite: string | null
  estado: string
}

function fFecha(d: string | null) {
  if (!d) return null
  const [a, m, dia] = d.split('-')
  return `${dia}/${m}/${a}`
}

export default function ItemAcogida({ item, hoy }: { item: ItemAcogidaData; hoy: string }) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')

  const aprobado = item.estado === 'aprobado'
  const marcado = item.estado === 'reportado' || aprobado
  // Solo tiene sentido avisar del vencimiento si aún no se ha hecho
  const vencido = !marcado && !!item.fecha_limite && item.fecha_limite < hoy

  function alternar() {
    if (aprobado) return
    setError('')
    startTransition(async () => {
      const res = await reportarItem(item.id, !marcado)
      if (res.error) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="paso-card" style={{
      background: aprobado ? 'var(--success-soft)' : undefined,
      borderColor: aprobado ? 'var(--success)' : vencido ? 'var(--danger)' : undefined,
    }}>
      <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
        <button
          type="button"
          onClick={alternar}
          disabled={pendiente || aprobado}
          aria-label={marcado ? 'Desmarcar' : 'Marcar como hecho'}
          title={aprobado ? 'Ya aprobado por tu responsable' : marcado ? 'Desmarcar' : 'Marcar como hecho'}
          style={{
            width: 22, height: 22, flexShrink: 0, marginTop: 2,
            borderRadius: 6,
            border: `1.5px solid var(${marcado ? '--success' : '--border-strong'})`,
            background: marcado ? 'var(--success)' : 'var(--surface)',
            display: 'grid', placeItems: 'center',
            cursor: aprobado ? 'default' : 'pointer',
            opacity: pendiente ? 0.5 : 1,
          }}
        >
          {marcado && <Icono nombre="check" className="icon icon--sm" style={{ color: '#fff', width: 14, height: 14 }} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{
              fontSize: 13.5,
              textDecoration: marcado ? 'line-through' : 'none',
              color: marcado ? 'var(--text-3)' : 'var(--text)',
            }}>
              {item.titulo}
            </strong>
            {!item.obligatorio && <span className="badge badge--neutral">Opcional</span>}
            {aprobado && <span className="badge badge--success">Aprobado</span>}
            {item.estado === 'reportado' && <span className="badge badge--warning">Esperando aprobación</span>}
            {vencido && <span className="badge badge--danger">Vencido</span>}
          </div>

          {item.descripcion && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
              {item.descripcion}
            </p>
          )}

          <div className="hstack" style={{ gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
            {item.fecha_limite && (
              <span className="text-mono" style={{
                fontSize: 11.5,
                color: vencido ? 'var(--danger-ink)' : 'var(--text-3)',
              }}>
                Antes del {fFecha(item.fecha_limite)}
              </span>
            )}
            {item.url_recurso && (
              <a href={item.url_recurso} target="_blank" rel="noopener noreferrer"
                className="hstack" style={{ gap: 4, fontSize: 11.5, color: 'var(--primary)', textDecoration: 'underline' }}>
                <Icono nombre="externalLink" className="icon icon--sm" style={{ width: 13, height: 13 }} />
                Abrir enlace
              </a>
            )}
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--danger-ink)', marginTop: 4 }}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
