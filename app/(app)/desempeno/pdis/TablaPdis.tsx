'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Fila {
  id: string
  estado: string
  proxima_revision: string
  evaluacion_id: string
  colaborador: { id: string; nombre: string; codigo_contrato: string | null } | null
  ciclo: { id: string; nombre: string } | null
  numAcciones: number
  avancePromedio: number
}

const badgeEstado: Record<string, string> = {
  borrador: 'badge--warning', en_firma: 'badge--neutral',
  vigente: 'badge--success', completado: 'badge--success', cancelado: 'badge--danger',
}
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function TablaPdis({ filas }: { filas: Fila[] }) {
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')

  const vis = useMemo(() => {
    const qn = norm(q.trim())
    return filas.filter(f => {
      if (estado && f.estado !== estado) return false
      if (qn) {
        const t = norm(`${f.colaborador?.nombre ?? ''} ${f.colaborador?.codigo_contrato ?? ''} ${f.ciclo?.nombre ?? ''}`)
        if (!t.includes(qn)) return false
      }
      return true
    })
  }, [filas, q, estado])

  return (
    <>
      <div className="hstack" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Buscar colaborador…" value={q} onChange={e => setQ(e.target.value)}
          style={{ minWidth: 220, flex: 1, maxWidth: 340 }} />
        <select className="input" value={estado} onChange={e => setEstado(e.target.value)} style={{ maxWidth: 170 }}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_firma">En firma</option>
          <option value="vigente">Vigente</option>
          <option value="completado">Completado</option>
        </select>
        {(q || estado) && <button className="btn btn--ghost btn--sm" onClick={() => { setQ(''); setEstado('') }}>Limpiar</button>}
        <span style={{ fontSize: 12.5, color: 'var(--text-3)', marginLeft: 'auto', alignSelf: 'center' }}>{vis.length} de {filas.length}</span>
      </div>

      <section className="card card--table">
        <table className="table table--in-card">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Ciclo</th>
              <th style={{ width: 110 }}>Estado</th>
              <th style={{ width: 90, textAlign: 'center' }}>Acciones</th>
              <th style={{ width: 220 }}>Avance</th>
              <th style={{ width: 130 }}>Próx. revisión</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {vis.map(f => (
              <tr key={f.id}>
                <td>
                  <div className="row-title">{f.colaborador?.nombre ?? '—'}</div>
                  {f.colaborador?.codigo_contrato && (
                    <div className="row-sub" style={{ fontFamily: 'var(--font-mono)' }}>{f.colaborador.codigo_contrato}</div>
                  )}
                </td>
                <td>{f.ciclo?.nombre ?? '—'}</td>
                <td><span className={`badge ${badgeEstado[f.estado] ?? 'badge--neutral'}`}>{f.estado}</span></td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{f.numAcciones}</td>
                <td>
                  <div className="hstack" style={{ gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${f.avancePromedio}%`, height: '100%', background: f.avancePromedio === 100 ? 'var(--success)' : 'var(--primary)' }} />
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>{f.avancePromedio}%</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{f.proxima_revision}</td>
                <td><Link href={`/desempeno/evaluaciones/${f.evaluacion_id}/pdi`} className="btn btn--ghost btn--sm">Ver</Link></td>
              </tr>
            ))}
            {vis.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--text-3)', fontSize: 13 }}>Ningún PDI coincide con los filtros.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}
