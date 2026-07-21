'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icono from './Icono'
import { useShell } from './AppShell'
import type { Rol } from '@/types'

interface SidebarProps {
  rol: Rol
  aprobacionesPendientes?: number
  gestionId?: string | null
}

export default function Sidebar({ rol, aprobacionesPendientes = 0, gestionId }: SidebarProps) {
  const ruta = usePathname()
  const { sidebarOpen, closeSidebar } = useShell()
  const esAdmin = rol === 'admin'
  const esLider = rol === 'lider'

  const activa = (patron: string) => ruta.startsWith(patron) ? 'is-active' : ''

  function navegar() {
    closeSidebar()
  }

  return (
    <>
      <div
        className={`sidebar__overlay${sidebarOpen ? ' is-open' : ''}`}
        onClick={closeSidebar}
      />
      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <button className="sidebar__close" onClick={closeSidebar} aria-label="Cerrar menú">
          <Icono nombre="x" className="icon" />
        </button>

        <div className="sidebar__logo">
          <div className="sidebar__logo-mark">
            <svg viewBox="0 0 2000 2000" width="20" height="20" aria-hidden="true">
              <g>
                <circle fill="currentColor" cx="608.46" cy="734.33" r="101.45"/>
                <path fill="currentColor" d="M746.74,949.1v207.53c0,9.97-4.35,19.45-11.9,25.95l-87.45,75.27c-6.21,5.35-14.14,8.29-22.34,8.29h-52.99c-56.02,0-101.86-45.84-101.86-101.86v-215.19c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <circle fill="currentColor" cx="1391.54" cy="733.65" r="101.45"/>
                <path fill="currentColor" d="M1529.81,948.42v215.19c0,56.02-45.84,101.86-101.86,101.86h-53.81c-8.2,0-16.13-2.94-22.34-8.29l-86.63-74.56c-7.56-6.51-11.91-15.98-11.91-25.96v-208.25c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <circle fill="currentColor" cx="1000.34" cy="674.63" r="101.45"/>
                <path fill="currentColor" d="M1138.62,887.77v120.11c0,29.29-34.39,45.06-56.59,25.95l-29.45-25.35c-30.26-26.03-75.03-26.03-105.28,0l-28.63,24.65c-22.2,19.11-56.59,3.34-56.59-25.95v-119.41c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <path fill="currentColor" d="M1278.53,1426.82h-557.19c-63.53,0-92.82-78.97-44.67-120.41l15.06-12.97,33.69-28.98,157.49-135.58,72.35-62.28c25.69-22.12,63.69-22.12,89.38,0l73.04,62.87,158.04,136.05,31.99,27.53h.01l15.49,13.35c48.15,41.44,18.85,120.41-44.68,120.41Z"/>
              </g>
            </svg>
          </div>
          <div className="sidebar__logo-name">
            Cerebro Asignar
            <small>Asignar SAS</small>
          </div>
        </div>

        <Link href="/dashboard" className={`nav-item ${ruta === '/dashboard' ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="home" className="nav-item__icon" /> Inicio
        </Link>

        <Link href="/gestiones" className={`nav-item ${(activa('/gestiones') || activa('/procesos')) && !activa('/procesos/revision') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="grid" className="nav-item__icon" /> Procesos y Procedimientos
        </Link>

        {(esAdmin || esLider) && (
          <Link href="/procesos/revision" className={`nav-item ${activa('/procesos/revision') ? 'is-active' : ''}`} onClick={navegar}>
            <Icono nombre="history" className="nav-item__icon" /> Revisión documental
          </Link>
        )}

        <Link href="/desempeno" className={`nav-item ${activa('/desempeno') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="target" className="nav-item__icon" /> Desempeño
          <span className="nav-item__pill nav-item__pill--brand">Nuevo</span>
        </Link>

        <Link href="/buscar" className={`nav-item ${activa('/buscar') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="search" className="nav-item__icon" /> Buscar
          <span className="hide-mobile" style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10.5, background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '1px 7px', borderRadius: 6, color: 'var(--text-3)' }}>⌘K</span>
        </Link>

        <Link href="/politicas" className={`nav-item ${activa('/politicas') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="paper" className="nav-item__icon" /> Políticas y Reglamentos
        </Link>

        <Link href="/comites" className={`nav-item ${activa('/comites') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="check" className="nav-item__icon" /> Comités
        </Link>

        <Link href="/ausencias" className={`nav-item ${activa('/ausencias') ? 'is-active' : ''}`} onClick={navegar}>
          <Icono nombre="calendar" className="nav-item__icon" /> Permisos y Ausencias
          <span className="nav-item__pill nav-item__pill--brand">Nuevo</span>
        </Link>

        <div className="sidebar__section-label">Próximos módulos</div>
        <button className="nav-item is-disabled" disabled>
          <Icono nombre="bookmark" className="nav-item__icon" /> Acogida Laboral
          <span className="nav-item__pill">Pronto</span>
        </button>

        {(esAdmin || esLider) && (
          <div className="sidebar__section-label">{esAdmin ? 'Administración' : 'Mi Gestión'}</div>
        )}

        {esAdmin && (
          <>
            <Link href="/admin/gestiones" className={`nav-item ${activa('/admin/gestiones') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="folder" className="nav-item__icon" /> Gestionar Gestiones
            </Link>
            <Link href="/admin/usuarios" className={`nav-item ${activa('/admin/usuarios') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="users" className="nav-item__icon" /> Gestionar Usuarios
            </Link>
            <Link href="/admin/politicas" className={`nav-item ${activa('/admin/politicas') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="fileCheck" className="nav-item__icon" /> Gestionar Políticas
            </Link>
            <Link href="/admin/onboarding" className={`nav-item ${activa('/admin/onboarding') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="clipboard" className="nav-item__icon" /> Acogida laboral
            </Link>
            <Link href="/admin/tipos-ausencia" className={`nav-item ${activa('/admin/tipos-ausencia') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="list" className="nav-item__icon" /> Tipos de ausencia
            </Link>
            <Link href="/admin/aprobaciones" className={`nav-item ${activa('/admin/aprobaciones') ? 'is-active' : ''}`} onClick={navegar}>
              <Icono nombre="inbox" className="nav-item__icon" /> Aprobaciones
              {aprobacionesPendientes > 0 && (
                <span className="nav-item__badge">{aprobacionesPendientes}</span>
              )}
            </Link>
          </>
        )}

        {esLider && gestionId && (
          <Link href={`/gestiones/${gestionId}`} className={`nav-item ${activa(`/gestiones/${gestionId}`) ? 'is-active' : ''}`} onClick={navegar}>
            <Icono nombre="folder" className="nav-item__icon" /> Mi Gestión
          </Link>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--divider)', marginTop: 10 }}>
          <div className="hstack" style={{ fontSize: 12, color: 'var(--text-3)' }}>
            <Icono nombre="info" className="icon icon--sm" />
            <span>v0.8 · Etapa 16 · Calidad</span>
          </div>
        </div>
      </aside>
    </>
  )
}
