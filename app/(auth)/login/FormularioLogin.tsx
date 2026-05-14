'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

export default function FormularioLogin() {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function ingresar(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')

    const { error: errAuth } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    })

    if (errAuth) {
      setError('Correo o contraseña incorrectos. Verifica e intenta de nuevo.')
      setCargando(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={ingresar} className="vstack" style={{ gap: 16 }}>
      {error && (
        <div style={{
          background: 'var(--danger-soft)',
          color: 'var(--danger-ink)',
          border: '1px solid',
          borderColor: 'var(--danger)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 13.5,
        }}>
          {error}
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="correo">Correo corporativo</label>
        <input
          id="correo"
          className="ca-input ca-input--lg"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="nombre.apellido@asignar.com.co"
          required
          autoComplete="email"
        />
      </div>

      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="field__label" htmlFor="contrasena">Contraseña</label>
          <Link
            href="/recuperar-contrasena"
            style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="contrasena"
          className="ca-input ca-input--lg"
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button
        className="btn btn--primary btn--lg btn--block"
        type="submit"
        disabled={cargando}
        style={{ marginTop: 4 }}
      >
        {cargando ? 'Ingresando…' : 'Ingresar'}
        {!cargando && <Icono nombre="arrowRight" className="icon icon--sm" />}
      </button>
    </form>
  )
}
