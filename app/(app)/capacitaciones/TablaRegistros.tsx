'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { calcularVigencia, etiquetaVigencia, badgeVigencia, type Vigencia } from '@/lib/documentos/vigencia'
import { fFechaCorta } from '@/lib/capacitaciones'
import { eliminarRegistro, urlCertificado } from './acciones'

export interface RegistroFila {
  id: string
  usuario_nombre: string
  usuario_codigo: string | null
  capacitacion_nombre: string
  certifica: boolean
  fecha_realizada: string
  fecha_vence: string | null
  horas: number | null
  certificado_path: string | null
  puedeEditar: boolean
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function TablaRegistros({ registros, hoy, puedeGestionar }: {
  registros: RegistroFila[]
  hoy: string
  puedeGestionar: boolean
}) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')

  const conVigencia = useMemo(() => registros.map(r => ({
    ...r,
    vig: r.fecha_vence ? calcularVigencia(r.fecha_vence, hoy).vigencia : ('sin_fecha' as Vigencia),
  })), [registros, hoy])

  const vis = useMemo(() => {
    const qn = norm(q.trim())
    return conVigencia.filter(r => {
      if (estado && r.vig !== estado) return false
      if (qn && !norm(`${r.usuario_nombre} ${r.usuario_codigo ?? ''} ${r.capacitacion_nombre}`).includes(qn)) return false
      return true
    })
  }, [conVigencia, q, estado])

  async function abrirCert(path: string) {
    const res = await urlCertificado(path)
    if (res.ok && res.url) window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="hstack" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="ca-input" placeholder="Buscar persona o capacitación…" value={q}
          onChange={e => setQ(e.target.value)} style={{ minWidth: 220, flex: 1, maxWidth: 320 }} />
        <select className="ca-select" value={estado} onChange={e => setEstado(e.target.value)} style={{ maxWidth: 170 }}>
          <option value="">Toda vigencia</option>
          <option value="vencido">Vencidas</option>
          <option value="por_vencer">Por vencer</option>
          <option value="vigente">Vigentes</option>
          <option value="sin_fecha">Sin vencimiento</option>
        </select>
        <span style={{ fontSize: 12.5, color: 'var(--text-3)', marginLeft: 'auto', alignSelf: 'center' }}>{vis.length} de {registros.length}</span>
      </div>

      <section className="card card--table">
        <div className="table-scroll">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Capacitación</th>
                <th style={{ width: 110 }}>Realizada</th>
                <th style={{ width: 120 }}>Vence</th>
                <th style={{ width: 120 }}>Vigencia</th>
                <th style={{ width: 90, textAlign: 'center' }}>Cert.</th>
                {puedeGestionar && <th style={{ width: 50 }} />}
              </tr>
            </thead>
            <tbody>
              {vis.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="row-title">{r.usuario_nombre}</div>
                    {r.usuario_codigo && <div className="row-sub text-mono">{r.usuario_codigo}</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>{r.capacitacion_nombre}</td>
                  <td className="text-mono" style={{ fontSize: 12.5 }}>{fFechaCorta(r.fecha_realizada)}</td>
                  <td className="text-mono" style={{ fontSize: 12.5 }}>{fFechaCorta(r.fecha_vence)}</td>
                  <td>
                    {r.fecha_vence
                      ? <span className={`badge ${badgeVigencia[r.vig]}`}>{etiquetaVigencia[r.vig]}</span>
                      : <span className="text-muted text-sm">No vence</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {r.certificado_path
                      ? <button type="button" className="btn btn--ghost btn--sm" title="Ver certificado" onClick={() => abrirCert(r.certificado_path!)}>
                          <Icono nombre="download" className="icon icon--sm" />
                        </button>
                      : <span className="text-muted">—</span>}
                  </td>
                  {puedeGestionar && (
                    <td style={{ textAlign: 'right' }}>
                      {r.puedeEditar && (
                        <button type="button" className="btn btn--ghost btn--sm" title="Eliminar" disabled={pendiente}
                          onClick={() => { if (confirm('¿Eliminar este registro?')) startTransition(async () => { await eliminarRegistro(r.id); router.refresh() }) }}>
                          <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {vis.length === 0 && (
                <tr><td colSpan={puedeGestionar ? 7 : 6} style={{ textAlign: 'center', padding: 28, color: 'var(--text-3)', fontSize: 13 }}>
                  Ningún registro coincide con los filtros.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
