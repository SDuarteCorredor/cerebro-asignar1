'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { agregarVersion, actualizarMetadata, eliminarPolitica } from '@/app/(app)/politicas/acciones'

const CATEGORIAS = ['Reglamento', 'Política', 'Manual', 'Circular', 'Código'] as const

interface Politica {
  id: string
  nombre: string
  categoria: string
  descripcion: string | null
  version_actual: string
  activo: boolean
  numVersiones: number
}

export default function FilaAdmin({ politica }: { politica: Politica }) {
  const [modo, setModo] = useState<'idle' | 'version' | 'editar'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <tr>
      <td>
        <div className="row-title">{politica.nombre}</div>
        {politica.descripcion && <div className="row-sub" style={{ maxWidth: 380 }}>{politica.descripcion}</div>}
      </td>
      <td><span className="badge badge--neutral badge--no-dot">{politica.categoria}</span></td>
      <td style={{ fontFamily: 'var(--font-mono)' }}>v{politica.version_actual}</td>
      <td style={{ textAlign: 'center' }}>{politica.numVersiones}</td>
      <td>
        {politica.activo
          ? <span className="badge badge--success">Activo</span>
          : <span className="badge badge--danger">Inactivo</span>}
      </td>
      <td>
        <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setModo('version'); setError(null) }}>+ Versión</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setModo('editar'); setError(null) }}>Editar</button>
          <button
            className="btn btn--ghost btn--sm"
            style={{ color: 'var(--danger-ink)' }}
            disabled={isPending}
            onClick={() => startTransition(async () => {
              if (!confirm(`¿Eliminar definitivamente "${politica.nombre}" y todas sus versiones?`)) return
              const res = await eliminarPolitica(politica.id)
              if (res.error) alert(res.error)
              else router.refresh()
            })}
          >Eliminar</button>
        </div>

        {modo === 'version' && (
          <FormularioSuperpuesto titulo="Subir nueva versión" onClose={() => setModo('idle')}>
            <form
              action={(fd) => startTransition(async () => {
                setError(null)
                fd.append('politica_id', politica.id)
                const res = await agregarVersion(fd)
                if (res.error) setError(res.error)
                else { setModo('idle'); router.refresh() }
              })}
              style={{ display: 'grid', gap: 10 }}
            >
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Versión*</div>
                <input name="version" required placeholder="Ej. 2.0" className="input" />
              </label>
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Resumen del cambio</div>
                <input name="resumen" placeholder="Qué se actualizó" className="input" />
              </label>
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Archivo*</div>
                <input name="archivo" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf" className="input" />
              </label>
              {error && <div style={{ padding: 8, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12 }}>{error}</div>}
              <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModo('idle')}>Cancelar</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>{isPending ? 'Subiendo…' : 'Guardar versión'}</button>
              </div>
            </form>
          </FormularioSuperpuesto>
        )}

        {modo === 'editar' && (
          <FormularioSuperpuesto titulo="Editar metadata" onClose={() => setModo('idle')}>
            <form
              action={(fd) => startTransition(async () => {
                setError(null)
                fd.append('id', politica.id)
                const res = await actualizarMetadata(fd)
                if (res.error) setError(res.error)
                else { setModo('idle'); router.refresh() }
              })}
              style={{ display: 'grid', gap: 10 }}
            >
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Nombre*</div>
                <input name="nombre" required defaultValue={politica.nombre} className="input" />
              </label>
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Categoría*</div>
                <select name="categoria" required defaultValue={politica.categoria} className="input">
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Descripción</div>
                <textarea name="descripcion" defaultValue={politica.descripcion ?? ''} className="input" rows={2} style={{ resize: 'vertical' }} />
              </label>
              <label className="hstack" style={{ gap: 6, fontSize: 13 }}>
                <input name="activo" type="checkbox" defaultChecked={politica.activo} />
                <span>Documento activo (visible para todos)</span>
              </label>
              {error && <div style={{ padding: 8, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12 }}>{error}</div>}
              <div className="hstack" style={{ gap: 6, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setModo('idle')}>Cancelar</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>{isPending ? 'Guardando…' : 'Guardar'}</button>
              </div>
            </form>
          </FormularioSuperpuesto>
        )}
      </td>
    </tr>
  )
}

function FormularioSuperpuesto({ titulo, onClose, children }: {
  titulo: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'grid', placeItems: 'center', zIndex: 100, padding: 16,
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: 520, width: '100%', padding: 22,
      }} onClick={e => e.stopPropagation()}>
        <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{titulo}</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
