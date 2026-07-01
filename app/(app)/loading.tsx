export default function Loading() {
  return (
    <div className="page fade-up">
      <div style={{ marginBottom: 28 }}>
        <div className="skeleton skeleton--badge" style={{ marginBottom: 10 }} />
        <div className="skeleton skeleton--title" style={{ marginBottom: 12 }} />
        <div className="skeleton skeleton--text" style={{ width: '50%' }} />
      </div>
      <div className="grid-cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton--card" />
        ))}
      </div>
    </div>
  )
}
