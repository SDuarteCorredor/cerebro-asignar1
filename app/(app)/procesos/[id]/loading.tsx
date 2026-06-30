export default function LoadingProceso() {
  return (
    <div className="page fade-up">
      <div className="section-header" style={{ alignItems: 'flex-start', gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div className="hstack" style={{ gap: 10, marginBottom: 14 }}>
            <div className="skeleton" style={{ width: 22, height: 22, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 14, width: 120 }} />
          </div>
          <div className="skeleton skeleton--title" style={{ width: '50%', marginBottom: 14 }} />
          <div className="hstack" style={{ gap: 12 }}>
            <div className="skeleton" style={{ height: 14, width: 100 }} />
            <div className="skeleton" style={{ height: 14, width: 80 }} />
            <div className="skeleton" style={{ height: 14, width: 90 }} />
          </div>
        </div>
      </div>

      <div className="layout-main-aside">
        <div className="vstack" style={{ gap: 24 }}>
          <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)' }} />
        </div>
        <div className="vstack" style={{ gap: 14 }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />
        </div>
      </div>
    </div>
  )
}
