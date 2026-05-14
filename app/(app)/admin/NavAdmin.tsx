'use client'

import Link from 'next/link'
import Icono from '@/components/app/Icono'

interface Props {
  activa: 'gestiones' | 'usuarios' | 'aprobaciones'
  aprobacionesPendientes: number
  totalGestiones: number
  totalUsuarios: number
}

export default function NavAdmin({ activa, aprobacionesPendientes, totalGestiones, totalUsuarios }: Props) {
  return (
    <div className="tabs">
      <Link href="/admin/gestiones" className={`tab ${activa === 'gestiones' ? 'is-active' : ''}`}>
        <Icono nombre="folder" className="icon icon--sm" /> Gestiones
        <span className="badge badge--neutral badge--no-dot" style={{ padding: '2px 7px', fontSize: 11 }}>{totalGestiones}</span>
      </Link>
      <Link href="/admin/usuarios" className={`tab ${activa === 'usuarios' ? 'is-active' : ''}`}>
        <Icono nombre="users" className="icon icon--sm" /> Usuarios
        <span className="badge badge--neutral badge--no-dot" style={{ padding: '2px 7px', fontSize: 11 }}>{totalUsuarios}</span>
      </Link>
      <Link href="/admin/aprobaciones" className={`tab ${activa === 'aprobaciones' ? 'is-active' : ''}`}>
        <Icono nombre="inbox" className="icon icon--sm" /> Aprobaciones pendientes
        {aprobacionesPendientes > 0 && (
          <span className="badge badge--warning badge--no-dot" style={{ padding: '2px 7px', fontSize: 11 }}>{aprobacionesPendientes}</span>
        )}
      </Link>
    </div>
  )
}
