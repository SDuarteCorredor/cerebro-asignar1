'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

type Respuesta = { ok: boolean; nombre?: string; error?: string }

export default function FormularioActivar() {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  const [paso, setPaso] = useState<1 | 2>(1)
  const [documento, setDocumento] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [nombreEnmascarado, setNombreEnmascarado] = useState('')

  const [correo, setCorreo] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function validarIdentidad(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true); setError('')
    const { data, error: errRpc } = await supabase.rpc('validar_identidad_registro', {
      p_documento: documento.trim(),
      p_fecha_nac: fechaNac,
    })
    setCargando(false)
    if (errRpc) { setError('No pudimos validar tus datos. Intenta de nuevo.'); return }
    const r = data as Respuesta
    if (!r.ok) { setError(r.error ?? 'No pudimos validar tus datos.'); return }
    setNombreEnmascarado(r.nombre ?? '')
    setPaso(2)
  }

  async function completarRegistro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (pass !== pass2) { setError('Las contraseñas no coinciden.'); return }
    if (pass.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }

    setCargando(true)
    const { data, error: errRpc } = await supabase.rpc('completar_registro', {
      p_documento: documento.trim(),
      p_fecha_nac: fechaNac,
      p_correo: correo.trim().toLowerCase(),
      p_password: pass,
    })
    if (errRpc) { setCargando(false); setError('No pudimos crear tu cuenta. Intenta de nuevo.'); return }
    const r = data as Respuesta
    if (!r.ok) { setCargando(false); setError(r.error ?? 'No pudimos crear tu cuenta.'); return }

    // Cuenta creada: iniciamos sesión de una vez
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: pass,
    })
    setCargando(false)
    if (errLogin) { setError('Tu cuenta quedó creada. Ingresa desde la pantalla de inicio de sesión.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      {error && (
        <div style={{
          background: 'var(--danger-soft)', color: 'var(--danger-ink)',
          border: '1px solid var(--danger)', borderRadius: 8,
          padding: '10px 14px', fontSize: 13.5, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* Indicador de paso */}
      <div className="hstack" style={{ gap: 8, marginBottom: 18, fontSize: 12, color: 'var(--text-3)' }}>
        <span style={{ fontWeight: 700, color: paso === 1 ? 'var(--primary)' : 'var(--success-ink)' }}>
          {paso === 2 ? '✓' : '1'} Identidad
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontWeight: 700, color: paso === 2 ? 'var(--primary)' : 'var(--text-3)' }}>2 Contraseña</span>
      </div>

      {paso === 1 ? (
        <form onSubmit={validarIdentidad} className="vstack" style={{ gap: 16 }}>
          <div className="field">
            <label className="field__label" htmlFor="documento">Número de cédula</label>
            <input
              id="documento" className="ca-input ca-input--lg" type="text" inputMode="numeric"
              value={documento} onChange={e => setDocumento(e.target.value)}
              placeholder="Sin puntos ni comas" required autoComplete="off"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="fechaNac">Fecha de nacimiento</label>
            <input
              id="fechaNac" className="ca-input ca-input--lg" type="date"
              value={fechaNac} onChange={e => setFechaNac(e.target.value)} required
            />
          </div>
          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={cargando}>
            {cargando ? 'Validando…' : 'Continuar'}
            {!cargando && <Icono nombre="arrowRight" className="icon icon--sm" />}
          </button>
        </form>
      ) : (
        <form onSubmit={completarRegistro} className="vstack" style={{ gap: 16 }}>
          <div style={{
            background: 'var(--success-soft)', border: '1px solid var(--success)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: 'var(--success-ink)',
          }}>
            Te identificamos como <strong>{nombreEnmascarado}</strong>. Si no eres tú,{' '}
            <button type="button" onClick={() => { setPaso(1); setError('') }}
              style={{ background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>
              vuelve atrás
            </button>.
          </div>

          <div className="field">
            <label className="field__label" htmlFor="correo">Correo institucional</label>
            <input
              id="correo" className="ca-input ca-input--lg" type="email"
              value={correo} onChange={e => setCorreo(e.target.value)}
              placeholder="nombre.apellido@asignar.com.co" required autoComplete="email"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pass">Crea tu contraseña</label>
            <input
              id="pass" className="ca-input ca-input--lg" type="password"
              value={pass} onChange={e => setPass(e.target.value)}
              required minLength={8} autoComplete="new-password"
            />
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Mínimo 8 caracteres.</div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pass2">Confirma tu contraseña</label>
            <input
              id="pass2" className="ca-input ca-input--lg" type="password"
              value={pass2} onChange={e => setPass2(e.target.value)}
              required autoComplete="new-password"
            />
          </div>
          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={cargando}>
            {cargando ? 'Creando tu cuenta…' : 'Activar cuenta e ingresar'}
          </button>
        </form>
      )}
    </>
  )
}
