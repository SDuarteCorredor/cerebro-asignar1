import { redirect } from 'next/navigation'

// El tablero ahora vive embebido en /comites (siempre visible).
export default function TableroRedirect() {
  redirect('/comites')
}
