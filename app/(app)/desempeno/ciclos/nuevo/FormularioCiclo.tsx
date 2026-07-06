'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Props {
  conteoPorBanda: Record<string, number>
  totalConJefe: number
  totalActivosConCargo: number
}

const BANDAS_INFO = [
  { codigo: 'B1', nombre: 'Operativo', modalidad: '270°' },
  { codigo: 'B2', nombre: 'Analista / Especialista', modalidad: '270°' },
  { codigo: 'B3', nombre: 'Líder', modalidad: '360°' },
  { codigo: 'B4', nombre: 'Coordinador / Director', modalidad: '360°' },
  { codigo: 'B5', nombre: 'Gerente', modalidad: '360°' },
]

const RANGOS_PREDEFINIDOS = [
  { codigo: 'B1-B5', etiqueta: 'Todas las bandas (B1 a B5)', bandas: ['B1','B2','B3','B4','B5'] },
  { codigo: 'B1-B2', etiqueta: 'Solo operativos y analistas (B1-B2)', bandas: ['B1','B2'] },
  { codigo: 'B3-B5', etiqueta: 'Solo líderes y dirección (B3-B5)', bandas: ['B3','B4','B5'] },
]

function fechaISO(offsetDias = 0): string {
  return new Date(Date.now() + offsetDias * 24 * 3600 * 1000).toISOString().split('T')[0]
}

