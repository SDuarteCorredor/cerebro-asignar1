export default function LoadingGestion() {
  return (
    <div className="page fade-up">
      <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 28 }} />

      <div className="hstack" style={{ gap: 8, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 34, width: 90, borderRadius: 999 }} />
        ))}
      </div>

      <div className="card card--table">
        <div style={{ padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--row" style={{ marginBottom: 8 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
