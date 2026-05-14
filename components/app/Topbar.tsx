'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from './Icono'
import type { SesionUsuario } from '@/types'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface MigaPan {
  etiqueta: string
  href?: string
}

interface TopbarProps {
  migas?: MigaPan[]
  usuario: SesionUsuario
  mostrarBuscar?: boolean
}

export default function Topbar({ migas = [], usuario, mostrarBuscar = true }: TopbarProps) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function buscar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
    if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="topbar">
      <nav className="topbar__breadcrumb">
        <Link href="/dashboard" className="topbar__breadcrumb-item" style={{ color: 'var(--text-3)' }}>
          Inicio
        </Link>
        {migas.map((m, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
            {m.href ? (
              <Link href={m.href} className="topbar__breadcrumb-item">{m.etiqueta}</Link>
            ) : (
              <span className="topbar__breadcrumb-item">{m.etiqueta}</span>
            )}
          </span>
        ))}
      </nav>

      {mostrarBuscar && (
        <form className="topbar__search" onSubmit={buscar}>
          <Icono nombre="search" className="icon icon--sm" />
          <input name="q" placeholder="Buscar procesos…" />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-3)' }}>⌘K</kbd>
        </form>
      )}

      <div className="topbar__user">
        <div>
          <div className="topbar__user-name">{usuario.nombre}</div>
          <div className="topbar__user-role">
            {usuario.rol === 'admin' ? 'Administrador' : usuario.rol === 'lider' ? 'Líder de Gestión' : 'Colaborador'}
          </div>
        </div>
        <div className="avatar">{usuario.iniciales}</div>
      </div>

      <button className="btn btn--ghost btn--sm" onClick={cerrarSesion} title="Cerrar sesión">
        <Icono nombre="logout" className="icon" />
      </button>
    </header>
  )
}
