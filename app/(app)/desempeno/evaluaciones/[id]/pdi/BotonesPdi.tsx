'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generarPdiDesdeReporte, enviarPdiAFirma } from './acciones'

export function BotonGenerarPdi({ evaluacionId }: { evaluacionId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      className="btn btn--primary"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        const res = await generarPdiDesdeReporte(evaluacionId)
        if (res.error) alert(res.error)
        else router.refresh()
      })}
    >
      {isPending ? 'Generando…' : 'Generar PDI desde TOP 3'}
    </button>
  )
}

export function BotonEnviarAFirma({ pdiId, evaluacionId }: { pdiId: string; evaluacionId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <button
      className="btn btn--primary"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        if (!confirm('¿Enviar este PDI a firma? Ya no podrás cambiar las acciones.')) return
        const res = await enviarPdiAFirma(pdiId, evaluacionId)
        if (res.error) alert(res.error)
        else router.refresh()
      })}
    >
      {isPending ? 'Enviando…' : 'Enviar a firma'}
    </button>
  )
}
