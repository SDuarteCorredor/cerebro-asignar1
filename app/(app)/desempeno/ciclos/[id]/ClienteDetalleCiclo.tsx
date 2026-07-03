'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Plan {
  id: string
  evaluador_id: string
  evaluador_nombre: string
  evaluador_codigo: string | null
  tipo_evaluador: string
  estado: string
}

interface Evaluacion {
  id: string
  estado: string
  requiere_revision: boolean
  colaborador: {
    id: string
    nombre: string
    codigo: string | null
    sede: string | null
    cargo_nombre: string | null
    banda: string | null
    modalidad: '360°' | '270°'
  }
  planes: Plan[]
}

interface PosibleEvaluador {
  id: string
  nombre: string
  codigo: string | null
  sede: string | null
}

interface Ciclo {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin_captura: string
  fecha_fin_proceso: string
  estado: string
  aplica_a_bandas: string | null
}

interface Props {
  ciclo: Ciclo
  evaluaciones: Evaluacion[]
  posiblesEvaluadores: PosibleEvaluador[]
}

const colorEstadoCiclo: Record<string, string> = {
  'Programado':  'badge--neutral',
  'En captura':  'badge--warning',
  'En análisis': 'badge--primary',
  'Cerrado':     'badge--success',
}

const colorTipo: Record<string, string> = {
  'Jefe inmediato':    'oklch(0.95 0.04 250)',
  'Par':               'oklch(0.95 0.05 280)',
  'Reporte directo':   'oklch(0.95 0.05 155)',
  'Autoevaluación':    'oklch(0.95 0.05 70)',
}
const colorTipoInk: Record<string, string> = {
  'Jefe inmediato':    'oklch(0.32 0.10 250)',
  'Par':               'oklch(0.32 0.10 280)',
  'Reporte directo':   'oklch(0.30 0.10 155)',
  'Autoevaluación':    'oklch(0.35 0.13 60)',
}

