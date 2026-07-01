export default function LoadingDashboard() {
  return (
    <div className="page fade-up">
      <div style={{ marginBottom: 36 }}>
        <div className="skeleton skeleton--badge" style={{ marginBottom: 10 }} />
        <div className="skeleton skeleton--title" style={{ width: '30%', marginBottom: 12 }} />
        <div className="skeleton skeleton--text" style={{ width: '35%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 46, borderRadius: 12 }} />
      </div>

      <div className="grid-stats" style={{ marginBottom: 36 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div className="skeleton skeleton--badge" style={{ marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 6 }} />
            <div className="skeleton skeleton--text" style={{ width: '60%' }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 40 }}>
        <div className="section-header">
          <div className="skeleton" style={{ height: 22, width: 180 }} />
          <div className="skeleton" style={{ height: 14, width: 80 }} />
        </div>
        <div className="grid-cards">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--card" style={{ height: 180 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
