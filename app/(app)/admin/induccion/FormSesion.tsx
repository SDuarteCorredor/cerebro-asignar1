'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearSesion } from './acciones'

export default function FormSesion() {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('08:00')
  const [modalidad, setModalidad] = useState('virtual')
  const [ciudad, setCiudad] = useState('')
  const [enlace, setEnlace] = useState('')

  function guardar() {
    if (!titulo.trim()) { setError('El título es obligatorio'); return }
    if (!fecha) { setError('Elige la fecha de la jornada'); return }
    setError('')
    startTransition(async () => {
      const res = await crearSesion({
        titulo, fecha, hora_inicio: hora, modalidad,
        ciudad, enlace_reunion: enlace,
      })
      if (res.error) { setError(res.error); return }
      setAbierto(false)
      setTitulo(''); setFecha(''); setCiudad(''); setEnlace('')
      if (res.id) router.push(`/admin/induccion/${res.id}`)
      else router.refresh()
    })
  }

  if (!abierto) {
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setAbierto(true)}>
        <Icono nombre="plus" className="icon icon--sm" /> Nueva jornada
      </button>
    )
  }

  return (
    <section className="card card--padded" style={{ marginBottom: 18 }}>
      <h2 className="section-title" style={{ marginTop: 0, marginBottom: 14 }}>Nueva jornada de inducción</h2>
      <div className="vstack" style={{ gap: 12 }}>
        <div className="field">
          <label className="field__label">Título</label>
          <input className="ca-input" value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Ej. Acogida laboral — julio 2026" autoFocus />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div className="field">
            <label className="field__label">Fecha</label>
            <input type="date" className="ca-input" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Hora de inicio</label>
            <input type="time" className="ca-input" value={hora} onChange={e => setHora(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Modalidad</label>
            <select className="ca-select" value={modalidad} onChange={e => setModalidad(e.target.value)}>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label">Ciudad</label>
            <input className="ca-input" value={ciudad} onChange={e => setCiudad(e.target.value)}
              placeholder="Ej. Bogotá" />
          </div>
        </div>
        <div className="field">
          <label className="field__label">Enlace de la reunión (si es virtual)</label>
          <input className="ca-input" value={enlace} onChange={e => setEnlace(e.target.value)}
            placeholder="https://meet.google.com/…" />
        </div>
        {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}
        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)} disabled={pendiente}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
            {pendiente ? 'Creando…' : 'Crear jornada'}
          </button>
        </div>
      </div>
    </section>
  )
}
