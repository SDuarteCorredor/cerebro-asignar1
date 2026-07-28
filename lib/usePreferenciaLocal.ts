'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

const EVENTO = 'preferencia-local'

function suscribir(callback: () => void) {
  // 'storage' solo dispara en otras pestañas; el evento propio cubre esta misma.
  window.addEventListener('storage', callback)
  window.addEventListener(EVENTO, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(EVENTO, callback)
  }
}

/** Preferencia de vista guardada en localStorage (orden de grupos, plegados…).
 *
 *  Se lee con useSyncExternalStore en vez de un efecto: el servidor renderiza
 *  siempre el valor por defecto y el navegador reconcilia sin renders en
 *  cascada ni desajuste de hidratación.
 *
 *  `validar` filtra valores corruptos o de una versión anterior del componente.
 */
export function usePreferenciaLocal<T>(
  llave: string,
  porDefecto: T,
  validar: (v: unknown) => v is T,
): [T, (valor: T) => void] {
  const leer = useCallback(() => {
    try { return localStorage.getItem(llave) } catch { return null }
  }, [llave])

  // El snapshot es el string crudo: comparable por identidad, así que
  // useSyncExternalStore no entra en bucle.
  const crudo = useSyncExternalStore(suscribir, leer, () => null)

  const valor = useMemo(() => {
    if (crudo === null) return porDefecto
    try {
      const parsed = JSON.parse(crudo) as unknown
      return validar(parsed) ? parsed : porDefecto
    } catch {
      return porDefecto
    }
  }, [crudo, porDefecto, validar])

  const guardar = useCallback((nuevo: T) => {
    try {
      localStorage.setItem(llave, JSON.stringify(nuevo))
      window.dispatchEvent(new Event(EVENTO))
    } catch { /* modo privado o cuota llena: la preferencia simplemente no persiste */ }
  }, [llave])

  return [valor, guardar]
}
