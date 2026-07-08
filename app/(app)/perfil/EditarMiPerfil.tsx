'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarMiPerfil } from './acciones'

export default function EditarMiPerfil({
  nombrePreferido, celular, nombreOficial,
}: {
  nombrePreferido: string | null
  celular: string | null
  nombreOficial: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [np, setNp] = useState(nombrePreferido ?? '')
  const [cel, setCel] = useState(celular ?? '')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (!abierto) {
    return (
      <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(true)}>
        Personalizar mi perfil
      </button>
    )
  }

  return (
    <div className="card" style={{ padding: 18, marginTop: 12, background: 'var(--surface-sunken)' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Personalizar mi perfil</h3>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-3)' }}>
        Solo puedes cambiar cómo te saluda la plataforma y tu celular. El resto de tus datos los administra Talento Humano.
      </p>

      <div className="grid-2col" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Nombre para saludarte</div>
          <input className="input" value={np} onChange={e => setNp(e.target.value)}
            placeholder="Ej. Simón" maxLength={40} />
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            Nombre oficial: {nombreOficial}
          </div>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Celular</div>
          <input className="input" value={cel} onChange={e => setCel(e.target.value)}
            placeholder="Ej. 300 123 4567" maxLength={30} />
        </label>
      </div>

      {msg && (
        <div style={{
          padding: '8px 12px', borderRadius: 6, fontSize: 12.5, marginBottom: 12,
          background: msg.tipo === 'ok' ? 'var(--success-soft)' : 'var(--danger-soft)',
          color: msg.tipo === 'ok' ? 'var(--success-ink)' : 'var(--danger-ink)',
        }}>{msg.texto}</div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn--ghost btn--sm" onClick={() => { setAbierto(false); setMsg(null) }}>Cerrar</button>
        <button
          className="btn btn--primary btn--sm"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            setMsg(null)
            const res = await actualizarMiPerfil({ nombre_preferido: np, celular: cel })
            if (res.error) setMsg({ tipo: 'err', texto: res.error })
            else { setMsg({ tipo: 'ok', texto: 'Guardado. Así te saludará la plataforma.' }); router.refresh() }
          })}
        >
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
