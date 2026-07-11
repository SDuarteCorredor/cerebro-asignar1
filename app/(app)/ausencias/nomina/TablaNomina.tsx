'use client'

import { useState } from 'react'
import { obtenerUrlSoporte } from '../acciones'

export interface FilaNomina {
  id: string
  colaborador: string
  codigo: string
  cargo: string
  gestion: string
  tipo: string
  remunerado: boolean
  descuenta: boolean
  desde: string
  hasta: string
  horario: string
  ciudad: string
  dias: number
  soporte_path: string | null
}

export default function TablaNomina({ filas, periodo }: { filas: FilaNomina[]; periodo: string }) {
  const [error, setError] = useState<string | null>(null)

  async function verSoporte(path: string) {
    const url = await obtenerUrlSoporte(path)
    if (!url) { setError('No se pudo abrir el soporte'); return }
    window.open(url, '_blank')
  }

  function exportarCSV() {
    const encabezados = ['Colaborador', 'Código', 'Cargo', 'Gestión', 'Ciudad', 'Tipo', 'Desde', 'Hasta', 'Horario', 'Días', 'Remunerado', 'Descuenta']
    const escapar = (v: string | number) => {
      const s = String(v)
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lineas = [
      encabezados.join(';'),
      ...filas.map(f => [
        f.colaborador, f.codigo, f.cargo, f.gestion, f.ciudad, f.tipo,
        f.desde, f.hasta, f.horario, f.dias, f.remunerado ? 'Sí' : 'No', f.descuenta ? 'Sí' : 'No',
      ].map(escapar).join(';')),
    ]
    // BOM para que Excel abra tildes bien
    const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ausencias_${periodo}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  if (filas.length === 0) {
    return (
      <div className="card" style={{ padding: 26, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        No hay ausencias aprobadas en esta quincena.
      </div>
    )
  }

  return (
    <>
      <div className="hstack" style={{ justifyContent: 'flex-end', marginBottom: 10 }}>
        <button className="btn btn--secondary btn--sm" onClick={exportarCSV}>Exportar CSV (Excel)</button>
      </div>
      {error && (
        <div style={{ marginBottom: 10, padding: '6px 10px', background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12 }}>{error}</div>
      )}
      <section className="card card--table">
        <div className="table-scroll">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Gestión</th>
                <th>Tipo</th>
                <th style={{ width: 150 }}>Fechas</th>
                <th style={{ width: 60, textAlign: 'center' }}>Días</th>
                <th style={{ width: 90, textAlign: 'center' }}>Remun.</th>
                <th style={{ width: 90, textAlign: 'center' }}>Descuenta</th>
                <th style={{ width: 90 }}>Soporte</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.id}>
                  <td>
                    <div className="row-title">{f.colaborador}</div>
                    <div className="row-sub">{f.codigo && <span style={{ fontFamily: 'var(--font-mono)' }}>{f.codigo} · </span>}{f.cargo}</div>
                  </td>
                  <td className="text-sm">{f.gestion || '—'}</td>
                  <td><span className="badge badge--neutral badge--no-dot" style={{ fontSize: 11 }}>{f.tipo}</span></td>
                  <td className="text-mono text-xs">
                    {f.desde === f.hasta ? f.desde : `${f.desde} → ${f.hasta}`}
                    <div style={{ color: 'var(--text-3)' }}>{f.horario}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{f.dias}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${f.remunerado ? 'badge--success' : 'badge--neutral'}`} style={{ fontSize: 10.5 }}>{f.remunerado ? 'Sí' : 'No'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${f.descuenta ? 'badge--danger' : 'badge--neutral'}`} style={{ fontSize: 10.5 }}>{f.descuenta ? 'Sí' : 'No'}</span>
                  </td>
                  <td>
                    {f.soporte_path
                      ? <button className="btn btn--ghost btn--sm" onClick={() => verSoporte(f.soporte_path!)}>Ver</button>
                      : <span className="text-muted text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
