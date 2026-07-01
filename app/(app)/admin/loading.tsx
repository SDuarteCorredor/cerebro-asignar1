export default function LoadingAdmin() {
  return (
    <div className="page fade-up">
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton skeleton--badge" style={{ marginBottom: 10 }} />
        <div className="skeleton skeleton--title" style={{ marginBottom: 12 }} />
        <div className="skeleton skeleton--text" style={{ width: '55%' }} />
      </div>

      <div className="hstack" style={{ gap: 8, marginBottom: 24 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 40, width: 140, borderRadius: 10 }} />
        ))}
      </div>

      <div className="card card--table">
        <div style={{ padding: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--row" style={{ marginBottom: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
