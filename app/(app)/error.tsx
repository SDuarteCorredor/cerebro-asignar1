'use client'

import Icono from '@/components/app/Icono'

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page fade-up" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div className="icon-circle" style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: 'var(--danger-soft)', color: 'var(--danger-ink)' }}>
          <Icono nombre="info" className="icon icon--lg" />
        </div>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Algo salió mal</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 20, lineHeight: 1.5 }}>
          Ocurrió un error inesperado al cargar esta página. Intenta de nuevo o vuelve al inicio.
        </p>
        <div className="hstack" style={{ gap: 10, justifyContent: 'center' }}>
          <button onClick={reset} className="btn btn--primary btn--sm">
            <Icono nombre="history" className="icon icon--sm" /> Reintentar
          </button>
          <a href="/dashboard" className="btn btn--sm">
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
