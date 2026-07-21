'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { actualizarItem, alternarActivo, eliminarItem, moverItem } from './acciones'

export interface ItemPlantilla {
  id: string
  etapa: string
  gestion_id: string | null
  orden: number
  titulo: string
  descripcion: string | null
  obligatorio: boolean
  plazo_dias: number
  url_recurso: string | null
  activo: boolean
}

export default function FilaItem({ item, esPrimero, esUltimo }: {
  item: ItemPlantilla
  esPrimero: boolean
  esUltimo: boolean
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState(item.titulo)
  const [descripcion, setDescripcion] = useState(item.descripcion ?? '')
  const [obligatorio, setObligatorio] = useState(item.obligatorio)
  const [plazo, setPlazo] = useState(String(item.plazo_dias))
  const [url, setUrl] = useState(item.url_recurso ?? '')

  function correr(fn: () => Promise<{ error?: string; ok?: boolean }>, alTerminar?: () => void) {
    setError('')
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      alTerminar?.()
      router.refresh()
    })
  }

  function guardar() {
    const dias = Number(plazo)
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    if (!Number.isFinite(dias) || dias < 0) { setError('El plazo debe ser un número de días válido'); return }
    correr(
      () => actualizarItem(item.id, { titulo, descripcion, obligatorio, plazo_dias: dias, url_recurso: url }),
      () => setEditando(false),
    )
  }

  function cancelar() {
    setTitulo(item.titulo)
    setDescripcion(item.descripcion ?? '')
    setObligatorio(item.obligatorio)
    setPlazo(String(item.plazo_dias))
    setUrl(item.url_recurso ?? '')
    setError('')
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="paso-card">
        <div className="vstack" style={{ gap: 10 }}>
          <div className="field">
            <label className="field__label">Título</label>
            <input className="ca-input" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Descripción</label>
            <textarea className="ca-textarea" style={{ minHeight: 60 }}
              value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <div className="field">
              <label className="field__label">Plazo (días)</label>
              <input className="ca-input ca-input--sm" type="number" min={0}
                value={plazo} onChange={e => setPlazo(e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label">Enlace (opcional)</label>
              <input className="ca-input ca-input--sm" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://…" />
            </div>
            <label className="hstack" style={{ gap: 8, alignItems: 'center', fontSize: 13, paddingTop: 18 }}>
              <input type="checkbox" checked={obligatorio} onChange={e => setObligatorio(e.target.checked)} />
              Obligatorio
            </label>
          </div>
          {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}
          <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn--ghost btn--sm" onClick={cancelar} disabled={pendiente}>Cancelar</button>
            <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
              {pendiente ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="paso-card" style={{ opacity: item.activo ? 1 : 0.55 }}>
      <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="paso-num">{String(item.orden).padStart(2, '0')}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: 13.5 }}>{item.titulo}</strong>
            {!item.obligatorio && <span className="badge badge--neutral">Opcional</span>}
            {!item.activo && <span className="badge badge--warning">Inactivo</span>}
            <span className="text-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              {item.plazo_dias === 0 ? 'mismo día' : `${item.plazo_dias} d`}
            </span>
          </div>
          {item.descripcion && (
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
              {item.descripcion}
            </p>
          )}
          {item.url_recurso && (
            <a href={item.url_recurso} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11.5, color: 'var(--primary)', textDecoration: 'underline' }}>
              {item.url_recurso}
            </a>
          )}
          {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 4 }}>{error}</div>}
        </div>

        <div className="hstack" style={{ gap: 2, flexShrink: 0 }}>
          <button type="button" className="btn btn--ghost btn--sm" title="Subir" disabled={pendiente || esPrimero}
            onClick={() => correr(() => moverItem(item.id, 'arriba'))}>
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(-90deg)' }} />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" title="Bajar" disabled={pendiente || esUltimo}
            onClick={() => correr(() => moverItem(item.id, 'abajo'))}>
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(90deg)' }} />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" title="Editar" disabled={pendiente}
            onClick={() => setEditando(true)}>
            <Icono nombre="edit" className="icon icon--sm" />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" disabled={pendiente}
            title={item.activo ? 'Desactivar' : 'Activar'}
            onClick={() => correr(() => alternarActivo(item.id, !item.activo))}>
            <Icono nombre={item.activo ? 'eye' : 'eyeOff'} className="icon icon--sm" />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" title="Eliminar" disabled={pendiente}
            onClick={() => {
              if (!confirm(`¿Eliminar "${item.titulo}"? Esta acción no se puede deshacer.`)) return
              correr(() => eliminarItem(item.id))
            }}>
            <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
