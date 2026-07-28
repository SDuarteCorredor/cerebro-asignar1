'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import GrupoPlegable from '@/components/app/GrupoPlegable'
import { usePreferenciaLocal } from '@/lib/usePreferenciaLocal'
import { badgePct, colorPct } from '@/lib/comites/puntaje'

export interface ActaFila {
  id: string
  gestion: string
  fecha: string
  semana_iso: number
  anio: number
  titulo: string | null
  cerrado: boolean
  total: number
  pct: number | null
}

type ClaveGrupo = 'abiertas' | 'cerradas'

const GRUPOS: Record<ClaveGrupo, { titulo: string; color: string; vacio: string }> = {
  abiertas: {
    titulo: 'Actas abiertas',
    color: 'var(--success)',
    vacio: 'No hay actas abiertas. Todo lo de esta semana está cerrado.',
  },
  cerradas: {
    titulo: 'Actas cerradas',
    color: 'var(--text-3)',
    vacio: 'Todavía no se ha cerrado ningún comité.',
  },
}

const ORDEN_INICIAL: ClaveGrupo[] = ['abiertas', 'cerradas']
const SIN_PLEGAR: ClaveGrupo[] = []
const LLAVE_ORDEN = 'comites:orden-grupos'
const LLAVE_PLEGADO = 'comites:grupos-plegados'

const esClave = (v: unknown): v is ClaveGrupo => typeof v === 'string' && v in GRUPOS
const esListaDeClaves = (v: unknown): v is ClaveGrupo[] => Array.isArray(v) && v.every(esClave)
/** Orden válido = misma cantidad y las mismas claves, sin repetidos ni sobrantes. */
const esOrden = (v: unknown): v is ClaveGrupo[] =>
  esListaDeClaves(v) && v.length === ORDEN_INICIAL.length && ORDEN_INICIAL.every(k => v.includes(k))

export default function ClienteActas({ actas, gestiones }: {
  actas: ActaFila[]
  /** Vacío cuando el usuario solo ve su propia gestión. */
  gestiones: string[]
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [gestion, setGestion] = useState('')
  const [anio, setAnio] = useState('')
  // El orden y el plegado son preferencia de quien mira, no del servidor.
  const [orden, guardarOrden] = usePreferenciaLocal(LLAVE_ORDEN, ORDEN_INICIAL, esOrden)
  const [plegados, guardarPlegados] = usePreferenciaLocal(LLAVE_PLEGADO, SIN_PLEGAR, esListaDeClaves)

  function alternar(clave: ClaveGrupo) {
    guardarPlegados(plegados.includes(clave) ? plegados.filter(k => k !== clave) : [...plegados, clave])
  }

  function mover(clave: ClaveGrupo, delta: number) {
    const i = orden.indexOf(clave)
    const j = i + delta
    if (i < 0 || j < 0 || j >= orden.length) return
    const nuevo = [...orden]
    ;[nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]]
    guardarOrden(nuevo)
  }

  const anios = useMemo(
    () => Array.from(new Set(actas.map(a => a.anio))).sort((x, y) => y - x),
    [actas],
  )

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return actas.filter(a => {
      if (gestion && a.gestion !== gestion) return false
      if (anio && String(a.anio) !== anio) return false
      if (!q) return true
      return (a.titulo ?? '').toLowerCase().includes(q)
        || a.gestion.toLowerCase().includes(q)
        || `w${a.semana_iso}`.includes(q)
        || a.fecha.includes(q)
    })
  }, [actas, busqueda, gestion, anio])

  const porGrupo: Record<ClaveGrupo, ActaFila[]> = useMemo(() => ({
    abiertas: filtradas.filter(a => !a.cerrado),
    cerradas: filtradas.filter(a => a.cerrado),
  }), [filtradas])

  const hayFiltro = busqueda.trim() !== '' || gestion !== '' || anio !== ''

  return (
    <>
      <div className="barra-filtros">
        <div className="barra-filtros__buscar">
          <Icono nombre="search" className="icon icon--sm" />
          <input
            className="input ca-input--sm"
            placeholder="Buscar por título, gestión, semana o fecha"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar actas"
          />
        </div>
        {gestiones.length > 1 && (
          <select
            className="input ca-select--sm" style={{ width: 'auto' }}
            value={gestion} onChange={e => setGestion(e.target.value)}
            aria-label="Filtrar por gestión"
          >
            <option value="">Todas las gestiones</option>
            {gestiones.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        {anios.length > 1 && (
          <select
            className="input ca-select--sm" style={{ width: 'auto' }}
            value={anio} onChange={e => setAnio(e.target.value)}
            aria-label="Filtrar por año"
          >
            <option value="">Todos los años</option>
            {anios.map(a => <option key={a} value={String(a)}>{a}</option>)}
          </select>
        )}
        {hayFiltro && (
          <button
            type="button" className="btn btn--ghost btn--sm"
            onClick={() => { setBusqueda(''); setGestion(''); setAnio('') }}
          >
            <Icono nombre="x" className="icon icon--sm" /> Limpiar
          </button>
        )}
        <span className="barra-filtros__resultado">
          {filtradas.length} de {actas.length} actas
        </span>
      </div>

      {orden.map((clave, i) => {
        const g = GRUPOS[clave]
        const filas = porGrupo[clave]
        return (
          <GrupoPlegable
            key={clave}
            titulo={g.titulo}
            color={g.color}
            conteo={filas.length}
            abierto={!plegados.includes(clave)}
            onAlternar={() => alternar(clave)}
            onSubir={() => mover(clave, -1)}
            onBajar={() => mover(clave, 1)}
            puedeSubir={i > 0}
            puedeBajar={i < orden.length - 1}
            vacio={hayFiltro ? 'Ningún acta de este grupo coincide con el filtro.' : g.vacio}
          >
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Semana</th>
                    {gestiones.length > 1 && <th style={{ width: 180 }}>Gestión</th>}
                    <th>Título</th>
                    <th style={{ width: 90, textAlign: 'center' }}>Compromisos</th>
                    <th style={{ width: 150 }}>Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(a => (
                    <tr
                      key={a.id}
                      className="fila-click"
                      tabIndex={0}
                      role="link"
                      aria-label={`Abrir acta W${a.semana_iso}/${a.anio} de ${a.gestion}`}
                      onClick={() => router.push(`/comites/${a.id}`)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/comites/${a.id}`)
                        }
                      }}
                    >
                      <td className="celda-nowrap">
                        <div className="row-title text-mono">W{a.semana_iso}/{a.anio}</div>
                        <div className="row-sub">{a.fecha}</div>
                      </td>
                      {gestiones.length > 1 && (
                        <td><span className="texto-recorte">{a.gestion}</span></td>
                      )}
                      <td>
                        <span className="texto-recorte">
                          {a.titulo ?? <span className="text-muted">Comité semanal</span>}
                        </span>
                      </td>
                      <td className="text-mono" style={{ textAlign: 'center' }}>{a.total}</td>
                      <td>
                        {a.pct === null ? (
                          <span className="text-muted text-sm">Sin evaluar</span>
                        ) : (
                          <div className="hstack" style={{ gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 40, background: 'var(--border)', height: 6, borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${a.pct}%`, height: '100%', background: colorPct(a.pct) }} />
                            </div>
                            <span className={`badge badge--no-dot ${badgePct(a.pct)}`}>{a.pct}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GrupoPlegable>
        )
      })}
    </>
  )
}
