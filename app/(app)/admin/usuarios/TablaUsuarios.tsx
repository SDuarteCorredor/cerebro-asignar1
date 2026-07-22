'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Icono from '@/components/app/Icono'

interface Cargo { id: string; nombre: string; banda: string }
interface Usuario {
  id: string
  codigo_contrato: string | null
  nombre: string
  correo: string | null
  rol: string
  activo: boolean
  sede: string | null
  gestion_id: string | null
  gestion_nombre: string | null
  cargo: Cargo | null
}

const badgeRol: Record<string, string> = { admin: 'badge--primary', lider: 'badge--warning', colaborador: 'badge--neutral' }
const etiquetaRol: Record<string, string> = { admin: 'Administrador', lider: 'Líder de Gestión', colaborador: 'Colaborador' }

function iniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}
function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export default function TablaUsuarios({ usuarios, gestiones }: {
  usuarios: Usuario[]
  gestiones: { id: string; nombre: string }[]
}) {
  const [q, setQ] = useState('')
  const [gestion, setGestion] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')

  const filtrados = useMemo(() => {
    const qn = norm(q.trim())
    return usuarios.filter(u => {
      if (gestion && u.gestion_id !== gestion) return false
      if (rol && u.rol !== rol) return false
      if (estado === 'activo' && !u.activo) return false
      if (estado === 'inactivo' && u.activo) return false
      if (qn) {
        const texto = norm(`${u.nombre} ${u.codigo_contrato ?? ''} ${u.correo ?? ''} ${u.cargo?.nombre ?? ''}`)
        if (!texto.includes(qn)) return false
      }
      return true
    })
  }, [usuarios, q, gestion, rol, estado])

  const hayFiltro = q || gestion || rol || estado

  return (
    <>
      <div className="hstack" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="input" placeholder="Buscar por nombre, código o correo…"
          value={q} onChange={e => setQ(e.target.value)}
          style={{ minWidth: 240, flex: 1, maxWidth: 360 }}
        />
        <select className="input" value={gestion} onChange={e => setGestion(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Todas las gestiones</option>
          {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
        <select className="input" value={rol} onChange={e => setRol(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Todos los roles</option>
          <option value="colaborador">Colaborador</option>
          <option value="lider">Líder</option>
          <option value="admin">Admin</option>
        </select>
        <select className="input" value={estado} onChange={e => setEstado(e.target.value)} style={{ maxWidth: 130 }}>
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        {hayFiltro && (
          <button className="btn btn--ghost btn--sm" onClick={() => { setQ(''); setGestion(''); setRol(''); setEstado('') }}>
            Limpiar
          </button>
        )}
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 10 }}>
        {filtrados.length} de {usuarios.length} usuarios
      </div>

      <div className="card card--table">
        <div className="table-scroll">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Sede</th>
                <th>Rol</th>
                <th>Estado</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5 }}>{u.codigo_contrato ?? '—'}</td>
                  <td>
                    <div className="hstack" style={{ gap: 10 }}>
                      <div className="avatar avatar--sm">{iniciales(u.nombre)}</div>
                      <div>
                        <div className="row-title">{u.nombre}</div>
                        {u.correo && <div className="row-sub" style={{ fontFamily: 'var(--font-mono)' }}>{u.correo}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.cargo ? (
                      <div>
                        <div style={{ fontSize: 13 }}>{u.cargo.nombre}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{u.cargo.banda}</div>
                      </div>
                    ) : <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin cargo</span>}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {u.sede ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                    {u.gestion_id && <div className="row-sub">{u.gestion_nombre ?? '—'}</div>}
                  </td>
                  <td><span className={`badge ${badgeRol[u.rol] ?? 'badge--neutral'}`}>{etiquetaRol[u.rol] ?? u.rol}</span></td>
                  <td><span className={`badge badge--${u.activo ? 'success' : 'neutral'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/usuarios/${u.id}`} className="btn btn--ghost btn--sm" title="Editar" aria-label={`Editar ${u.nombre}`}>
                      <Icono nombre="edit" className="icon icon--sm" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)', fontSize: 13 }}>
                  Ningún usuario coincide con los filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
