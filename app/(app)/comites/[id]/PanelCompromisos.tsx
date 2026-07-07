'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { agregarCompromiso, eliminarCompromiso, autorreportarCompromiso } from '../acciones'
import { BADGE_IMPACTO, ETIQUETA_IMPACTO, type Impacto } from '@/lib/comites/puntaje'

interface Comp {
  id: string
  responsable_id: string
  responsable_nombre: string
  descripcion: string
  fecha_limite: string | null
  estado: string
  impacto: string
  autorreporte_nota: string | null
}

const badge: Record<string, string> = {
  pendiente: 'badge--neutral',
  reportado: 'badge--primary',
  cumplido: 'badge--success',
  no_cumplido: 'badge--danger',
  arrastrado: 'badge--warning',
}
const etiquetaEstado: Record<string, string> = {
  pendiente: 'Pendiente',
  reportado: 'Reportado',
  cumplido: 'Cumplido',
  no_cumplido: 'No cumplido',
  arrastrado: 'Arrastrado',
}

export default function PanelCompromisos({
  comiteId, compromisos, asistentes, editable, sesionId,
}: {
  comiteId: string
  compromisos: Comp[]
  asistentes: { id: string; nombre: string }[]
  editable: boolean
  sesionId: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportando, setReportando] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="vstack" style={{ gap: 10 }}>
      {compromisos.length === 0 && (
        <p className="text-muted text-sm" style={{ margin: 0 }}>
          Todavía no hay compromisos en este comité.
        </p>
      )}
      {compromisos.map(c => {
        const esResponsable = c.responsable_id === sesionId
        const puedeReportar = esResponsable && (c.estado === 'pendiente' || c.estado === 'reportado')
        const imp = (c.impacto ?? 'medio') as Impacto
        return (
          <div key={c.id} className="vstack" style={{
            gap: 8, padding: 12, borderRadius: 8, background: 'var(--surface-sunken)',
            border: '1px solid var(--border)',
          }}>
            <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.descripcion}</div>
                <div className="hstack" style={{ gap: 8, marginTop: 4, fontSize: 11.5, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                  <span>{c.responsable_nombre}</span>
                  {c.fecha_limite && <span>· límite {c.fecha_limite}</span>}
                  <span className={`badge ${BADGE_IMPACTO[imp]}`} style={{ fontSize: 10.5 }}>Impacto {ETIQUETA_IMPACTO[imp]}</span>
                  <span className={`badge ${badge[c.estado]}`} style={{ fontSize: 10.5 }}>{etiquetaEstado[c.estado] ?? c.estado}</span>
                </div>
                {c.autorreporte_nota && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}>
                    Reporte: {c.autorreporte_nota}
                  </div>
                )}
              </div>
              {editable && c.estado === 'pendiente' && (
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={isPending}
                  style={{ color: 'var(--danger-ink)' }}
                  onClick={() => startTransition(async () => {
                    if (!confirm('¿Eliminar este compromiso?')) return
                    await eliminarCompromiso(c.id, comiteId)
                    router.refresh()
                  })}
                >×</button>
              )}
            </div>

            {/* Autorreporte del responsable */}
            {puedeReportar && (
              reportando === c.id ? (
                <div className="hstack" style={{ gap: 6 }}>
                  <input
                    className="input"
                    placeholder="Nota de avance (opcional)"
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button className="btn btn--primary btn--sm" disabled={isPending}
                    onClick={() => startTransition(async () => {
                      const res = await autorreportarCompromiso({ compromiso_id: c.id, comite_id: comiteId, nota })
                      if (res.error) alert(res.error)
                      else { setReportando(null); setNota(''); router.refresh() }
                    })}>Enviar reporte</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => { setReportando(null); setNota('') }}>Cancelar</button>
                </div>
              ) : (
                <div className="hstack" style={{ gap: 6, alignSelf: 'flex-start' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => { setReportando(c.id); setNota(c.autorreporte_nota ?? '') }}>
                    {c.estado === 'reportado' ? 'Editar mi reporte' : 'Reportar mi avance'}
                  </button>
                  {c.estado === 'reportado' && (
                    <button className="btn btn--ghost btn--sm" disabled={isPending}
                      onClick={() => startTransition(async () => {
                        const res = await autorreportarCompromiso({ compromiso_id: c.id, comite_id: comiteId, nota: '', deshacer: true })
                        if (res.error) alert(res.error)
                        else router.refresh()
                      })}>Deshacer</button>
                  )}
                </div>
              )
            )}
          </div>
        )
      })}

      {editable && (
        !abierto ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(true)} style={{ alignSelf: 'flex-start' }}>
            + Agregar compromiso
          </button>
        ) : (
          <form
            className="card"
            style={{ padding: 14, background: 'var(--surface)' }}
            action={(fd) => startTransition(async () => {
              setError(null)
              fd.append('comite_id', comiteId)
              const res = await agregarCompromiso(fd)
              if (res.error) setError(res.error)
              else {
                setAbierto(false)
                router.refresh()
              }
            })}
          >
            <div className="form-row-compromiso">
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Descripción*</div>
                <input name="descripcion" required className="input" placeholder="Qué se compromete a hacer" />
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Responsable*</div>
                <select name="responsable_id" required className="input" defaultValue="">
                  <option value="">—</option>
                  {asistentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Impacto*</div>
                <select name="impacto" required className="input" defaultValue="medio">
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Fecha límite</div>
                <input name="fecha_limite" type="date" className="input" />
              </label>
              <div className="hstack" style={{ gap: 4 }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>
                  {isPending ? '…' : 'Guardar'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ padding: 6, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 4, fontSize: 11.5, marginTop: 8 }}>
                {error}
              </div>
            )}
          </form>
        )
      )}
    </div>
  )
}
