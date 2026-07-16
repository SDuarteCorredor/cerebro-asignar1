import Link from 'next/link'
import FormularioLogin from './FormularioLogin'

export default function PaginaLogin() {
  return (
    <div className="login-grid">
      {/* Columna izquierda: formulario */}
      <div className="login-form-col">
        <div className="hstack" style={{ gap: 12 }}>
          <div className="sidebar__logo-mark" style={{ width: 36, height: 36 }}>
            <svg viewBox="0 0 2000 2000" width="22" height="22" aria-hidden="true">
              <g>
                <circle fill="currentColor" cx="608.46" cy="734.33" r="101.45"/>
                <path fill="currentColor" d="M746.74,949.1v207.53c0,9.97-4.35,19.45-11.9,25.95l-87.45,75.27c-6.21,5.35-14.14,8.29-22.34,8.29h-52.99c-56.02,0-101.86-45.84-101.86-101.86v-215.19c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <circle fill="currentColor" cx="1391.54" cy="733.65" r="101.45"/>
                <path fill="currentColor" d="M1529.81,948.42v215.19c0,56.02-45.84,101.86-101.86,101.86h-53.81c-8.2,0-16.13-2.94-22.34-8.29l-86.63-74.56c-7.56-6.51-11.91-15.98-11.91-25.96v-208.25c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <circle fill="currentColor" cx="1000.34" cy="674.63" r="101.45"/>
                <path fill="currentColor" d="M1138.62,887.77v120.11c0,29.29-34.39,45.06-56.59,25.95l-29.45-25.35c-30.26-26.03-75.03-26.03-105.28,0l-28.63,24.65c-22.2,19.11-56.59,3.34-56.59-25.95v-119.41c0-56.02,45.84-101.86,101.86-101.86h72.82c56.02,0,101.86,45.84,101.86,101.86Z"/>
                <path fill="currentColor" d="M1278.53,1426.82h-557.19c-63.53,0-92.82-78.97-44.67-120.41l15.06-12.97,33.69-28.98,157.49-135.58,72.35-62.28c25.69-22.12,63.69-22.12,89.38,0l73.04,62.87,158.04,136.05,31.99,27.53h.01l15.49,13.35c48.15,41.44,18.85,120.41-44.68,120.41Z"/>
              </g>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>Cerebro Asignar</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asignar SAS</div>
          </div>
        </div>

        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }} className="fade-up">
          <div className="page__eyebrow">Bienvenida de vuelta</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Ingresa a tu cuenta
          </h1>
          <p style={{ color: 'var(--text-3)', margin: '0 0 28px', fontSize: 14.5 }}>
            Consulta los procesos y procedimientos de cada Gestión de Asignar.
          </p>
          <FormularioLogin />
          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 28, textAlign: 'center' }}>
            ¿Primera vez aquí?{' '}
            <Link href="/activar" style={{ color: 'var(--primary)', fontWeight: 600 }}>Activa tu cuenta</Link>
          </p>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Asignar SAS</span>
          <span>Soporte: <span style={{ color: 'var(--text-2)' }}>tecnologia@asignar.com.co</span></span>
        </div>
      </div>

      {/* Columna derecha: visual (oculta en móvil) */}
      <div className="login-visual-col" style={{
        position: 'relative',
        background: 'linear-gradient(155deg, #001233 0%, #0056B3 55%, #007AFE 130%)',
        color: 'white',
        padding: '60px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        {/* Grilla sutil */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.13, pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div style={{ position: 'relative', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>
          Repositorio de Procesos · MVP
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, maxWidth: 520, marginBottom: 18 }}>
            Una sola fuente de verdad para cada Gestión de Asignar.
          </div>
          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 460, lineHeight: 1.5 }}>
            Encuentra, consulta y mantén actualizados los procesos y procedimientos de Comercial, Selección, Servicio y Programación, Vinculación, Compensación, Seguridad Social, SST, Jurídica y Tecnología.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 36, maxWidth: 520 }}>
            {[
              { num: '9', etiqueta: 'Gestiones' },
              { num: '—', etiqueta: 'Procesos publicados' },
              { num: '—', etiqueta: 'Pasos documentados' },
            ].map((s) => (
              <div key={s.etiqueta} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                padding: '16px 18px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.num}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{s.etiqueta}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 13, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>
          ASIGNAR / SERVICIOS DE PERSONAL · BOGOTÁ · COLOMBIA
        </div>
      </div>
    </div>
  )
}
