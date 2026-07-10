import Link from 'next/link'
import FormularioActivar from './FormularioActivar'

export const metadata = { title: 'Activar mi cuenta · Cerebro Asignar' }

export default function PaginaActivar() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      padding: '32px 24px', gap: 32,
    }}>
      <div className="hstack" style={{ gap: 12 }}>
        <div className="sidebar__logo-mark" style={{ width: 36, height: 36, fontSize: 16 }}>A</div>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '-0.01em' }}>Cerebro Asignar</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asignar SAS</div>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 400, width: '100%' }} className="fade-up">
          <div className="page__eyebrow">Primera vez aquí</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Activa tu cuenta
          </h1>
          <p style={{ color: 'var(--text-3)', margin: '0 0 28px', fontSize: 14.5, lineHeight: 1.5 }}>
            Ya tenemos tu información en Cerebro. Confirma tu identidad y elige la
            contraseña con la que vas a ingresar.
          </p>

          <FormularioActivar />

          <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 28, textAlign: 'center' }}>
            ¿Ya activaste tu cuenta?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Ingresar</Link>
          </p>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
        ¿Problemas? Escribe a <a href="mailto:tecnologia@asignar.com.co" style={{ color: 'var(--primary)' }}>tecnologia@asignar.com.co</a>
      </div>
    </div>
  )
}
