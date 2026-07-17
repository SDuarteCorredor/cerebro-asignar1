'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Item {
  id: string
  competencia: string
  numero: number
  texto: string
  respuestaInicial: number | null
}

interface Competencia {
  codigo: string
  nombre: string
  tipo: string
}

interface Props {
  planId: string
  tipoEvaluador: string
  estado: string
  esAutoeval: boolean
  colaborador: { nombre: string; codigo: string | null; cargo: string | null; banda: string | null }
  ciclo: { nombre: string; fecha_fin_captura: string | null }
  items: Item[]
  competencias: Competencia[]
}

const ESCALA = [
  { valor: 1, etiqueta: 'Nunca',          color: '#F6D4C7', ink: '#952E12' },
  { valor: 2, etiqueta: 'Pocas veces',    color: '#F2DFCA', ink: '#8B5316' },
  { valor: 3, etiqueta: 'A veces',        color: '#F0ECD4', ink: '#6B6200' },
  { valor: 4, etiqueta: 'Frecuentemente', color: '#D5F0DB', ink: '#1A6B35' },
  { valor: 5, etiqueta: 'Siempre',        color: '#C0EBCC', ink: '#0A6B2A' },
]

export default function ClienteCuestionario({
  planId, tipoEvaluador, estado, esAutoeval,
  colaborador, ciclo, items, competencias,
}: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  // Estado: itemId → calificacion (null = no respondido aún o "no observado")
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {}
    for (const it of items) init[it.id] = it.respuestaInicial
    return init
  })
  const [guardando, setGuardando] = useState(false)
  const [guardandoFinal, setGuardandoFinal] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const yaRespondida = estado === 'Respondida'

  // Estadísticas
  const respondidos = items.filter(it => respuestas[it.id] !== null && respuestas[it.id] !== undefined).length
  const total = items.length
  const porcentaje = total > 0 ? Math.round((respondidos / total) * 100) : 0

  // Agrupar items por competencia
  const itemsPorCompetencia = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const it of items) {
      if (!map.has(it.competencia)) map.set(it.competencia, [])
      map.get(it.competencia)!.push(it)
    }
    return map
  }, [items])

  function setCalif(itemId: string, valor: number | null) {
    if (yaRespondida) return
    setRespuestas(prev => ({ ...prev, [itemId]: valor }))
  }

  async function guardarBorrador() {
    if (yaRespondida) return
    setGuardando(true)
    setError(''); setExito('')
    try {
      // Solo guardar los que tengan algún valor o que existían antes
      const filas = items
        .filter(it => respuestas[it.id] !== null && respuestas[it.id] !== undefined)
        .map(it => ({ plan_evaluacion_id: planId, item_id: it.id, calificacion: respuestas[it.id] }))
      if (filas.length === 0) { setExito('Nada que guardar todavía.'); return }
      const { error: errIns } = await supabase
        .from('respuestas')
        .upsert(filas, { onConflict: 'plan_evaluacion_id,item_id' })
      if (errIns) throw errIns
      setExito(`Guardado parcial: ${filas.length} respuestas.`)
      router.refresh()
    } catch (e: unknown) {
      const detalle = e instanceof Error ? e.message : String(e)
      setError(`No se pudo guardar: ${detalle}`)
    } finally {
      setGuardando(false)
    }
  }

  async function finalizar() {
    if (yaRespondida) return
    if (respondidos === 0) { setError('Responde al menos algún ítem antes de finalizar.'); return }
    if (!confirm(`¿Confirmas que terminaste? Respondiste ${respondidos} de ${total} ítems. Los que dejaste en blanco quedarán como "No he observado".`)) return

    setGuardandoFinal(true)
    setError(''); setExito('')
    try {
      // 1. Upsert todas las respuestas (con null para los que no respondió)
      const filas = items.map(it => ({
        plan_evaluacion_id: planId,
        item_id: it.id,
        calificacion: respuestas[it.id] ?? null,
      }))
      const { error: errIns } = await supabase
        .from('respuestas')
        .upsert(filas, { onConflict: 'plan_evaluacion_id,item_id' })
      if (errIns) throw errIns

      // 2. Marcar plan como Respondida
      const { error: errUpd } = await supabase
        .from('plan_evaluacion')
        .update({ estado: 'Respondida', fecha_respuesta: new Date().toISOString() })
        .eq('id', planId)
      if (errUpd) throw errUpd

      router.push('/desempeno/mis-pendientes')
      router.refresh()
    } catch (e: unknown) {
      const detalle = e instanceof Error ? e.message : String(e)
      setError(`No se pudo finalizar: ${detalle}`)
      setGuardandoFinal(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link href="/desempeno/mis-pendientes" className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver a mis pendientes
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div className="page__eyebrow">Cuestionario · {ciclo.nombre}</div>
        <h1 className="page__title" style={{ fontSize: 26 }}>
          {esAutoeval
            ? 'Autoevaluación'
            : <>Evaluación de <span style={{ color: 'var(--primary)' }}>{colaborador.nombre}</span></>
          }
        </h1>
        <div className="hstack" style={{ gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
          <span className="badge badge--primary badge--no-dot">{tipoEvaluador}</span>
          {colaborador.cargo && <span>{colaborador.cargo}</span>}
          {colaborador.banda && <span style={{ fontFamily: 'var(--font-mono)' }}>· {colaborador.banda}</span>}
          {ciclo.fecha_fin_captura && <span>· Cierre {ciclo.fecha_fin_captura}</span>}
        </div>
      </div>

      {/* Instrucciones */}
      <section className="card" style={{ padding: 18, marginBottom: 20, background: 'var(--primary-soft)', borderColor: 'var(--primary-soft-2)' }}>
        <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
          <Icono nombre="info" className="icon" style={{ color: 'var(--primary)' }} />
          <strong style={{ color: 'var(--primary-ink)' }}>Instrucciones</strong>
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--primary-ink)', lineHeight: 1.55 }}>
          {esAutoeval
            ? 'Califícate de la manera más honesta posible. Piensa en tu conducta en los últimos 6 meses. Si una conducta no aplica a tu cargo, déjala en blanco.'
            : `Califica la conducta de ${colaborador.nombre} en los últimos 6 meses. Si no has podido observar una conducta, déjala en blanco — equivale a "No he observado".`
          }
          {' '}Tus respuestas son confidenciales: el evaluado nunca verá quién le calificó qué.
        </p>
      </section>

      {/* Mensajes */}
      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {exito && (
        <div style={{ background: 'var(--success-soft)', color: 'var(--success-ink)', border: '1px solid var(--success)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
          <Icono nombre="check" className="icon icon--sm" /> {exito}
        </div>
      )}

      {/* Barra de progreso sticky */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 10, background: 'var(--bg)', padding: '12px 0', marginBottom: 16,
        borderBottom: '1px solid var(--divider)',
      }}>
        <div className="hstack" style={{ gap: 12, fontSize: 13 }}>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{respondidos}</strong>
          <span style={{ color: 'var(--text-3)' }}>de</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{total}</strong>
          <span style={{ color: 'var(--text-3)' }}>ítems respondidos</span>
          <div style={{ flex: 1, height: 8, background: 'var(--surface-sunken)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${porcentaje}%`, height: '100%', background: porcentaje === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 200ms' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: porcentaje === 100 ? 'var(--success-ink)' : 'var(--text-2)' }}>{porcentaje}%</span>
        </div>
      </div>

      {/* Competencias e ítems */}
      <div className="vstack" style={{ gap: 20 }}>
        {competencias.map(c => {
          const itemsComp = itemsPorCompetencia.get(c.codigo) ?? []
          return (
            <section key={c.codigo} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--divider)', background: 'var(--surface-sunken)' }}>
                <div className="hstack" style={{ gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: c.tipo === 'Gerencial' ? '#DDD3F3' : 'var(--primary-soft-2)',
                    color: c.tipo === 'Gerencial' ? '#2D1B6B' : 'var(--primary-ink)',
                    display: 'grid', placeItems: 'center',
                    fontWeight: 700, fontFamily: 'var(--font-mono)',
                  }}>{c.codigo}</div>
                  <div>
                    <strong style={{ fontSize: 15 }}>{c.nombre}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {c.tipo} · {itemsComp.length} ítems
                    </div>
                  </div>
                </div>
              </div>
              <div>
                {itemsComp.map((it, idx) => {
                  const seleccionado = respuestas[it.id]
                  return (
                    <div key={it.id} style={{
                      padding: '16px 22px',
                      borderBottom: idx < itemsComp.length - 1 ? '1px solid var(--divider)' : 'none',
                      display: 'grid', gridTemplateColumns: '32px 1fr', gap: 14, alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 999,
                        background: seleccionado != null ? 'var(--primary-soft)' : 'var(--surface-sunken)',
                        border: '1px solid var(--border)',
                        display: 'grid', placeItems: 'center',
                        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                        color: seleccionado != null ? 'var(--primary-ink)' : 'var(--text-3)',
                        marginTop: 4,
                      }}>{it.numero}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: 'var(--text)' }}>{it.texto}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                          {ESCALA.map(e => {
                            const activo = seleccionado === e.valor
                            return (
                              <button
                                key={e.valor}
                                type="button"
                                onClick={() => setCalif(it.id, activo ? null : e.valor)}
                                disabled={yaRespondida}
                                style={{
                                  padding: '8px 12px', borderRadius: 8,
                                  background: activo ? e.color : 'var(--surface)',
                                  color: activo ? e.ink : 'var(--text-2)',
                                  border: activo ? `1.5px solid ${e.ink}` : '1px solid var(--border-strong)',
                                  fontSize: 12.5, fontWeight: activo ? 700 : 500,
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  cursor: yaRespondida ? 'default' : 'pointer',
                                  opacity: yaRespondida ? 0.7 : 1,
                                }}
                              >
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{e.valor}</strong> {e.etiqueta}
                              </button>
                            )
                          })}
                          <button
                            type="button"
                            onClick={() => setCalif(it.id, null)}
                            disabled={yaRespondida}
                            style={{
                              padding: '8px 12px', borderRadius: 8,
                              background: seleccionado === null ? 'var(--surface-sunken)' : 'transparent',
                              color: 'var(--text-3)',
                              border: '1px dashed var(--border-strong)',
                              fontSize: 12, fontStyle: 'italic',
                              cursor: yaRespondida ? 'default' : 'pointer',
                            }}
                          >
                            No he observado
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Acciones finales */}
      {!yaRespondida && (
        <div style={{
          position: 'sticky', bottom: 0, background: 'var(--bg)',
          padding: '16px 0', marginTop: 24, borderTop: '1px solid var(--divider)',
          display: 'flex', justifyContent: 'space-between', gap: 10,
        }}>
          <button className="btn btn--secondary" onClick={guardarBorrador} disabled={guardando || guardandoFinal}>
            {guardando ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button className="btn btn--primary" onClick={finalizar} disabled={guardandoFinal || guardando}>
            {guardandoFinal ? 'Finalizando…' : <><Icono nombre="check" className="icon icon--sm" /> Finalizar y enviar</>}
          </button>
        </div>
      )}

      {yaRespondida && (
        <div className="card" style={{ padding: 18, marginTop: 24, background: 'var(--success-soft)', borderColor: 'var(--success)' }}>
          <div className="hstack" style={{ gap: 10 }}>
            <Icono nombre="check" className="icon" style={{ color: 'var(--success-ink)' }} />
            <strong style={{ color: 'var(--success-ink)' }}>Ya enviaste tus respuestas.</strong>
          </div>
        </div>
      )}
    </div>
  )
}