export default function FormularioCiclo({ conteoPorBanda, totalConJefe, totalActivosConCargo }: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState(() => fechaISO(0))
  const [fechaFinCaptura, setFechaFinCaptura] = useState(() => fechaISO(30))
  const [fechaFinProceso, setFechaFinProceso] = useState(() => fechaISO(60))
  const [rangoSeleccionado, setRangoSeleccionado] = useState('B1-B5')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const rangoActual = RANGOS_PREDEFINIDOS.find(r => r.codigo === rangoSeleccionado)!
  const colaboradoresCubiertos = rangoActual.bandas.reduce((sum, b) => sum + (conteoPorBanda[b] ?? 0), 0)

  async function crearCiclo() {
    if (!nombre.trim()) { setError('Ponle un nombre al ciclo (ej: "Semestre I 2026").'); return }
    if (colaboradoresCubiertos === 0) { setError('Ningún colaborador queda cubierto por las bandas elegidas.'); return }

    setGuardando(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado.')

      // 1. Insertar ciclo
      const { data: ciclo, error: errCiclo } = await supabase
        .from('ciclos_evaluacion')
        .insert({
          nombre: nombre.trim(),
          fecha_inicio: fechaInicio,
          fecha_fin_captura: fechaFinCaptura,
          fecha_fin_proceso: fechaFinProceso,
          aplica_a_bandas: rangoActual.codigo,
          estado: 'Programado',
          creado_por: user.id,
        })
        .select('id')
        .single()
      if (errCiclo || !ciclo) throw errCiclo ?? new Error('No se pudo crear el ciclo')

      // 2. Buscar colaboradores aplicables (activos con cargo en bandas elegidas)
      const { data: colaboradores, error: errColab } = await supabase
        .from('usuarios')
        .select('id, jefe_id, cargo:cargos(banda)')
        .eq('activo', true)
        .not('cargo_id', 'is', null)
      if (errColab) throw errColab

      // Filtrar por banda
      const aplicables = (colaboradores ?? []).filter(c => {
        const cargoRaw = c.cargo as { banda: string }[] | { banda: string } | null
        const banda = (Array.isArray(cargoRaw) ? cargoRaw[0]?.banda : cargoRaw?.banda) ?? null
        return banda && rangoActual.bandas.includes(banda)
      })

      // 3. Crear evaluaciones
      const evaluacionesData = aplicables.map(c => ({
        ciclo_id: ciclo.id,
        colaborador_id: c.id,
        estado: 'Pendiente',
      }))
      const { data: evaluacionesInsertadas, error: errEvals } = await supabase
        .from('evaluaciones')
        .insert(evaluacionesData)
        .select('id, colaborador_id')
      if (errEvals) throw errEvals

      // 4. Crear plan_evaluacion: autoeval + jefe (cuando aplica)
      const planes: { evaluacion_id: string; evaluador_id: string; tipo_evaluador: string; estado: string }[] = []
      for (const ev of (evaluacionesInsertadas ?? [])) {
        // Autoevaluación
        planes.push({
          evaluacion_id: ev.id,
          evaluador_id: ev.colaborador_id,
          tipo_evaluador: 'Autoevaluación',
          estado: 'Pendiente',
        })
        // Jefe inmediato
        const colab = aplicables.find(c => c.id === ev.colaborador_id)
        if (colab?.jefe_id) {
          planes.push({
            evaluacion_id: ev.id,
            evaluador_id: colab.jefe_id,
            tipo_evaluador: 'Jefe inmediato',
            estado: 'Pendiente',
          })
        }
      }
      const { error: errPlan } = await supabase.from('plan_evaluacion').insert(planes)
      if (errPlan) throw errPlan

      router.push(`/desempeno/ciclos/${ciclo.id}`)
      router.refresh()
    } catch (e: unknown) {
      const detalle = e instanceof Error ? e.message : (typeof e === 'object' && e !== null ? JSON.stringify(e) : String(e))
      setError(`No se pudo crear el ciclo: ${detalle}`)
      setGuardando(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link href="/desempeno/ciclos" className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver a ciclos
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="page__eyebrow">Nuevo ciclo</div>
        <h1 className="page__title">Crear ciclo de evaluación</h1>
        <p className="page__subtitle">
          El sistema instanciará automáticamente las evaluaciones de los colaboradores cubiertos
          y asignará el jefe directo como evaluador.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="vstack" style={{ gap: 16 }}>
        {/* Información del ciclo */}
        <section className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Información del ciclo</h3>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">Nombre del ciclo</label>
              <input className="ca-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Semestre I 2026" />
            </div>
            <div className="grid-3col">
              <div className="field">
                <label className="field__label">Inicio</label>
                <input className="ca-input" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                <span className="field__hint">Cuándo arranca el ciclo</span>
              </div>
              <div className="field">
                <label className="field__label">Cierre de captura</label>
                <input className="ca-input" type="date" value={fechaFinCaptura} onChange={e => setFechaFinCaptura(e.target.value)} />
                <span className="field__hint">Última fecha para responder</span>
              </div>
              <div className="field">
                <label className="field__label">Cierre del proceso</label>
                <input className="ca-input" type="date" value={fechaFinProceso} onChange={e => setFechaFinProceso(e.target.value)} />
                <span className="field__hint">Fecha límite para PDIs firmados</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bandas que aplican */}
        <section className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Bandas que aplican</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
            Solo se evaluarán los colaboradores cuyo cargo esté en estas bandas.
          </p>
          <div className="vstack" style={{ gap: 10 }}>
            {RANGOS_PREDEFINIDOS.map(r => {
              const total = r.bandas.reduce((sum, b) => sum + (conteoPorBanda[b] ?? 0), 0)
              const seleccionado = rangoSeleccionado === r.codigo
              return (
                <button
                  key={r.codigo}
                  type="button"
                  onClick={() => setRangoSeleccionado(r.codigo)}
                  className={`tipo-opcion${seleccionado ? ' is-active' : ''}`}
                >
                  <span className="tipo-opcion__radio" />
                  <span className="tipo-opcion__body">
                    <strong>{r.etiqueta}</strong>
                    <span>
                      <strong>{total}</strong> colaboradores cubiertos
                      {' · '}
                      {r.bandas.map(b => `${b}: ${conteoPorBanda[b] ?? 0}`).join(' · ')}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Resumen */}
        <section className="card" style={{ padding: 22, background: 'var(--primary-soft)', borderColor: 'var(--primary-soft-2)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--primary-ink)' }}>
            Resumen — Qué pasará al guardar
          </h3>
          <div className="grid-stats-3">
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-ink)' }}>
                {colaboradoresCubiertos}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--primary-ink)' }}>Evaluaciones creadas</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-ink)' }}>
                {colaboradoresCubiertos}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--primary-ink)' }}>Autoevaluaciones asignadas</div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary-ink)' }}>
                {Math.round(colaboradoresCubiertos * (totalConJefe / Math.max(totalActivosConCargo, 1)))}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--primary-ink)' }}>Jefes auto-asignados</div>
            </div>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--primary-ink)' }}>
            Los pares y reportes directos se asignan después en el detalle del ciclo.
            Bandas <strong>{BANDAS_INFO.filter(b => rangoActual.bandas.includes(b.codigo) && b.modalidad === '360°').map(b => b.codigo).join(', ') || '(ninguna)'}</strong> requieren modalidad 360°.
          </p>
        </section>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
          <Link href="/desempeno/ciclos" className="btn btn--ghost">Cancelar</Link>
          <button className="btn btn--primary" onClick={crearCiclo} disabled={guardando}>
            {guardando ? 'Creando…' : <><Icono nombre="check" className="icon icon--sm" /> Crear ciclo e instanciar {colaboradoresCubiertos} evaluaciones</>}
          </button>
        </div>
      </div>
    </div>
  )
}
