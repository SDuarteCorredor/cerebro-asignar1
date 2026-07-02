'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearUsuarioPreregistro } from '../acciones'

interface Cargo { id: string; nombre: string; banda: string }
interface Gestion { id: string; nombre: string }
interface Jefe { id: string; nombre: string; codigo_contrato: string | null }

export default function FormNuevoUsuario({
  cargos, gestiones, posiblesJefes,
}: {
  cargos: Cargo[]
  gestiones: Gestion[]
  posiblesJefes: Jefe[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [warn, setWarn] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const cargosByBanda: Record<string, Cargo[]> = {}
  for (const c of cargos) {
    (cargosByBanda[c.banda] ??= []).push(c)
  }
  const bandasOrdenadas = ['B1', 'B2', 'B3', 'B4', 'B5'].filter(b => cargosByBanda[b])

  return (
    <form
      className="card"
      style={{ padding: 22 }}
      action={(fd) => startTransition(async () => {
        setError(null); setWarn(null)
        const res = await crearUsuarioPreregistro(fd)
        if (res.error) setError(res.error)
        else if (res.warn) { setWarn(res.warn); setTimeout(() => router.push(`/admin/usuarios/${res.id}`), 1500) }
        else router.push(`/admin/usuarios/${res.id}`)
      })}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Nombre completo*</div>
          <input name="nombre" required className="input" placeholder="Ej. María Gómez Rodríguez" />
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Correo corporativo*</div>
          <input name="correo" type="email" required className="input" placeholder="usuario@asignar.com.co" />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Rol*</div>
          <select name="rol" required defaultValue="colaborador" className="input">
            <option value="colaborador">Colaborador</option>
            <option value="lider">Líder</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Gestión</div>
          <select name="gestion_id" className="input">
            <option value="">Sin asignar</option>
            {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Código de contrato</div>
          <input name="codigo_contrato" className="input" placeholder="Ej. ASI473" />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Cargo</div>
          <select name="cargo_id" className="input">
            <option value="">Sin asignar</option>
            {bandasOrdenadas.map(b => (
              <optgroup key={b} label={b}>
                {cargosByBanda[b].map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Jefe directo</div>
          <select name="jefe_id" className="input">
            <option value="">Sin asignar</option>
            {posiblesJefes.map(j => (
              <option key={j.id} value={j.id}>{j.nombre}{j.codigo_contrato ? ` (${j.codigo_contrato})` : ''}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="hstack" style={{
        gap: 10, padding: 12, background: 'var(--surface-sunken)', borderRadius: 8, fontSize: 13, marginBottom: 14,
      }}>
        <input name="invitar" type="checkbox" defaultChecked />
        <div>
          <strong>Enviar invitación por correo</strong>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            El usuario recibe un enlace mágico para acceder sin contraseña. Al abrirlo queda vinculado a este registro.
          </div>
        </div>
      </label>

      {error && (
        <div style={{ padding: 10, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {warn && (
        <div style={{ padding: 10, background: 'var(--warning-soft)', color: 'var(--warning-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
          {warn}
        </div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}
