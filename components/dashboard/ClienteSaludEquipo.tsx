'use client'

import { useState } from 'react'
import Icono from '@/components/app/Icono'
import { badgePct, colorHeatmap } from '@/lib/comites/puntaje'

/** Iniciales locales — evita import de lib/sesion que trae dependencias de servidor. */
function iniciales(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export interface FilaEquipo {
  id: string
  nombre: string
  codigo: string | null
  comites: {
    puntos: number
    pct: number | null
    cumplidos: number
    total: number
    delta: number
    heatmap: { semana: number; pct: number | null }[]
  }
  desempeno: {
    pendientes: number
    total: number
    estadoMi: string | null
  }
  pdi: {
    avance: number | null
    proxima: string | null
  }
}

type Vista = 'comites' | 'desempeno' | 'pdis'

interface Props {
  filas: FilaEquipo[]
  cicloNombre: string | null
  semanaActual: number
  anio: number
}

export default function ClienteSaludEquipo({ filas, cicloNombre, semanaActual, anio }: Props) {
  const [vista, setVista] = useState<Vista>('comites')

  // Orden por urgencia según la vista actual
  const filasOrden = [...filas].sort((a, b) => {
    if (vista === 'comites') {
      // Primero los que necesitan atención (peor %), después los mejores
      const pa = a.comites.pct ?? -1
      const pb = b.comites.pct ?? -1
      return pa - pb
    }
    if (vista === 'desempeno') {
      // Más pendientes primero
      return b.desempeno.pendientes - a.desempeno.pendientes
    }
    // PDIs: menor avance primero, sin PDI al final
    const va = a.pdi.avance ?? 200
    const vb = b.pdi.avance ?? 200
    return va - vb
  })

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Salud del equipo</h2>
        <div className="hstack" style={{ gap: 6 }}>
          {[
            { clave: 'comites' as const, label: 'Comités', icono: 'check' },
            { clave: 'desempeno' as const, label: 'Desempeño', icono: 'target' },
            { clave: 'pdis' as const, label: 'PDIs', icono: 'chart' },
          ].map(t => (
            <button
              key={t.clave}
              type="button"
              onClick={() => setVista(t.clave)}
              className={`btn btn--sm ${vista === t.clave ? 'btn--primary' : 'btn--ghost'}`}
            >
              <Icono nombre={t.icono} className="icon icon--sm" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {vista === 'comites' && (
        <div className="card card--table">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Persona</th>
                <th style={{ width: 80, textAlign: 'center' }}>Puntos</th>
                <th style={{ width: 90, textAlign: 'center' }}>Esta sem.</th>
                <th style={{ width: 100, textAlign: 'center' }}>% anual</th>
                <th style={{ minWidth: 220 }}>Últimas 12 semanas</th>
              </tr>
            </thead>
            <tbody>
              {filasOrden.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="hstack" style={{ gap: 8 }}>
                      <div className="avatar avatar--sm">{iniciales(f.nombre)}</div>
                      <div>
                        <div className="row-title" style={{ fontSize: 13.5 }}>{f.nombre}</div>
                        {f.codigo && <div className="text-xs text-muted text-mono">{f.codigo}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {f.comites.puntos}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: f.comites.delta > 0 ? 'var(--success-ink)' : 'var(--text-3)' }}>
                    {f.comites.delta > 0 ? `+${f.comites.delta}` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {f.comites.pct === null
                      ? <span className="text-muted text-sm">—</span>
                      : <span className={`badge ${badgePct(f.comites.pct)}`}>{f.comites.pct}%</span>}
                  </td>
                  <td>
                    <div className="dash-heatmap-fila">
                      {f.comites.heatmap.map(c => (
                        <span
                          key={c.semana}
                          className="dash-heatmap-cell"
                          title={c.pct === null ? `W${c.semana}: sin comité` : `W${c.semana}: ${c.pct}%`}
                          style={{
                            background: colorHeatmap(c.pct),
                            border: c.semana === semanaActual ? '2px solid var(--primary)' : undefined,
                          }}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dash-tabla-pie">Año {anio} · verde ≥80%, amarillo 50-79%, rojo &lt;50%</div>
        </div>
      )}

      {vista === 'desempeno' && (
        <div className="card card--table">
          {!cicloNombre ? (
            <div className="dash-empty" style={{ borderRadius: 12 }}>
              <Icono nombre="info" className="icon" style={{ color: 'var(--text-3)' }} />
              <div>
                <div className="dash-empty__title">No hay ciclo de evaluación en curso.</div>
                <div className="dash-empty__msg">Cuando TH abra un ciclo, aquí verás la cobertura del equipo.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="dash-tabla-cab">
                <div className="page__eyebrow" style={{ margin: 0 }}>{cicloNombre}</div>
                <span className="text-xs text-muted">Cuestionarios asignados a cada miembro como evaluador</span>
              </div>
              <table className="table table--in-card">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th style={{ width: 140, textAlign: 'center' }}>Como evaluador</th>
                    <th style={{ width: 160, textAlign: 'center' }}>Su propia evaluación</th>
                  </tr>
                </thead>
                <tbody>
                  {filasOrden.map(f => (
                    <tr key={f.id}>
                      <td>
                        <div className="hstack" style={{ gap: 8 }}>
                          <div className="avatar avatar--sm">{iniciales(f.nombre)}</div>
                          <span className="row-title" style={{ fontSize: 13.5 }}>{f.nombre}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {f.desempeno.total === 0 ? (
                          <span className="text-muted text-sm">Sin asignar</span>
                        ) : f.desempeno.pendientes === 0 ? (
                          <span className="badge badge--success badge--no-dot">Completo · {f.desempeno.total}</span>
                        ) : (
                          <span className="badge badge--warning badge--no-dot">
                            {f.desempeno.pendientes} de {f.desempeno.total} pendientes
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {!f.desempeno.estadoMi ? (
                          <span className="text-muted text-sm">Sin evaluación</span>
                        ) : (
                          <span className="text-sm">{f.desempeno.estadoMi}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {vista === 'pdis' && (
        <div className="card card--table">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Persona</th>
                <th style={{ width: 220 }}>Avance PDI</th>
                <th style={{ width: 150, textAlign: 'right' }}>Próxima revisión</th>
              </tr>
            </thead>
            <tbody>
              {filasOrden.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="hstack" style={{ gap: 8 }}>
                      <div className="avatar avatar--sm">{iniciales(f.nombre)}</div>
                      <span className="row-title" style={{ fontSize: 13.5 }}>{f.nombre}</span>
                    </div>
                  </td>
                  <td>
                    {f.pdi.avance === null ? (
                      <span className="text-muted text-sm">Sin PDI vigente</span>
                    ) : (
                      <div className="hstack" style={{ gap: 10 }}>
                        <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{
                            width: `${f.pdi.avance}%`, height: '100%',
                            background: f.pdi.avance >= 80 ? 'var(--success)' : f.pdi.avance >= 50 ? 'var(--warning)' : 'var(--danger)',
                          }} />
                        </div>
                        <span className="text-sm font-semibold text-mono" style={{ minWidth: 40 }}>{f.pdi.avance}%</span>
                      </div>
                    )}
                  </td>
                  <td className="text-mono text-xs text-muted" style={{ textAlign: 'right' }}>
                    {f.pdi.proxima ? new Date(f.pdi.proxima).toLocaleDateString('es-CO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
