'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Icono from './Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Notificacion {
  id: string
  tipo: string
  titulo: string
  mensaje: string | null
  url: string | null
  leida: boolean
  created_at: string
}

/** Ícono y color por tipo de notificación. */
const estiloPorTipo: Record<string, { icono: string; color: string }> = {
  ausencia_pendiente: { icono: 'inbox', color: 'var(--warning-ink)' },
  ausencia_aprobada: { icono: 'check', color: 'var(--success-ink)' },
  ausencia_denegada: { icono: 'x', color: 'var(--danger-ink)' },
  ausencia_segunda_validacion: { icono: 'shield', color: 'var(--warning-ink)' },
  documento_por_aprobar: { icono: 'inbox', color: 'var(--primary)' },
  documento_aprobado: { icono: 'check', color: 'var(--success-ink)' },
  documento_rechazado: { icono: 'x', color: 'var(--danger-ink)' },
}

/** "hace 5 min", "hace 2 h", "hace 3 d" */
function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} d`
  return new Date(iso).toLocaleDateString('es-CO')
}

export default function Campana() {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [items, setItems] = useState<Notificacion[]>([])
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sin setState antes del await: si no, se dispara react-hooks/set-state-in-effect
  const cargar = useCallback(async () => {
    // La RLS ya limita el select a las notificaciones del usuario en sesión
    const { data } = await supabase
      .from('notificaciones')
      .select('id, tipo, titulo, mensaje, url, leida, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
    setCargando(false)
  }, [supabase])

  useEffect(() => {
    let vivo = true
    async function traer() {
      const { data } = await supabase
        .from('notificaciones')
        .select('id, tipo, titulo, mensaje, url, leida, created_at')
        .order('created_at', { ascending: false })
        .limit(20)
      if (!vivo) return   // evita actualizar estado tras desmontar
      setItems(data ?? [])
      setCargando(false)
    }
    void traer()
    const t = setInterval(traer, 60000)
    return () => { vivo = false; clearInterval(t) }
  }, [supabase])

  // Cerrar al hacer clic fuera o con Escape
  useEffect(() => {
    if (!abierto) return
    function alClicFuera(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setAbierto(false)
    }
    function alEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClicFuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicFuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  const sinLeer = items.filter(n => !n.leida).length

  async function marcarLeida(n: Notificacion) {
    if (!n.leida) {
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
      await supabase.from('notificaciones').update({ leida: true }).eq('id', n.id)
    }
  }

  async function abrir(n: Notificacion) {
    await marcarLeida(n)
    setAbierto(false)
    if (n.url) router.push(n.url)
  }

  async function marcarTodas() {
    const pendientes = items.filter(n => !n.leida).map(n => n.id)
    if (pendientes.length === 0) return
    setItems(prev => prev.map(x => ({ ...x, leida: true })))
    await supabase.from('notificaciones').update({ leida: true }).in('id', pendientes)
  }

  return (
    <div className="campana" ref={panelRef}>
      <button
        className="btn btn--ghost btn--sm campana__btn"
        onClick={() => { setAbierto(a => !a); if (!abierto) cargar() }}
        title="Notificaciones"
        aria-label={sinLeer > 0 ? `Notificaciones: ${sinLeer} sin leer` : 'Notificaciones'}
      >
        <Icono nombre="bell" className="icon" />
        {sinLeer > 0 && <span className="campana__badge">{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>

      {abierto && (
        <div className="campana__panel fade-up">
          <div className="campana__head">
            <strong style={{ fontSize: 14 }}>Notificaciones</strong>
            {sinLeer > 0 && (
              <button className="btn btn--ghost btn--sm" onClick={marcarTodas} style={{ fontSize: 12 }}>
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="campana__lista">
            {items.length === 0 ? (
              <div className="campana__vacio">
                {cargando ? 'Cargando…' : 'No tienes notificaciones.'}
              </div>
            ) : items.map(n => {
              const est = estiloPorTipo[n.tipo] ?? { icono: 'info', color: 'var(--text-3)' }
              return (
                <button
                  key={n.id}
                  className={`campana__item${n.leida ? '' : ' is-nueva'}`}
                  onClick={() => abrir(n)}
                >
                  <Icono nombre={est.icono} className="icon icon--sm" style={{ color: est.color, flexShrink: 0, marginTop: 2 }} />
                  <span className="campana__item-cuerpo">
                    <span className="campana__item-titulo">{n.titulo}</span>
                    {n.mensaje && <span className="campana__item-msg">{n.mensaje}</span>}
                    <span className="campana__item-fecha">{hace(n.created_at)}</span>
                  </span>
                  {!n.leida && <span className="campana__punto" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
