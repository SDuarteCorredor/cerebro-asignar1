'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Aprobacion {
  id: string
  nombre: string
  objetivo: string
  version: string
  created_at: string
  gestion: { id: string; nombre: string } | null
  creado_por_usuario: { id: string; nombre: string } | null
}

export default function ClienteAprobaciones({ aprobaciones: inicial, adminId }: { aprobaciones: Aprobacion[]; adminId: string }) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [items, setItems] = useState(inicial)
  const [rechazando, setRechazando] = useState<Aprobacion | null>(null)
  const [comentario, setComentario] = useState('')
  const [procesando, setProcesando] = useState('')
  const [ahora] = useState(() => Date.now())

  async function aprobar(id: string) {
    setProcesando(id)
    const { error } = await supabase
      .from('procesos')
      .update({
        estado: 'activo',
        aprobado_por: adminId,
        fecha_actualizacion: new Date().toISOString().split('T')[0],
      })
      .eq('id', id)

    if (!error) {
      setItems(items.filter(i => i.id !== id))
      router.refresh()
    }
    setProcesando('')
  }

  async function rechazar(id: string) {
    setProcesando(id)
    const { error } = await supabase
      .from('procesos')
      .update({ estado: 'borrador', comentario_rechazo: comentario })
      .eq('id', id)

    if (!error) {
      setItems(items.filter(i => i.id !== id))
      setRechazando(null)
      setComentario('')
      router.refresh()
    }
    setProcesando('')
  }

  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Bandeja al día</h3>
        <p style={{ color: 'var(--text-3)', margin: 0 }}>No hay procesos pendientes de aprobación.</p>
      </div>
    )
  }

  return (
    <>
      <div className="filter-row">
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{items.length} procesos esperando tu revisión.</span>
      </div>

      <div className="vstack" style={{ gap: 12 }}>
        {items.map(a => {
          const diasEspera = Math.floor((ahora - new Date(a.created_at).getTime()) / 86400000)
          return (
            <div key={a.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'flex-start' }}>
                <div>
                  <div className="hstack" style={{ gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-3)' }}>
                    <span className="badge badge--primary">En revisión</span>
                    <span>{a.gestion?.nombre}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{new Date(a.created_at).toLocaleDateString('es-CO')}</span>
                    {diasEspera > 0 && (
                      <>
                        <span>·</span>
                        <span>esperando hace <strong style={{ color: 'var(--warning-ink)' }}>{diasEspera}d</strong></span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{a.nombre}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 10 }}>{a.objetivo}</div>
                  {a.creado_por_usuario && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                      Enviado por <strong style={{ color: 'var(--text-2)' }}>{a.creado_por_usuario.nombre}</strong>
                    </div>
                  )}
                </div>
                <div className="hstack" style={{ gap: 8 }}>
                  <Link href={`/procesos/${a.id}`} className="btn btn--ghost btn--sm">
                    <Icono nombre="eye" className="icon icon--sm" /> Ver
                  </Link>
                  <button className="btn btn--secondary btn--sm" onClick={() => setRechazando(a)} disabled={procesando === a.id}>
                    <Icono nombre="x" className="icon icon--sm" /> Rechazar
                  </button>
                  <button className="btn btn--primary btn--sm" onClick={() => aprobar(a.id)} disabled={procesando === a.id}>
                    <Icono nombre="check" className="icon icon--sm" />
                    {procesando === a.id ? 'Aprobando…' : 'Aprobar'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal rechazo */}
      {rechazando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center' }}>
          <div onClick={() => setRechazando(null)} style={{ position: 'absolute', inset: 0, background: 'var(--overlay)' }} />
          <div className="card fade-up" style={{ position: 'relative', width: 480, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Rechazar &ldquo;{rechazando.nombre}&rdquo;</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--text-3)' }}>
              El líder recibirá tu comentario y podrá ajustar y reenviar el proceso.
            </p>
            <textarea
              className="ca-textarea"
              placeholder="Explica qué hay que ajustar…"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
            />
            <div className="hstack" style={{ gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setRechazando(null)}>Cancelar</button>
              <button
                className="btn btn--primary btn--sm"
                disabled={procesando === rechazando.id}
                onClick={() => rechazar(rechazando.id)}
              >
                {procesando === rechazando.id ? 'Enviando…' : 'Enviar comentario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
