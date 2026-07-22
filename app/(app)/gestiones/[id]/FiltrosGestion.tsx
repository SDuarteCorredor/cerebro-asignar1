'use client'

import { useState } from 'react'
import Link from 'next/link'
import BadgeEstado from '@/components/app/BadgeEstado'
import Icono from '@/components/app/Icono'
import type { EstadoProceso } from '@/types'

interface Proceso {
  id: string
  nombre: string
  objetivo: string
  version: string
  fecha_actualizacion: string
  estado: string
  pasos: { cargo_responsable: string }[]
}

interface Props {
  procesos: Proceso[]
  puedeEditar: boolean
  gestionId: string
}

export default function FiltrosGestion({ procesos, puedeEditar, gestionId }: Props) {
  const [filtro, setFiltro] = useState('Todos')
  const [vista, setVista] = useState<'tabla' | 'tarjetas'>('tabla')

  const filtros = puedeEditar
    ? ['Todos', 'activo', 'borrador', 'desactualizado', 'en_revision']
    : ['Todos', 'activo']

  const etiquetaFiltro: Record<string, string> = {
    Todos: 'Todos', activo: 'Activo', borrador: 'Borrador',
    desactualizado: 'Desactualizado', en_revision: 'En revisión',
  }

  const filtrados = procesos.filter(p => filtro === 'Todos' || p.estado === filtro)

  return (
    <>
      <div className="filter-row">
        <div className="filter-pills">
          {filtros.map((f) => (
            <button
              key={f}
              className={`filter-pill ${filtro === f ? 'is-active' : ''}`}
              onClick={() => setFiltro(f)}
            >
              {etiquetaFiltro[f]}{' '}
              <span style={{ opacity: 0.5, marginLeft: 4 }}>
                {f === 'Todos' ? procesos.length : procesos.filter(p => p.estado === f).length}
              </span>
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button className={`btn btn--sm ${vista === 'tabla' ? 'btn--secondary' : 'btn--ghost'}`} onClick={() => setVista('tabla')}>
          <Icono nombre="menu" className="icon icon--sm" /> Tabla
        </button>
        <button className={`btn btn--sm ${vista === 'tarjetas' ? 'btn--secondary' : 'btn--ghost'}`} onClick={() => setVista('tarjetas')}>
          <Icono nombre="grid" className="icon icon--sm" /> Tarjetas
        </button>
        {puedeEditar && (
          <Link href={`/procesos/nuevo?gestion=${gestionId}`} className="btn btn--primary btn--sm">
            <Icono nombre="plus" className="icon icon--sm" /> Nuevo proceso
          </Link>
        )}
      </div>

      {vista === 'tabla' && (
        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Proceso</th>
                  <th>Cargo responsable</th>
                  <th>Versión</th>
                  <th>Última actualización</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link href={`/procesos/${p.id}`} style={{ display: 'block' }}>
                        <div className="row-title">{p.nombre}</div>
                        <div className="row-sub" style={{ maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.objetivo}</div>
                      </Link>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.pasos?.[0]?.cargo_responsable ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-3)' }}>v{p.version}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-3)' }}>
                      {new Date(p.fecha_actualizacion).toLocaleDateString('es-CO')}
                    </td>
                    <td><BadgeEstado estado={p.estado as EstadoProceso} /></td>
                    <td>
                      <Link href={`/procesos/${p.id}`} aria-label={`Abrir proceso ${p.nombre}`}>
                        <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No hay procesos en este filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vista === 'tarjetas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtrados.map((p) => (
            <Link key={p.id} href={`/procesos/${p.id}`} className="card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div className="card__title" style={{ fontSize: 15 }}>{p.nombre}</div>
                <BadgeEstado estado={p.estado as EstadoProceso} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{p.objetivo}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--divider)', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                <span>v{p.version}</span>
                <span>{new Date(p.fecha_actualizacion).toLocaleDateString('es-CO')}</span>
              </div>
            </Link>
          ))}
          {filtrados.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No hay procesos en este filtro.</div>
          )}
        </div>
      )}
    </>
  )
}
