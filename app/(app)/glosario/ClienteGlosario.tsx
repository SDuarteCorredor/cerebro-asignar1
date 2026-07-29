'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearTermino, actualizarTermino, eliminarTermino } from './acciones'

export interface Termino {
  id: string
  gestion_id: string | null
  gestion_nombre: string | null
  termino: string
  definicion: string
  editable: boolean
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const GENERAL = '__general__'

export default function ClienteGlosario({ terminos, puedeCrearGeneral, gestionesEditables }: {
  terminos: Termino[]
  puedeCrearGeneral: boolean
  gestionesEditables: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  // Estado del formulario (creación y edición comparten campos)
  const [fTermino, setFTermino] = useState('')
  const [fDef, setFDef] = useState('')
  const [fGestion, setFGestion] = useState<string>('')

  const puedeAportar = puedeCrearGeneral || gestionesEditables.length > 0

  const filtrados = useMemo(() => {
    const qn = norm(q.trim())
    if (!qn) return terminos
    return terminos.filter(t => norm(`${t.termino} ${t.definicion} ${t.gestion_nombre ?? ''}`).includes(qn))
  }, [terminos, q])

  // Agrupar: general primero, luego por gestión alfabético
  const grupos = useMemo(() => {
    const map = new Map<string, { titulo: string; items: Termino[] }>()
    for (const t of filtrados) {
      const clave = t.gestion_id ?? GENERAL
      const titulo = t.gestion_id ? (t.gestion_nombre ?? 'Gestión') : 'Términos generales'
      const g = map.get(clave) ?? { titulo, items: [] }
      g.items.push(t)
      map.set(clave, g)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] === GENERAL ? -1 : b[0] === GENERAL ? 1 : a[1].titulo.localeCompare(b[1].titulo))
      .map(([, g]) => ({ ...g, items: g.items.sort((x, y) => x.termino.localeCompare(y.termino)) }))
  }, [filtrados])

  function correr(fn: () => Promise<{ error?: string; ok?: boolean }>, alTerminar?: () => void) {
    setError('')
    startTransition(async () => {
      const res = await fn()
      if (res.error) { setError(res.error); return }
      alTerminar?.()
      router.refresh()
    })
  }

  function abrirCrear() {
    setFTermino(''); setFDef(''); setError('')
    setFGestion(puedeCrearGeneral ? GENERAL : (gestionesEditables[0]?.id ?? ''))
    setCreando(true); setEditId(null)
  }
  function abrirEditar(t: Termino) {
    setFTermino(t.termino); setFDef(t.definicion); setError('')
    setEditId(t.id); setCreando(false)
  }

  function guardarNuevo() {
    correr(
      () => crearTermino({ gestion_id: fGestion === GENERAL ? null : fGestion, termino: fTermino, definicion: fDef }),
      () => setCreando(false),
    )
  }

  return (
    <>
      <div className="hstack" style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="ca-input" placeholder="Buscar término o definición…" value={q}
          onChange={e => setQ(e.target.value)} style={{ minWidth: 240, flex: 1, maxWidth: 380 }} />
        <span style={{ fontSize: 12.5, color: 'var(--text-3)', alignSelf: 'center' }}>
          {filtrados.length} de {terminos.length}
        </span>
        {puedeAportar && !creando && (
          <button type="button" className="btn btn--primary btn--sm" onClick={abrirCrear} style={{ marginLeft: 'auto' }}>
            <Icono nombre="plus" className="icon icon--sm" /> Nuevo término
          </button>
        )}
      </div>

      {creando && (
        <section className="card card--padded" style={{ marginBottom: 16 }}>
          <div className="vstack" style={{ gap: 10 }}>
            {(puedeCrearGeneral || gestionesEditables.length > 1) && (
              <div className="field">
                <label className="field__label">Ámbito</label>
                <select className="ca-select ca-select--sm" value={fGestion} onChange={e => setFGestion(e.target.value)}>
                  {puedeCrearGeneral && <option value={GENERAL}>General (toda la empresa)</option>}
                  {gestionesEditables.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            )}
            <div className="field">
              <label className="field__label">Término</label>
              <input className="ca-input ca-input--sm" value={fTermino} onChange={e => setFTermino(e.target.value)}
                placeholder="Ej. Requerimiento" autoFocus />
            </div>
            <div className="field">
              <label className="field__label">Definición</label>
              <textarea className="ca-textarea" value={fDef} onChange={e => setFDef(e.target.value)}
                placeholder="Qué significa en Asignar." />
            </div>
            {error && <span style={{ fontSize: 12.5, color: 'var(--danger-ink)' }}>{error}</span>}
            <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCreando(false)} disabled={pendiente}>Cancelar</button>
              <button type="button" className="btn btn--primary btn--sm" onClick={guardarNuevo} disabled={pendiente}>
                {pendiente ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </section>
      )}

      {grupos.length === 0 ? (
        <section className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
            {q ? 'Ningún término coincide con la búsqueda.' : 'El glosario aún está vacío.'}
          </p>
        </section>
      ) : (
        <div className="vstack" style={{ gap: 20 }}>
          {grupos.map(grupo => (
            <section key={grupo.titulo} className="card card--padded">
              <div className="page__eyebrow" style={{ marginBottom: 12 }}>{grupo.titulo}</div>
              <div className="vstack" style={{ gap: 8 }}>
                {grupo.items.map(t => (
                  <div key={t.id} className="paso-card">
                    {editId === t.id ? (
                      <div className="vstack" style={{ gap: 8 }}>
                        <input className="ca-input ca-input--sm" value={fTermino} onChange={e => setFTermino(e.target.value)} />
                        <textarea className="ca-textarea" value={fDef} onChange={e => setFDef(e.target.value)} />
                        {error && <span style={{ fontSize: 12, color: 'var(--danger-ink)' }}>{error}</span>}
                        <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditId(null)} disabled={pendiente}>Cancelar</button>
                          <button type="button" className="btn btn--primary btn--sm" disabled={pendiente}
                            onClick={() => correr(() => actualizarTermino(t.id, { termino: fTermino, definicion: fDef }), () => setEditId(null))}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 14 }}>{t.termino}</strong>
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{t.definicion}</p>
                        </div>
                        {t.editable && (
                          <div className="hstack" style={{ gap: 2, flexShrink: 0 }}>
                            <button type="button" className="btn btn--ghost btn--sm" title="Editar" onClick={() => abrirEditar(t)}>
                              <Icono nombre="edit" className="icon icon--sm" />
                            </button>
                            <button type="button" className="btn btn--ghost btn--sm" title="Eliminar" disabled={pendiente}
                              onClick={() => { if (confirm(`¿Eliminar "${t.termino}"?`)) correr(() => eliminarTermino(t.id)) }}>
                              <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
