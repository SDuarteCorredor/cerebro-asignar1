'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearAusencia } from '../acciones'

interface Tipo {
  id: string
  nombre: string
  requiere_soporte: boolean
  requiere_doble_validacion: boolean
}

export default function FormAusencia({
  tipos, datos,
}: {
  tipos: Tipo[]
  datos: {
    nombre: string
    documento: string | null
    cargo: string | null
    gestion: string | null
    jefe: string | null
    ciudad: string | null
  }
}) {
  const [tipoId, setTipoId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const hoy = new Date().toISOString().slice(0, 10)

  const tipo = tipos.find(t => t.id === tipoId)
  const esDiligencia = tipo?.nombre === 'Diligencias personales'

  return (
    <form
      className="card"
      style={{ padding: 22 }}
      action={(fd) => startTransition(async () => {
        setError(null)
        const res = await crearAusencia(fd)
        if (res.error) setError(res.error)
        else router.push('/ausencias')
      })}
    >
      {/* Datos autocompletados desde el perfil (solo lectura) */}
      <div className="callout" style={{ marginBottom: 18, padding: 14, background: 'var(--surface-sunken)', borderRadius: 8 }}>
        <div className="page__eyebrow" style={{ marginBottom: 8 }}>Tus datos (desde tu perfil)</div>
        <div className="dl-grid dl-grid--2col" style={{ fontSize: 12.5 }}>
          <div><dt className="dl-label">Nombre</dt><dd className="dl-value">{datos.nombre}</dd></div>
          <div><dt className="dl-label">Documento</dt><dd className="dl-value">{datos.documento ?? '—'}</dd></div>
          <div><dt className="dl-label">Cargo</dt><dd className="dl-value">{datos.cargo ?? '—'}</dd></div>
          <div><dt className="dl-label">Gestión</dt><dd className="dl-value">{datos.gestion ?? '—'}</dd></div>
          <div><dt className="dl-label">Jefe inmediato</dt><dd className="dl-value">{datos.jefe ?? 'Sin jefe asignado'}</dd></div>
          <div><dt className="dl-label">Ciudad</dt><dd className="dl-value">{datos.ciudad ?? '—'}</dd></div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          Si algún dato está incorrecto, avisa a Talento Humano. Estos datos se toman automáticamente para evitar errores.
        </div>
      </div>

      <div className="grid-2col" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Tipo de ausencia*</div>
          <select name="tipo_id" required className="input" value={tipoId} onChange={e => setTipoId(e.target.value)}>
            <option value="">Selecciona…</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Horario*</div>
          <select name="horario" required defaultValue="TODO EL DÍA" className="input">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
            <option value="TODO EL DÍA">Todo el día</option>
          </select>
        </label>
      </div>

      <div className="grid-2col" style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Desde*</div>
          <input name="fecha_desde" type="date" required defaultValue={hoy} className="input" />
        </label>
        <label style={{ fontSize: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Hasta*</div>
          <input name="fecha_hasta" type="date" required defaultValue={hoy} className="input" />
        </label>
      </div>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Especifica el horario que estarás ausente (opcional)</div>
        <input name="horario_detalle" className="input" placeholder="Ej. 8:00 a 11:00 am" />
      </label>

      {esDiligencia && (
        <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
          <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>¿Qué diligencia?</div>
          <input name="diligencia_detalle" className="input" placeholder="Especifica la diligencia personal" />
        </label>
      )}

      <label style={{ fontSize: 12, display: 'block', marginBottom: 14 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>Observaciones</div>
        <textarea name="observaciones" className="input" rows={3} style={{ resize: 'vertical' }} placeholder="Contexto adicional para tu jefe" />
      </label>

      <label style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-3)' }}>
          Soporte {tipo?.requiere_soporte ? '(requerido para este tipo)*' : '(opcional)'}
        </div>
        <input name="soporte" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif" className="input"
          required={tipo?.requiere_soporte} />
      </label>

      {tipo?.requiere_doble_validacion && (
        <div style={{ padding: 10, background: 'var(--warning-soft)', color: 'var(--warning-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 14 }}>
          Este tipo requiere doble validación: primero tu jefe, luego un segundo aprobador.
        </div>
      )}

      {!datos.jefe && (
        <div style={{ padding: 10, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 14 }}>
          No tienes un jefe inmediato asignado. La solicitud se creará, pero no podrá ser aprobada hasta que Talento Humano te asigne uno.
        </div>
      )}

      {error && (
        <div style={{ padding: 10, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 6, fontSize: 12.5, marginBottom: 14 }}>{error}</div>
      )}

      <div className="hstack" style={{ gap: 8, justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn--primary" disabled={isPending}>
          {isPending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  )
}
