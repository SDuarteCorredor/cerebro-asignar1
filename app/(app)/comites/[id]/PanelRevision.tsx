'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Icono from '@/components/app/Icono'
import GrupoPlegable from '@/components/app/GrupoPlegable'
import { marcarEstado } from '../acciones'
import { BADGE_IMPACTO, ETIQUETA_IMPACTO, type Impacto } from '@/lib/comites/puntaje'

interface CompRev {
  id: string
  responsable_id: string
  responsable_nombre: string
  descripcion: string
  fecha_limite: string | null
  estado: string
  impacto: string
  autorreporte_nota: string | null
  notas_revision: string | null
}

const iniciales = (n: string) => n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

type ClaveGrupo = 'reportado' | 'pendiente' | 'cumplido' | 'no_cumplido' | 'arrastrado'

/** Lo que espera decisión del líder va primero; lo ya resuelto se pliega. */
const GRUPOS: Record<ClaveGrupo, { titulo: string; color: string; vacio: string }> = {
  reportado:   { titulo: 'Reportados — esperan tu confirmación', color: 'var(--primary)', vacio: 'Nadie reportó avance esta semana.' },
  pendiente:   { titulo: 'Sin reporte',       color: 'var(--warning)', vacio: 'Todos reportaron su avance.' },
  cumplido:    { titulo: 'Cumplidos',         color: 'var(--success)', vacio: 'Ninguno confirmado como cumplido.' },
  no_cumplido: { titulo: 'No cumplidos',      color: 'var(--danger)',  vacio: 'Ninguno quedó sin cumplir.' },
  arrastrado:  { titulo: 'Arrastrados',       color: 'var(--text-3)',  vacio: 'Ninguno se arrastró a esta semana.' },
}

const ORDEN_GRUPOS: ClaveGrupo[] = ['reportado', 'pendiente', 'cumplido', 'no_cumplido', 'arrastrado']

export default function PanelRevision({
  comiteActualId, compromisos, editable,
}: {
  comiteActualId: string
  compromisos: CompRev[]
  editable: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [impacto, setImpacto] = useState<'' | Impacto>('')
  const [plegados, setPlegados] = useState<ClaveGrupo[]>(['cumplido', 'no_cumplido', 'arrastrado'])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function alternar(clave: ClaveGrupo) {
    setPlegados(p => p.includes(clave) ? p.filter(k => k !== clave) : [...p, clave])
  }

  function marcar(compromisoId: string, estado: 'cumplido' | 'no_cumplido' | 'arrastrado' | 'pendiente') {
    startTransition(async () => {
      const res = await marcarEstado({
        compromiso_id: compromisoId,
        comite_id: comiteActualId,
        estado,
        revisado_en_id: estado === 'pendiente' ? null : comiteActualId,
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
    const m = {} as Record<ClaveGrupo, CompRev[]>
    for (const k of ORDEN_GRUPOS) m[k] = []
    for (const c of filtrados) {
      const k = (ORDEN_GRUPOS as string[]).includes(c.estado) ? c.estado as ClaveGrupo : 'pendiente'
      m[k].push(c)
    }
    return m
  }, [filtrados])

  const hayFiltro = busqueda.trim() !== '' || impacto !== ''

  function renderFila(c: CompRev) {
    const imp = (c.impacto ?? 'medio') as Impacto
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
              <span className="hstack" style={{ gap: 4 }}>
                <Icono nombre="clock" className="icon icon--sm" /> límite {c.fecha_limite}
              </span>
            )}
            <span className={`badge badge--no-dot ${BADGE_IMPACTO[imp]}`} style={{ fontSize: 10.5 }}>
              <Icono nombre="flag" className="icon icon--sm" /> {ETIQUETA_IMPACTO[imp]}
            </span>
          </div>
          {c.autorreporte_nota && (
            <div className="reporte">
              <div className="reporte__cab">
                <Icono nombre="message" className="icon icon--sm" /> Reporte del responsable
              </div>
              <div className="reporte__cuerpo">
                <p className="reporte__nota">{c.autorreporte_nota}</p>
              </div>
            </div>
          )}
          {c.notas_revision && (
            <p className="reporte__ayuda" style={{ marginTop: 6 }}>Revisión: {c.notas_revision}</p>
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
            <button
              type="button"
              className={`compromiso__btn${c.estado === 'arrastrado' ? ' is-on--arr' : ''}`}
              title="Arrastrar a este comité" aria-label="Arrastrar a este comité"
              disabled={isPending} onClick={() => marcar(c.id, 'arrastrado')}
            >
              <Icono nombre="rotateCcw" className="icon icon--sm" />
            </button>
          </div>
        )}
      </div>
    )
  }

  if (compromisos.length === 0) {
    return <p className="text-muted text-sm" style={{ margin: 0 }}>No quedaron compromisos por revisar.</p>
  }

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="barra-filtros" style={{ marginBottom: 0 }}>
        <div className="barra-filtros__buscar">
          <Icono nombre="search" className="icon icon--sm" />
          <input
            className="input ca-input--sm"
            placeholder="Buscar por texto o responsable"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar compromisos por revisar"
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
        if (filas.length === 0 && !hayFiltro) return null
        return (
          <GrupoPlegable
            key={clave}
            titulo={g.titulo} color={g.color} conteo={filas.length}
            abierto={!plegados.includes(clave)}
            onAlternar={() => alternar(clave)}
            vacio={hayFiltro ? 'Ninguno coincide con el filtro.' : g.vacio}
          >
            {filas.map(renderFila)}
          </GrupoPlegable>
        )
      })}
    </div>
  )
}
