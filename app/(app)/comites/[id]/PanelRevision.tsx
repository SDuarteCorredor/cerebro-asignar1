'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { marcarEstado } from '../acciones'
import { BADGE_IMPACTO, ETIQUETA_IMPACTO, type Impacto } from '@/lib/comites/puntaje'

interface CompRev {
  id: string
  responsable_id: string
  responsable_nombre: string
  descripcion: string
  fecha_limite: string | null
  estado: string
  impacto: string
  autorreporte_nota: string | null
  notas_revision: string | null
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

export default function PanelRevision({
  comiteActualId, compromisos, editable,
}: {
  comiteActualId: string
  compromisos: CompRev[]
  editable: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function marcar(compromisoId: string, estado: 'cumplido' | 'no_cumplido' | 'arrastrado' | 'pendiente') {
    startTransition(async () => {
      const res = await marcarEstado({
        compromiso_id: compromisoId,
        comite_id: comiteActualId,
        estado,
        revisado_en_id: estado === 'pendiente' ? null : comiteActualId,
      })
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="vstack" style={{ gap: 8 }}>
      {compromisos.map(c => {
        const sinConfirmar = c.estado === 'pendiente' || c.estado === 'reportado'
        const imp = (c.impacto ?? 'medio') as Impacto
        return (
          <div key={c.id} className="hstack" style={{
            gap: 12, padding: 12, borderRadius: 8, alignItems: 'flex-start',
            background: c.estado === 'reportado' ? 'var(--primary-soft)'
              : c.estado === 'pendiente' ? 'var(--warning-soft)' : 'var(--surface-sunken)',
            border: c.estado === 'reportado' ? '1px solid var(--primary)'
              : c.estado === 'pendiente' ? '1px solid var(--warning)' : '1px solid var(--border)',
          }}>
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
                  Autorreporte: {c.autorreporte_nota}
                </div>
              )}
              {c.notas_revision && (
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 4 }}>
                  Revisión: {c.notas_revision}
                </div>
              )}
            </div>
            {editable && (
              <div className="hstack" style={{ gap: 4, flexShrink: 0 }}>
                <button
                  className="btn btn--ghost btn--sm"
                  title="Confirmar cumplido"
                  disabled={isPending}
                  onClick={() => marcar(c.id, 'cumplido')}
                  style={{ background: c.estado === 'cumplido' ? 'var(--success)' : undefined, color: c.estado === 'cumplido' ? 'var(--on-primary)' : undefined }}
                >✓</button>
                <button
                  className="btn btn--ghost btn--sm"
                  title="Confirmar no cumplido"
                  disabled={isPending}
                  onClick={() => marcar(c.id, 'no_cumplido')}
                  style={{ background: c.estado === 'no_cumplido' ? 'var(--danger)' : undefined, color: c.estado === 'no_cumplido' ? 'var(--on-primary)' : undefined }}
                >✗</button>
                <button
                  className="btn btn--ghost btn--sm"
                  title="Arrastrar a este comité"
                  disabled={isPending}
                  onClick={() => marcar(c.id, 'arrastrado')}
                  style={{ background: c.estado === 'arrastrado' ? 'var(--warning)' : undefined, color: c.estado === 'arrastrado' ? 'var(--on-primary)' : undefined }}
                >↷</button>
              </div>
            )}
          </div>
        )
      })}
      {editable && compromisos.some(c => c.estado === 'reportado') && (
        <p className="text-muted" style={{ fontSize: 11.5, margin: '2px 0 0' }}>
          Los compromisos en <strong style={{ color: 'var(--primary-ink)' }}>Reportado</strong> tienen autorreporte del colaborador pendiente de tu confirmación.
        </p>
      )}
    </div>
  )
}
