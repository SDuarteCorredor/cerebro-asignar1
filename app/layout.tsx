import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cerebro Asignar',
  description: 'Repositorio centralizado de procesos y procedimientos de Asignar SAS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
