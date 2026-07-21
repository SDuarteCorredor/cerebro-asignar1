'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearItem } from './acciones'

export default function FormAgregar({ etapa, gestionId, gestiones }: {
  etapa: string
  gestionId: string | null
  gestiones: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [obligatorio, setObligatorio] = useState(true)
  const [plazo, setPlazo] = useState('7')
  const [url, setUrl] = useState('')
  // Solo el entrenamiento pide gestión, y solo cuando aún no está fijada por el grupo
  const [gestionSel, setGestionSel] = useState(gestionId ?? '')

  const pideGestion = etapa === 'entrenamiento' && gestionId === null

  function limpiar() {
    setTitulo(''); setDescripcion(''); setObligatorio(true); setPlazo('7'); setUrl('')
    setError(''); setAbierto(false)
  }

  function guardar() {
    const dias = Number(plazo)
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    if (!Number.isFinite(dias) || dias < 0) { setError('El plazo debe ser un número de días válido'); return }
    if (pideGestion && !gestionSel) { setError('Elige la gestión del entrenamiento'); return }

    setError('')
    startTransition(async () => {
      const res = await crearItem({
        etapa,
        gestion_id: etapa === 'entrenamiento' ? (gestionId ?? gestionSel) : null,
        titulo, descripcion, obligatorio, plazo_dias: dias, url_recurso: url,
      })
      if (res.error) { setError(res.error); return }
      limpiar()
      router.refresh()
    })
  }

  if (!abierto) {
    return (
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAbierto(true)}
        style={{ alignSelf: 'flex-start' }}>
        <Icono nombre="plus" className="icon icon--sm" /> Agregar ítem
      </button>
    )
  }

  return (
    <div className="paso-card">
      <div className="vstack" style={{ gap: 10 }}>
        <div className="field">
          <label className="field__label">Título</label>
          <input className="ca-input" value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Ej. Conoce el reglamento interno" autoFocus />
        </div>
        <div className="field">
          <label className="field__label">Descripción</label>
          <textarea className="ca-textarea" style={{ minHeight: 60 }}
            value={descripcion} onChange={e => setDescripcion(e.target.value)}
            placeholder="Qué debe hacer o revisar el colaborador." />
        </div>
        {pideGestion && (
          <div className="field">
            <label className="field__label">Gestión</label>
            <select className="ca-select" value={gestionSel} onChange={e => setGestionSel(e.target.value)}>
              <option value="">Seleccionar…</option>
              {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
        )}
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
          <button type="button" className="btn btn--ghost btn--sm" onClick={limpiar} disabled={pendiente}>Cancelar</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
            {pendiente ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
