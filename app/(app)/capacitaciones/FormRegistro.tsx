'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'
import { registrarCapacitacion } from './acciones'

const BUCKET = 'certificados-capacitacion'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function FormRegistro({ capacitaciones, personas }: {
  capacitaciones: { id: string; nombre: string }[]
  personas: { id: string; nombre: string; codigo_contrato: string | null }[]
}) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [pendiente, startTransition] = useTransition()
  const [abierto, setAbierto] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const [capId, setCapId] = useState('')
  const [buscaPersona, setBuscaPersona] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [fecha, setFecha] = useState('')
  const [horas, setHoras] = useState('')
  const [nota, setNota] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const personasFiltradas = useMemo(() => {
    const q = norm(buscaPersona.trim())
    return personas.filter(p => !q || norm(`${p.nombre} ${p.codigo_contrato ?? ''}`).includes(q)).slice(0, 30)
  }, [personas, buscaPersona])

  function limpiar() {
    setCapId(''); setUsuarioId(''); setBuscaPersona(''); setFecha(''); setHoras(''); setNota(''); setArchivo(null)
    setError(''); setAbierto(false)
  }

  function guardar() {
    if (!capId) { setError('Elige la capacitación'); return }
    if (!usuarioId) { setError('Elige la persona'); return }
    if (!fecha) { setError('Indica la fecha en que se realizó'); return }

    setError('')
    startTransition(async () => {
      let certPath: string | null = null
      if (archivo) {
        setSubiendo(true)
        const ruta = `${usuarioId}/${Date.now()}-${archivo.name.replace(/[^\w.\-]/g, '_')}`
        const { error: errSub } = await supabase.storage.from(BUCKET).upload(ruta, archivo)
        setSubiendo(false)
        if (errSub) { setError(errSub.message); return }
        certPath = ruta
      }
      const res = await registrarCapacitacion({
        capacitacion_id: capId, usuario_id: usuarioId, fecha_realizada: fecha,
        horas, certificado_path: certPath, nota,
      })
      if (res.error) { setError(res.error); return }
      limpiar()
      router.refresh()
    })
  }

  if (!abierto) {
    return (
      <button type="button" className="btn btn--primary btn--sm" onClick={() => setAbierto(true)}>
        <Icono nombre="plus" className="icon icon--sm" /> Registrar capacitación
      </button>
    )
  }

  return (
    <section className="card card--padded" style={{ marginBottom: 18 }}>
      <h2 className="section-title" style={{ marginTop: 0, marginBottom: 14 }}>Registrar capacitación realizada</h2>
      <div className="vstack" style={{ gap: 12 }}>
        <div className="field">
          <label className="field__label">Capacitación</label>
          <select className="ca-select ca-select--sm" value={capId} onChange={e => setCapId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {capacitaciones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="field__label">Persona</label>
          {usuarioId ? (
            <div className="hstack" style={{ gap: 8 }}>
              <span className="badge badge--primary">{personas.find(p => p.id === usuarioId)?.nombre}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setUsuarioId(''); setBuscaPersona('') }}>Cambiar</button>
            </div>
          ) : (
            <>
              <input className="ca-input ca-input--sm" placeholder="Buscar por nombre o código…"
                value={buscaPersona} onChange={e => setBuscaPersona(e.target.value)} />
              {buscaPersona && (
                <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {personasFiltradas.map(p => (
                    <button key={p.id} type="button" className="nav-item" style={{ textAlign: 'left', fontSize: 12.5 }}
                      onClick={() => { setUsuarioId(p.id); setBuscaPersona('') }}>
                      <span style={{ flex: 1 }}>{p.nombre}</span>
                      {p.codigo_contrato && <span className="text-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.codigo_contrato}</span>}
                    </button>
                  ))}
                  {personasFiltradas.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)', padding: 6 }}>Sin coincidencias.</span>}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          <div className="field">
            <label className="field__label">Fecha realizada</label>
            <input type="date" className="ca-input ca-input--sm" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label">Horas (opcional)</label>
            <input type="number" min={0} className="ca-input ca-input--sm" value={horas} onChange={e => setHoras(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field__label">Certificado (opcional, PDF o imagen)</label>
          <input type="file" accept=".pdf,image/*" onChange={e => setArchivo(e.target.files?.[0] ?? null)} style={{ fontSize: 12.5 }} />
        </div>

        <div className="field">
          <label className="field__label">Nota (opcional)</label>
          <input className="ca-input ca-input--sm" value={nota} onChange={e => setNota(e.target.value)} />
        </div>

        {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}
        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={limpiar} disabled={pendiente}>Cancelar</button>
          <button type="button" className="btn btn--primary btn--sm" onClick={guardar} disabled={pendiente}>
            {subiendo ? 'Subiendo…' : pendiente ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </section>
  )
}
