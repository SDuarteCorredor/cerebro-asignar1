'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { guardarCapacitacion } from '@/app/(app)/capacitaciones/acciones'

export interface CapCatalogo {
  id: string
  nombre: string
  descripcion: string | null
  tipo: string
  certifica: boolean
  vigencia_meses: number
  activa: boolean
  registros: number
}

export default function FilaCatalogo({ cap }: { cap: CapCatalogo | null }) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [editando, setEditando] = useState(cap === null)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState(cap?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(cap?.descripcion ?? '')
  const [tipo, setTipo] = useState(cap?.tipo ?? 'interna')
  const [certifica, setCertifica] = useState(cap?.certifica ?? true)
  const [vigencia, setVigencia] = useState(String(cap?.vigencia_meses ?? 0))
  const [activa, setActiva] = useState(cap?.activa ?? true)

  function guardar() {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    const meses = Number(vigencia)
    if (!Number.isFinite(meses) || meses < 0) { setError('La vigencia debe ser un número de meses'); return }
    setError('')
    startTransition(async () => {
      const res = await guardarCapacitacion({
        id: cap?.id, nombre, descripcion, tipo, certifica, vigencia_meses: meses, activa,
      })
      if (res.error) { setError(res.error); return }
      if (!cap) { setNombre(''); setDescripcion(''); setVigencia('0') }
      setEditando(cap === null ? true : false)
      router.refresh()
    })
  }

  if (!editando && cap) {
    return (
      <div className="paso-card" style={{ opacity: cap.activa ? 1 : 0.6 }}>
        <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <strong style={{ fontSize: 13.5 }}>{cap.nombre}</strong>
              <span className="badge badge--neutral">{cap.tipo === 'externa' ? 'Externa' : 'Interna'}</span>
              {cap.certifica && <span className="badge badge--success">Certifica</span>}
              <span className="text-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                {cap.vigencia_meses > 0 ? `vence a ${cap.vigencia_meses} meses` : 'no vence'}
              </span>
              {!cap.activa && <span className="badge badge--warning">Inactiva</span>}
            </div>
            {cap.descripcion && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-2)' }}>{cap.descripcion}</p>}
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{cap.registros} registro(s)</div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditando(true)}>
            <Icono nombre="edit" className="icon icon--sm" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="paso-card">
      <div className="vstack" style={{ gap: 10 }}>
        <div className="field">
          <label className="field__label">Nombre</label>
          <input className="ca-input ca-input--sm" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Ej. Trabajo en alturas" autoFocus />
        </div>
        <div className="field">
          <label className="field__label">Descripción</label>
          <textarea className="ca-textarea" style={{ minHeight: 44 }} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          <div className="field">
            <label className="field__label">Tipo</label>
            <select className="ca-select ca-select--sm" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="interna">Interna</option>
              <option value="externa">Externa</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Vigencia (meses)</label>
            <input className="ca-input ca-input--sm" type="number" min={0} value={vigencia}
              onChange={e => setVigencia(e.target.value)} />
            <span className="field__hint">0 = no vence</span>
          </div>
          <label className="hstack" style={{ gap: 8, fontSize: 13, alignItems: 'center', paddingTop: 18 }}>
            <input type="checkbox" checked={certifica} onChange={e => setCertifica(e.target.checked)} /> Certifica
          </label>
          <label className="hstack" style={{ gap: 8, fontSize: 13, alignItems: 'center', paddingTop: 18 }}>
            <input type="checkbox" checked={activa} onChange={e => setActiva(e.target.checked)} /> Activa
          </label>
        </div>
        {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}
        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
          {cap && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditando(false)} disabled={pendiente}>Cancelar</button>}
          <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
            {pendiente ? 'Guardando…' : cap ? 'Guardar' : 'Agregar capacitación'}
          </button>
        </div>
      </div>
    </div>
  )
}
