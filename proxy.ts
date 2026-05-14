import { type NextRequest } from 'next/server'
import { actualizarSesion } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await actualizarSesion(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
