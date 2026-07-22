'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { inscribirParticipantes, quitarParticipante, marcarAsistencia } from '../acciones'

interface Persona { id: string; nombre: string; codigo_contrato: string | null }
export interface ParticipanteData {
  usuario_id: string
  asistio: boolean
  nombre: string
  codigo_contrato: string | null
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function PanelParticipantes({ sesionId, participantes, candidatos }: {
  sesionId: string
  participantes: ParticipanteData[]
  candidatos: Persona[]
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())

  const yaInscritos = useMemo(() => new Set(participantes.map(p => p.usuario_id)), [participantes])

  const disponibles = useMemo(() => {
    const qn = norm(q.trim())
    return candidatos
      .filter(c => !yaInscritos.has(c.id))
      .filter(c => !qn || norm(`${c.nombre} ${c.codigo_contrato ?? ''}`).includes(qn))
      .slice(0, 40)
  }, [candidatos, yaInscritos, q])

  function correr(fn: () => Promise<{ error?: string; ok?: boolean }>, alTerminar?: () => void) {
    setError('')
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      alTerminar?.()
      router.refresh()
    })
  }

  const asistieron = participantes.filter(p => p.asistio).length

  return (
    <section className="card card--padded">
      <div className="hstack" style={{ justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div>
          <div className="page__eyebrow" style={{ marginBottom: 4 }}>Participantes</div>
          <h2 className="section-title" style={{ margin: 0 }}>
            {participantes.length} inscrito{participantes.length === 1 ? '' : 's'}
            {participantes.length > 0 && (
              <span className="text-mono" style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400 }}>
                {' '}· {asistieron} asistieron
              </span>
            )}
          </h2>
        </div>
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setBuscando(b => !b)}>
          <Icono nombre="plus" className="icon icon--sm" /> Inscribir personas
        </button>
      </div>

      {buscando && (
        <div className="paso-card" style={{ marginTop: 12 }}>
          <input className="ca-input" placeholder="Buscar por nombre o código…"
            value={q} onChange={e => setQ(e.target.value)} autoFocus style={{ marginBottom: 10 }} />
          <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {disponibles.length === 0 && (
              <span style={{ fontSize: 12.5, color: 'var(--text-3)', padding: 6 }}>
                {q ? 'Nadie coincide con la búsqueda.' : 'Todas las personas activas ya están inscritas.'}
              </span>
            )}
            {disponibles.map(c => (
              <label key={c.id} className="hstack" style={{
                gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                background: sel.has(c.id) ? 'var(--primary-soft)' : 'transparent',
              }}>
                <input type="checkbox" checked={sel.has(c.id)} onChange={e => {
                  const s = new Set(sel)
                  if (e.target.checked) s.add(c.id); else s.delete(c.id)
                  setSel(s)
                }} />
                <span style={{ fontSize: 13 }}>{c.nombre}</span>
                {c.codigo_contrato && (
                  <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    {c.codigo_contrato}
                  </span>
                )}
              </label>
            ))}
          </div>
          <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn btn--ghost btn--sm"
              onClick={() => { setBuscando(false); setSel(new Set()); setQ('') }} disabled={pendiente}>
              Cancelar
            </button>
            <button type="button" className="btn btn--primary btn--sm" disabled={pendiente || sel.size === 0}
              onClick={() => correr(
                () => inscribirParticipantes(sesionId, [...sel]),
                () => { setSel(new Set()); setBuscando(false); setQ('') },
              )}>
              {pendiente ? 'Inscribiendo…' : `Inscribir ${sel.size > 0 ? `(${sel.size})` : ''}`}
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 12.5, color: 'var(--danger-ink)', marginTop: 10 }}>{error}</div>}

      {participantes.length > 0 && (
        <div className="vstack" style={{ gap: 6, marginTop: 14 }}>
          {participantes.map(p => (
            <div key={p.usuario_id} className="hstack" style={{
              gap: 10, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
            }}>
              <button type="button" title={p.asistio ? 'Marcar como ausente' : 'Marcar asistencia'}
                disabled={pendiente}
                onClick={() => correr(() => marcarAsistencia(sesionId, p.usuario_id, !p.asistio))}
                style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                  border: `1.5px solid var(${p.asistio ? '--success' : '--border-strong'})`,
                  background: p.asistio ? 'var(--success)' : 'var(--surface)',
                  display: 'grid', placeItems: 'center',
                }}>
                {p.asistio && <Icono nombre="check" className="icon icon--sm" style={{ color: '#fff', width: 13, height: 13 }} />}
              </button>
              <span style={{ fontSize: 13, flex: 1, minWidth: 0 }}>{p.nombre}</span>
              {p.codigo_contrato && (
                <span className="text-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.codigo_contrato}</span>
              )}
              <button type="button" className="btn btn--ghost btn--sm" title="Quitar de la jornada" disabled={pendiente}
                onClick={() => correr(() => quitarParticipante(sesionId, p.usuario_id))}>
                <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
