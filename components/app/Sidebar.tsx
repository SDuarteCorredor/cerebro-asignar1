'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icono from './Icono'
import type { Rol } from '@/types'

interface SidebarProps {
  rol: Rol
  aprobacionesPendientes?: number
  gestionId?: string | null
}

export default function Sidebar({ rol, aprobacionesPendientes = 0, gestionId }: SidebarProps) {
  const ruta = usePathname()
  const esAdmin = rol === 'admin'
  const esLider = rol === 'lider'

  const activa = (patron: string) => ruta.startsWith(patron) ? 'is-active' : ''

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">A</div>
        <div className="sidebar__logo-name">
          Cerebro Asignar
          <small>Asignar SAS</small>
        </div>
      </div>

      <Link href="/dashboard" className={`nav-item ${ruta === '/dashboard' ? 'is-active' : ''}`}>
        <Icono nombre="home" className="nav-item__icon" /> Inicio
      </Link>

      <Link href="/gestiones" className={`nav-item ${activa('/gestiones') || activa('/procesos') ? 'is-active' : ''}`}>
        <Icono nombre="grid" className="nav-item__icon" /> Procesos y Procedimientos
      </Link>

      <Link href="/buscar" className={`nav-item ${activa('/buscar') ? 'is-active' : ''}`}>
        <Icono nombre="search" className="nav-item__icon" /> Buscar
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface-sunken)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-3)' }}>⌘K</span>
      </Link>

      <div className="sidebar__section-label">Próximos módulos</div>
      <button className="nav-item is-disabled" disabled>
        <Icono nombre="paper" className="nav-item__icon" /> Políticas y Reglamentos
        <span className="nav-item__pill">Pronto</span>
      </button>
      <button className="nav-item is-disabled" disabled>
        <Icono nombre="bookmark" className="nav-item__icon" /> Acogida Laboral
        <span className="nav-item__pill">Pronto</span>
      </button>

      {(esAdmin || esLider) && (
        <div className="sidebar__section-label">{esAdmin ? 'Administración' : 'Mi Gestión'}</div>
      )}

      {esAdmin && (
        <>
          <Link href="/admin/gestiones" className={`nav-item ${activa('/admin/gestiones') ? 'is-active' : ''}`}>
            <Icono nombre="folder" className="nav-item__icon" /> Gestionar Gestiones
          </Link>
          <Link href="/admin/usuarios" className={`nav-item ${activa('/admin/usuarios') ? 'is-active' : ''}`}>
            <Icono nombre="users" className="nav-item__icon" /> Gestionar Usuarios
          </Link>
          <Link href="/admin/aprobaciones" className={`nav-item ${activa('/admin/aprobaciones') ? 'is-active' : ''}`}>
            <Icono nombre="inbox" className="nav-item__icon" /> Aprobaciones
            {aprobacionesPendientes > 0 && (
              <span className="nav-item__badge">{aprobacionesPendientes}</span>
            )}
          </Link>
        </>
      )}

      {esLider && gestionId && (
        <Link href={`/gestiones/${gestionId}`} className={`nav-item ${activa(`/gestiones/${gestionId}`) ? 'is-active' : ''}`}>
          <Icono nombre="folder" className="nav-item__icon" /> Mi Gestión
        </Link>
      )}

      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--divider)', marginTop: 10 }}>
        <div className="hstack" style={{ fontSize: 12, color: 'var(--text-3)' }}>
          <Icono nombre="info" className="icon icon--sm" />
          <span>v0.1 · MVP Etapa 1</span>
        </div>
      </div>
    </aside>
  )
}
