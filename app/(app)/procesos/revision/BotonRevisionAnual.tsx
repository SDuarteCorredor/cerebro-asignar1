'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

export default function BotonRevisionAnual() {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [pendiente, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  function lanzar() {
    if (!confirm('¿Notificar a los líderes que revisen su documentación este año?')) return
    setMsg('')
    startTransition(async () => {
      const { data, error } = await supabase.rpc('notificar_revision_anual')
      if (error) { setMsg(error.message); return }
      setMsg(`Se avisó a ${data ?? 0} líder(es).`)
      router.refresh()
    })
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button className="btn btn--secondary btn--sm" onClick={lanzar} disabled={pendiente}>
        <Icono nombre="bell" className="icon icon--sm" />
        {pendiente ? 'Avisando…' : 'Lanzar revisión anual'}
      </button>
      {msg && <div style={{ fontSize: 12, color: 'var(--success-ink)', marginTop: 6 }}>{msg}</div>}
    </div>
  )
}