export default function ClienteDetalleCiclo({ ciclo, evaluaciones, posiblesEvaluadores }: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  // Estado del modal de agregar evaluador
  const [evaluacionActiva, setEvaluacionActiva] = useState<Evaluacion | null>(null)
  const [tipoAAgregar, setTipoAAgregar] = useState<'Par' | 'Reporte directo'>('Par')
  const [evaluadorBuscado, setEvaluadorBuscado] = useState('')
  const [evaluadorSeleccionado, setEvaluadorSeleccionado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Stats
  const total = evaluaciones.length
  const conMinimoCobertura = evaluaciones.filter(ev => {
    const tipos = new Set(ev.planes.map(p => p.tipo_evaluador))
    const tienePar = ev.planes.filter(p => p.tipo_evaluador === 'Par').length >= 1
    const tieneReporte = ev.planes.filter(p => p.tipo_evaluador === 'Reporte directo').length >= 1
    if (ev.colaborador.modalidad === '270°') return tipos.has('Jefe inmediato') && tipos.has('Autoevaluación') && tienePar
    return tipos.has('Jefe inmediato') && tipos.has('Autoevaluación') && tienePar && tieneReporte
  }).length

  // Filtros
  const [filtro, setFiltro] = useState<'todos' | 'incompletas' | 'completas' | 'sin-jefe'>('todos')
  const evaluacionesFiltradas = evaluaciones.filter(ev => {
    if (filtro === 'todos') return true
    if (filtro === 'sin-jefe') return !ev.planes.some(p => p.tipo_evaluador === 'Jefe inmediato')
    const tienePar = ev.planes.filter(p => p.tipo_evaluador === 'Par').length >= 1
    const tieneReporte = ev.planes.filter(p => p.tipo_evaluador === 'Reporte directo').length >= 1
    const completa = ev.colaborador.modalidad === '270°'
      ? tienePar
      : (tienePar && tieneReporte)
    return filtro === 'completas' ? completa : !completa
  })

  function abrirModal(ev: Evaluacion, tipo: 'Par' | 'Reporte directo') {
    setEvaluacionActiva(ev)
    setTipoAAgregar(tipo)
    setEvaluadorBuscado('')
    setEvaluadorSeleccionado('')
    setError('')
  }

  function cerrarModal() {
    setEvaluacionActiva(null)
    setEvaluadorBuscado('')
    setEvaluadorSeleccionado('')
  }

  async function agregarEvaluador() {
    if (!evaluacionActiva || !evaluadorSeleccionado) return
    setGuardando(true)
    setError('')
    try {
      const { error: errIns } = await supabase
        .from('plan_evaluacion')
        .insert({
          evaluacion_id: evaluacionActiva.id,
          evaluador_id: evaluadorSeleccionado,
          tipo_evaluador: tipoAAgregar,
          estado: 'Pendiente',
        })
      if (errIns) throw errIns
      cerrarModal()
      router.refresh()
    } catch (e: unknown) {
      const detalle = e instanceof Error ? e.message : String(e)
      setError(`No se pudo agregar: ${detalle}`)
    } finally {
      setGuardando(false)
    }
  }

  async function quitarPlan(planId: string) {
    if (!confirm('¿Quitar este evaluador?')) return
    const { error: errDel } = await supabase.from('plan_evaluacion').delete().eq('id', planId)
    if (errDel) { alert('No se pudo quitar: ' + errDel.message); return }
    router.refresh()
  }

  // Filtrar evaluadores excluyendo: el colaborador evaluado + los ya asignados
  const evaluadoresFiltrados = evaluacionActiva
    ? posiblesEvaluadores
        .filter(e => e.id !== evaluacionActiva.colaborador.id)
        .filter(e => !evaluacionActiva.planes.some(p => p.evaluador_id === e.id))
        .filter(e => {
          if (!evaluadorBuscado.trim()) return true
          const q = evaluadorBuscado.toLowerCase()
          return e.nombre.toLowerCase().includes(q) || (e.codigo ?? '').toLowerCase().includes(q)
        })
        .slice(0, 15)
    : []

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Link href="/desempeno/ciclos" className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver a ciclos
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div className="page__eyebrow">Ciclo de evaluación</div>
          <h1 className="page__title">{ciclo.nombre}</h1>
          <div className="hstack" style={{ gap: 14, marginTop: 12, fontSize: 13, color: 'var(--text-3)' }}>
            <span><Icono nombre="history" className="icon icon--sm" style={{ verticalAlign: 'middle', marginRight: 4 }} />Captura: {ciclo.fecha_inicio} → {ciclo.fecha_fin_captura}</span>
            <span>·</span>
            <span>Bandas: <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{ciclo.aplica_a_bandas ?? 'B1-B5'}</strong></span>
          </div>
        </div>
        <span className={`badge ${colorEstadoCiclo[ciclo.estado] ?? 'badge--neutral'}`}>{ciclo.estado}</span>
      </div>

      {/* KPIs */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Evaluaciones</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-ink)' }}>{conMinimoCobertura}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Con cobertura mínima</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning-ink)' }}>{total - conMinimoCobertura}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Pendientes de cobertura</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total > 0 ? Math.round((conMinimoCobertura / total) * 100) : 0}%</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Listo para arrancar</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-row">
        <div className="filter-pills">
          {[
            { v: 'todos',       n: `Todos (${total})` },
            { v: 'incompletas', n: 'Sin cobertura mínima' },
            { v: 'completas',   n: 'Con cobertura mínima' },
            { v: 'sin-jefe',    n: 'Sin jefe asignado' },
          ].map(o => (
            <button key={o.v} type="button"
              onClick={() => setFiltro(o.v as 'todos' | 'incompletas' | 'completas' | 'sin-jefe')}
              className={`filter-pill ${filtro === o.v ? 'is-active' : ''}`}>{o.n}</button>
          ))}
        </div>
      </div>

      {/* Tabla de evaluaciones */}
      <div className="card card--table">
        <div className="table-scroll">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th style={{ width: 90 }}>Modalidad</th>
                <th>Evaluadores asignados</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesFiltradas.map(ev => {
                const c = ev.colaborador
                const numPares = ev.planes.filter(p => p.tipo_evaluador === 'Par').length
                const numReportes = ev.planes.filter(p => p.tipo_evaluador === 'Reporte directo').length
                const minPares = 1
                const minReportes = c.modalidad === '360°' ? 1 : 0
                return (
                  <tr key={ev.id}>
                    <td>
                      <div className="row-title">{c.nombre}</div>
                      <div className="row-sub">
                        {c.codigo && <span style={{ fontFamily: 'var(--font-mono)', marginRight: 8 }}>{c.codigo}</span>}
                        {c.cargo_nombre && <span>{c.cargo_nombre}</span>}
                        {c.banda && <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 6 }}>· {c.banda}</span>}
                        {c.sede && <span style={{ marginLeft: 6 }}>· {c.sede}</span>}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge--neutral badge--no-dot" style={{ fontFamily: 'var(--font-mono)' }}>
                        {c.modalidad}
                      </span>
                    </td>
                    <td>
                      {ev.planes.length === 0 ? (
                        <span style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin evaluadores</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {ev.planes.map(p => (
                            <span key={p.id} className="badge badge--no-dot" style={{
                              background: colorTipo[p.tipo_evaluador] ?? 'var(--surface-sunken)',
                              color: colorTipoInk[p.tipo_evaluador] ?? 'var(--text-2)',
                              fontSize: 11.5, padding: '4px 8px',
                            }}>
                              <strong style={{ fontWeight: 700, marginRight: 4 }}>{p.tipo_evaluador.charAt(0)}</strong>
                              {p.evaluador_nombre.split(' ').slice(0, 2).join(' ')}
                              {(p.tipo_evaluador === 'Par' || p.tipo_evaluador === 'Reporte directo') && (
                                <button
                                  onClick={() => quitarPlan(p.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: 6, opacity: 0.6 }}
                                  title="Quitar"
                                >×</button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-3)' }}>
                        Pares: <strong style={{ color: numPares >= minPares ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{numPares}/{minPares}</strong>
                        {c.modalidad === '360°' && (
                          <> · Reportes: <strong style={{ color: numReportes >= minReportes ? 'var(--success-ink)' : 'var(--danger-ink)' }}>{numReportes}/{minReportes}</strong></>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="hstack" style={{ gap: 6 }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => abrirModal(ev, 'Par')}>
                          <Icono nombre="plus" className="icon icon--sm" /> Par
                        </button>
                        {c.modalidad === '360°' && (
                          <button className="btn btn--ghost btn--sm" onClick={() => abrirModal(ev, 'Reporte directo')}>
                            <Icono nombre="plus" className="icon icon--sm" /> Reporte
                          </button>
                        )}
                        <Link href={`/desempeno/evaluaciones/${ev.id}/reporte`} className="btn btn--ghost btn--sm" title="Ver reporte">
                          <Icono nombre="chart" className="icon icon--sm" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {evaluacionesFiltradas.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                  No hay evaluaciones que coincidan con el filtro.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de agregar evaluador */}
      {evaluacionActiva && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24,
        }} onClick={cerrarModal}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Asignar {tipoAAgregar.toLowerCase()}
              </h3>
              <button onClick={cerrarModal} className="btn btn--ghost btn--sm">
                <Icono nombre="x" className="icon icon--sm" />
              </button>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-3)' }}>
              Para <strong>{evaluacionActiva.colaborador.nombre}</strong>
              {evaluacionActiva.colaborador.sede && <> · {evaluacionActiva.colaborador.sede}</>}
            </p>

            {error && (
              <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <div className="field" style={{ marginBottom: 12 }}>
              <label className="field__label">Buscar por nombre o código</label>
              <input
                className="ca-input"
                placeholder="Ej: Jorge, ASI255…"
                value={evaluadorBuscado}
                onChange={e => setEvaluadorBuscado(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
              {evaluadoresFiltrados.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  {evaluadorBuscado ? 'Sin resultados' : 'Escribe para buscar'}
                </div>
              ) : (
                evaluadoresFiltrados.map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setEvaluadorSeleccionado(ev.id)}
                    style={{
                      display: 'block', width: '100%', padding: '10px 12px', textAlign: 'left',
                      borderBottom: '1px solid var(--divider)',
                      background: evaluadorSeleccionado === ev.id ? 'var(--primary-soft)' : 'transparent',
                      color: evaluadorSeleccionado === ev.id ? 'var(--primary-ink)' : 'var(--text)',
                      fontSize: 13,
                    }}
                  >
                    <strong>{ev.nombre}</strong>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      {ev.codigo && <span style={{ fontFamily: 'var(--font-mono)' }}>{ev.codigo}</span>}
                      {ev.sede && <span style={{ marginLeft: 8 }}>{ev.sede}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="hstack" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn--ghost" onClick={cerrarModal}>Cancelar</button>
              <button
                className="btn btn--primary"
                onClick={agregarEvaluador}
                disabled={!evaluadorSeleccionado || guardando}
              >
                {guardando ? 'Asignando…' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
