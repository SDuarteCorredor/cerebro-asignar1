'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import GrupoPlegable from '@/components/app/GrupoPlegable'
import { usePreferenciaLocal } from '@/lib/usePreferenciaLocal'
import { agregarCompromiso, eliminarCompromiso, autorreportarCompromiso, marcarEstado } from '../acciones'
import { BADGE_IMPACTO, ETIQUETA_IMPACTO, type Impacto } from '@/lib/comites/puntaje'

interface Comp {
  id: string
  responsable_id: string
  responsable_nombre: string
  descripcion: string
  fecha_limite: string | null
  estado: string
  impacto: string
  autorreporte_nota: string | null
}

const iniciales = (n: string) => n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

/** Los estados se muestran como grupos separados: lo que falta arriba,
 *  lo ya resuelto abajo. Mezclarlos escondía lo pendiente. */
type ClaveGrupo = 'pendiente' | 'reportado' | 'cumplido' | 'no_cumplido' | 'arrastrado'

const GRUPOS: Record<ClaveGrupo, { titulo: string; color: string; vacio: string }> = {
  pendiente:   { titulo: 'Por hacer',              color: 'var(--warning)', vacio: 'Nada pendiente. Todo tiene reporte o confirmación.' },
  reportado:   { titulo: 'Reportados — por confirmar', color: 'var(--primary)', vacio: 'Nadie ha reportado avance todavía.' },
  cumplido:    { titulo: 'Cumplidos',              color: 'var(--success)', vacio: 'Aún no hay compromisos confirmados como cumplidos.' },
  no_cumplido: { titulo: 'No cumplidos',           color: 'var(--danger)',  vacio: 'Ninguno quedó sin cumplir.' },
  arrastrado:  { titulo: 'Arrastrados',            color: 'var(--text-3)',  vacio: 'Ninguno se arrastró a otra semana.' },
}

const ORDEN_GRUPOS: ClaveGrupo[] = ['pendiente', 'reportado', 'cumplido', 'no_cumplido', 'arrastrado']
const LLAVE_PLEGADO = 'comite:compromisos-plegados'
/** Lo resuelto arranca plegado: lo accionable va primero. */
const PLEGADOS_POR_DEFECTO: ClaveGrupo[] = ['cumplido', 'no_cumplido', 'arrastrado']

const esListaDeClaves = (v: unknown): v is ClaveGrupo[] =>
  Array.isArray(v) && v.every(k => typeof k === 'string' && k in GRUPOS)

