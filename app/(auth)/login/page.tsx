import Link from 'next/link'
import FormularioLogin from './FormularioLogin'

export default function PaginaLogin() {
  return (
    <div className="login-grid">
      {/* Columna izquierda: formulario */}
      <div className="login-form-col">
        <div className="hstack" style={{ gap: 12 }}>
          <div className="sidebar__logo-mark" style={{ width: 36, height: 36, fontSize: 16 }}>A</div>
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
        background: 'linear-gradient(155deg, oklch(0.32 0.10 250) 0%, oklch(0.40 0.13 250) 55%, oklch(0.55 0.14 30) 130%)',
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
