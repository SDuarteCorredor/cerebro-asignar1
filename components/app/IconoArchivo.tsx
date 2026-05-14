const colores: Record<string, { bg: string; fg: string }> = {
  pdf: { bg: 'oklch(0.96 0.04 25)', fg: 'oklch(0.50 0.16 25)' },
  docx: { bg: 'oklch(0.95 0.04 250)', fg: 'oklch(0.42 0.13 250)' },
  xlsx: { bg: 'oklch(0.94 0.05 145)', fg: 'oklch(0.45 0.13 145)' },
  pptx: { bg: 'oklch(0.96 0.05 50)', fg: 'oklch(0.55 0.14 50)' },
}

export default function IconoArchivo({ tipo }: { tipo: string }) {
  const c = colores[tipo.toLowerCase()] ?? colores.pdf
  return (
    <div
      style={{
        width: 36, height: 40, borderRadius: 6,
        background: c.bg, color: c.fg,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 9, fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {tipo.toLowerCase()}
    </div>
  )
}
