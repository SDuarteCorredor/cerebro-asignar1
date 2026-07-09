'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarTipoAusencia } from './acciones'

interface Tipo {
  id: string
  nombre: string
  remunerado: boolean
  descuenta: boolean
  requiere_soporte: boolean
  requiere_doble_validacion: boolean
  activo: boolean
}

function Toggle({ id, campo, valor, onDone }: { id: string; campo: string; valor: boolean; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  return (
    <input
      type="checkbox"
      checked={valor}
      disabled={isPending}
      onChange={() => startTransition(async () => {
        const res = await actualizarTipoAusencia(id, campo, !valor)
        if (res.error) alert(res.error)
        else onDone()
      })}
    />
  )
}

export default function FilaTipo({ tipo }: { tipo: Tipo }) {
  const router = useRouter()
  const done = () => router.refresh()
  return (
    <tr style={{ opacity: tipo.activo ? 1 : 0.5 }}>
      <td className="row-title">{tipo.nombre}</td>
      <td style={{ textAlign: 'center' }}><Toggle id={tipo.id} campo="remunerado" valor={tipo.remunerado} onDone={done} /></td>
      <td style={{ textAlign: 'center' }}><Toggle id={tipo.id} campo="descuenta" valor={tipo.descuenta} onDone={done} /></td>
      <td style={{ textAlign: 'center' }}><Toggle id={tipo.id} campo="requiere_soporte" valor={tipo.requiere_soporte} onDone={done} /></td>
      <td style={{ textAlign: 'center' }}><Toggle id={tipo.id} campo="requiere_doble_validacion" valor={tipo.requiere_doble_validacion} onDone={done} /></td>
      <td style={{ textAlign: 'center' }}><Toggle id={tipo.id} campo="activo" valor={tipo.activo} onDone={done} /></td>
    </tr>
  )
}