export default function PanelCompromisos({
  comiteId, compromisos, asistentes, editable, sesionId,
}: {
  comiteId: string
  compromisos: Comp[]
  asistentes: { id: string; nombre: string }[]
  editable: boolean
  sesionId: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportando, setReportando] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [impacto, setImpacto] = useState<'' | Impacto>('')
  const [plegados, guardarPlegados] = usePreferenciaLocal(LLAVE_PLEGADO, PLEGADOS_POR_DEFECTO, esListaDeClaves)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function alternar(clave: ClaveGrupo) {
    guardarPlegados(plegados.includes(clave) ? plegados.filter(k => k !== clave) : [...plegados, clave])
  }

  function marcar(compromisoId: string, estado: 'cumplido' | 'no_cumplido' | 'pendiente') {
    startTransition(async () => {
      const res = await marcarEstado({
        compromiso_id: compromisoId, comite_id: comiteId, estado,
        revisado_en_id: estado === 'pendiente' ? null : comiteId,
      })
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return compromisos.filter(c => {
      if (impacto && (c.impacto ?? 'medio') !== impacto) return false
      if (!q) return true
      return c.descripcion.toLowerCase().includes(q)
        || c.responsable_nombre.toLowerCase().includes(q)
    })
  }, [compromisos, busqueda, impacto])

  const porGrupo = useMemo(() => {
    const m = {} as Record<ClaveGrupo, Comp[]>
    for (const k of ORDEN_GRUPOS) m[k] = []
    for (const c of filtrados) {
      const k = (ORDEN_GRUPOS as string[]).includes(c.estado) ? c.estado as ClaveGrupo : 'pendiente'
      m[k].push(c)
    }
    return m
  }, [filtrados])

  const hayFiltro = busqueda.trim() !== '' || impacto !== ''

  function abrirReporte(c: Comp) {
    setReportando(c.id)
    setNota(c.autorreporte_nota ?? '')
  }

  /** Antepone una línea fechada para que la nota funcione como bitácora
   *  en vez de reemplazarse cada vez. */
  function anteponerEntrada() {
    const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    setNota(prev => `[${hoy}] ${prev ? `\n${prev}` : ''}`)
  }

  function renderCompromiso(c: Comp) {
    const esResponsable = c.responsable_id === sesionId
    const puedeReportar = esResponsable && (c.estado === 'pendiente' || c.estado === 'reportado')
    const imp = (c.impacto ?? 'medio') as Impacto
    const vencido = c.fecha_limite !== null
      && (c.estado === 'pendiente' || c.estado === 'reportado')
      && c.fecha_limite < new Date().toISOString().slice(0, 10)

    return (
      <div key={c.id} className="compromiso">
        <div className="compromiso__cuerpo">
          <div className="hstack" style={{ gap: 7, marginBottom: 5 }}>
            <div className="avatar avatar--sm" style={{ width: 22, height: 22, fontSize: 10 }}>
              {iniciales(c.responsable_nombre)}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.responsable_nombre}</span>
          </div>
          <div className="compromiso__desc">{c.descripcion}</div>
          <div className="compromiso__meta">
            {c.fecha_limite && (
              <span className="hstack" style={{ gap: 4, color: vencido ? 'var(--danger-ink)' : undefined }}>
                <Icono nombre={vencido ? 'alertTriangle' : 'clock'} className="icon icon--sm" />
                {vencido ? 'venció' : 'límite'} {c.fecha_limite}
              </span>
            )}
            <span className={`badge badge--no-dot ${BADGE_IMPACTO[imp]}`} style={{ fontSize: 10.5 }}>
              <Icono nombre="flag" className="icon icon--sm" /> {ETIQUETA_IMPACTO[imp]}
            </span>
          </div>

          {c.autorreporte_nota && reportando !== c.id && (
            <div className="reporte">
              <div className="reporte__cab">
                <Icono nombre="message" className="icon icon--sm" /> Reporte del responsable
              </div>
              <div className="reporte__cuerpo">
                <p className="reporte__nota">{c.autorreporte_nota}</p>
              </div>
            </div>
          )}

          {/* Autorreporte — bitácora editable del responsable */}
          {puedeReportar && (
            reportando === c.id ? (
              <div className="reporte">
                <div className="reporte__cab">
                  <Icono nombre="message" className="icon icon--sm" /> Mi avance
                </div>
                <div className="reporte__cuerpo">
                  <textarea
                    className="ca-textarea"
                    placeholder="Qué avanzaste, qué falta, qué te está bloqueando…"
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    style={{ minHeight: 84, fontSize: 13 }}
                    aria-label="Nota de avance"
                  />
                  <p className="reporte__ayuda">
                    La nota se conserva: usa «Añadir entrada» para dejar el avance de hoy encima del anterior.
                  </p>
                  <div className="reporte__pie">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={anteponerEntrada}>
                      <Icono nombre="plus" className="icon icon--sm" /> Añadir entrada
                    </button>
                    <span className="spacer" />
                    <button type="button" className="btn btn--ghost btn--sm"
                      onClick={() => { setReportando(null); setNota('') }}>Cancelar</button>
                    <button type="button" className="btn btn--primary btn--sm" disabled={isPending}
                      onClick={() => startTransition(async () => {
                        const res = await autorreportarCompromiso({ compromiso_id: c.id, comite_id: comiteId, nota })
                        if (res.error) alert(res.error)
                        else { setReportando(null); setNota(''); router.refresh() }
                      })}>
                      <Icono nombre="check" className="icon icon--sm" /> Guardar avance
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hstack" style={{ gap: 6, marginTop: 8 }}>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => abrirReporte(c)}>
                  <Icono nombre="message" className="icon icon--sm" />
                  {c.estado === 'reportado' ? 'Actualizar mi avance' : 'Reportar mi avance'}
                </button>
                {c.estado === 'reportado' && (
                  <button type="button" className="btn btn--ghost btn--sm" disabled={isPending}
                    onClick={() => startTransition(async () => {
                      const res = await autorreportarCompromiso({ compromiso_id: c.id, comite_id: comiteId, nota: '', deshacer: true })
                      if (res.error) alert(res.error)
                      else router.refresh()
                    })}>Deshacer</button>
                )}
              </div>
            )
          )}
        </div>

        {editable && (
          <div className="compromiso__acciones">
            <button
              type="button"
              className={`compromiso__btn${c.estado === 'cumplido' ? ' is-on--ok' : ''}`}
              title="Confirmar cumplido" aria-label="Confirmar cumplido"
              disabled={isPending} onClick={() => marcar(c.id, 'cumplido')}
            >
              <Icono nombre="check" className="icon icon--sm" />
            </button>
            <button
              type="button"
              className={`compromiso__btn${c.estado === 'no_cumplido' ? ' is-on--no' : ''}`}
              title="Confirmar no cumplido" aria-label="Confirmar no cumplido"
              disabled={isPending} onClick={() => marcar(c.id, 'no_cumplido')}
            >
              <Icono nombre="x" className="icon icon--sm" />
            </button>
            {(c.estado === 'pendiente' || c.estado === 'reportado') && (
              <button
                type="button" className="compromiso__btn compromiso__btn--peligro"
                title="Eliminar" aria-label="Eliminar compromiso" disabled={isPending}
                onClick={() => startTransition(async () => {
                  if (!confirm('¿Eliminar este compromiso?')) return
                  await eliminarCompromiso(c.id, comiteId)
                  router.refresh()
                })}
              >
                <Icono nombre="trash" className="icon icon--sm" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      {compromisos.length === 0 ? (
        <p className="text-muted text-sm" style={{ margin: 0 }}>
          Todavía no hay compromisos en este comité.
        </p>
      ) : (
        <>
          <div className="barra-filtros" style={{ marginBottom: 0 }}>
            <div className="barra-filtros__buscar">
              <Icono nombre="search" className="icon icon--sm" />
              <input
                className="input ca-input--sm"
                placeholder="Buscar por texto o responsable"
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                aria-label="Buscar compromisos"
              />
            </div>
            <div className="filter-pills" role="group" aria-label="Filtrar por impacto">
              {([['', 'Todos'], ['alto', 'Alto'], ['medio', 'Medio'], ['bajo', 'Bajo']] as const).map(([v, etq]) => (
                <button
                  key={v} type="button"
                  className={`filter-pill${impacto === v ? ' is-active' : ''}`}
                  onClick={() => setImpacto(v as '' | Impacto)}
                  aria-pressed={impacto === v}
                >{etq}</button>
              ))}
            </div>
            <span className="barra-filtros__resultado">
              {filtrados.length} de {compromisos.length}
            </span>
          </div>

          {ORDEN_GRUPOS.map(clave => {
            const g = GRUPOS[clave]
            const filas = porGrupo[clave]
            // Un grupo vacío sin filtro activo solo estorba
            if (filas.length === 0 && !hayFiltro && clave !== 'pendiente') return null
            return (
              <GrupoPlegable
                key={clave}
                titulo={g.titulo} color={g.color} conteo={filas.length}
                abierto={!plegados.includes(clave)}
                onAlternar={() => alternar(clave)}
                vacio={hayFiltro ? 'Ninguno coincide con el filtro.' : g.vacio}
              >
                {filas.map(renderCompromiso)}
              </GrupoPlegable>
            )
          })}
        </>
      )}

      {editable && (
        !abierto ? (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(true)} style={{ alignSelf: 'flex-start' }}>
            <Icono nombre="plus" className="icon icon--sm" /> Agregar compromiso
          </button>
        ) : (
          <form
            className="card"
            style={{ padding: 14, background: 'var(--surface)' }}
            action={(fd) => startTransition(async () => {
              setError(null)
              fd.append('comite_id', comiteId)
              const res = await agregarCompromiso(fd)
              if (res.error) setError(res.error)
              else {
                setAbierto(false)
                router.refresh()
              }
            })}
          >
            <div className="form-row-compromiso">
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Descripción*</div>
                <input name="descripcion" required className="input" placeholder="Qué se compromete a hacer" />
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Responsable*</div>
                <select name="responsable_id" required className="input" defaultValue="">
                  <option value="">—</option>
                  {asistentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Impacto*</div>
                <select name="impacto" required className="input" defaultValue="medio">
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
              </label>
              <label style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 3, color: 'var(--text-3)' }}>Fecha límite</div>
                <input name="fecha_limite" type="date" className="input" />
              </label>
              <div className="hstack" style={{ gap: 4 }}>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={isPending}>
                  {isPending ? '…' : 'Guardar'}
                </button>
              </div>
            </div>
            {error && (
              <div style={{ padding: 6, background: 'var(--danger-soft)', color: 'var(--danger-ink)', borderRadius: 4, fontSize: 11.5, marginTop: 8 }}>
                {error}
              </div>
            )}
          </form>
        )
      )}
    </div>
  )
}
