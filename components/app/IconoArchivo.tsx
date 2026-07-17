const colores: Record<string, { bg: string; fg: string }> = {
  pdf: { bg: '#F8E6E1', fg: '#B83E1D' },
  docx: { bg: '#E8EFF9', fg: '#1A4990' },
  xlsx: { bg: '#D8F0DE', fg: '#217A40' },
  pptx: { bg: '#F5EDDF', fg: '#A06C14' },
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
