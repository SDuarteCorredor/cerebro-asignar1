'use client'

import Link from 'next/link'
import IconoGestion from '@/components/app/IconoGestion'
import Icono from '@/components/app/Icono'
import SelectorVista, { useVista } from '@/components/app/SelectorVista'
import { obtenerIniciales } from '@/lib/sesion'

export interface FilaGestion {
  id: string
  nombre: string
  descripcion: string | null
  icono: string
  color_soft: string
  color_primary: string
  lider: { id: string; nombre: string } | null
  activos: number
}

export default function ClienteGestiones({ gestiones }: { gestiones: FilaGestion[] }) {
  const [vista, setVista] = useVista('vista:gestiones', 'tarjetas')

  return (
    <>
      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <span className="section-count">{gestiones.length} gestiones</span>
        <SelectorVista vista={vista} onCambio={setVista} />
      </div>

      {vista === 'tarjetas' ? (
        <div className="grid-cards">
          {gestiones.map(g => (
            <Link key={g.id} href={`/gestiones/${g.id}`} className="card card--interactiva gestion-tarjeta">
              <IconoGestion gestion={g} size={44} rounded={12} />
              <div className="gestion-tarjeta__nombre">{g.nombre}</div>
              {g.descripcion && <p className="gestion-tarjeta__desc">{g.descripcion}</p>}
              <div className="gestion-tarjeta__pie">
                {g.lider ? (
                  <span className="hstack" style={{ gap: 6, minWidth: 0 }}>
                    <span className="avatar avatar--sm">{obtenerIniciales(g.lider.nombre)}</span>
                    <span className="gestion-tarjeta__lider">{g.lider.nombre}</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Sin líder</span>
                )}
                <span className="badge badge--neutral badge--no-dot">
                  {g.activos} {g.activos === 1 ? 'proceso' : 'procesos'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Gestión</th>
                  <th>Líder</th>
                  <th style={{ textAlign: 'right' }}>Procesos activos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {gestiones.map(g => (
                  <tr key={g.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link href={`/gestiones/${g.id}`} style={{ display: 'block' }}>
                        <div className="hstack">
                          <IconoGestion gestion={g} size={32} rounded={8} />
                          <div style={{ minWidth: 0 }}>
                            <div className="row-title">{g.nombre}</div>
                            <div className="row-sub" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {g.descripcion}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      {g.lider && (
                        <div className="hstack" style={{ gap: 8 }}>
                          <div className="avatar avatar--sm">{obtenerIniciales(g.lider.nombre)}</div>
                          <span style={{ fontSize: 13 }}>{g.lider.nombre}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{g.activos}</td>
                    <td>
                      <Link href={`/gestiones/${g.id}`} aria-label={`Abrir gestión ${g.nombre}`}>
                        <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
