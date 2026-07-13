import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import TablaPdis from './TablaPdis'

interface PdiFila {
  id: string
  estado: string
  fecha_acuerdo: string
  proxima_revision: string
  evaluacion_id: string
  colaborador: { id: string; nombre: string; codigo_contrato: string | null } | null
  ciclo: { id: string; nombre: string } | null
  numAcciones: number
  avancePromedio: number
}

export default async function PaginaPdis() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  const { data: pdisRaw } = await supabase
    .from('pdi')
    .select(`
      id, estado, fecha_acuerdo, proxima_revision,
      evaluaciones:evaluacion_id ( id, colaborador_id, ciclo_id )
    `)
    .order('fecha_acuerdo', { ascending: false })

  const pdis = (pdisRaw ?? []).map(p => {
    const rawEval = p.evaluaciones as unknown as { id: string; colaborador_id: string; ciclo_id: string } | { id: string; colaborador_id: string; ciclo_id: string }[] | null
    const evalObj = Array.isArray(rawEval) ? (rawEval[0] ?? null) : rawEval
    return { ...p, evaluacion: evalObj }
  })

  const colabIds = pdis.map(p => p.evaluacion?.colaborador_id).filter((x): x is string => !!x)
  const cicloIds = pdis.map(p => p.evaluacion?.ciclo_id).filter((x): x is string => !!x)
  const pdiIds = pdis.map(p => p.id)

  const [{ data: colabs }, { data: ciclos }, { data: pdiAcc }] = await Promise.all([
    colabIds.length > 0
      ? supabase.from('usuarios').select('id, nombre, codigo_contrato, jefe_id').in('id', colabIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; codigo_contrato: string | null; jefe_id: string | null }[] }),
    cicloIds.length > 0
      ? supabase.from('ciclos_evaluacion').select('id, nombre').in('id', cicloIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    pdiIds.length > 0
      ? supabase.from('pdi_acciones').select('id, pdi_id').in('pdi_id', pdiIds)
      : Promise.resolve({ data: [] as { id: string; pdi_id: string }[] }),
  ])

  const pdiAccIds = (pdiAcc ?? []).map(a => a.id)
  const { data: seguim } = pdiAccIds.length > 0
    ? await supabase.from('pdi_seguimiento_mensual').select('pdi_accion_id, avance_pct').in('pdi_accion_id', pdiAccIds)
    : { data: [] as { pdi_accion_id: string; avance_pct: number }[] }

  const ultimoAvancePorAcc = new Map<string, number>()
  for (const s of seguim ?? []) {
    ultimoAvancePorAcc.set(s.pdi_accion_id, s.avance_pct)
  }
  const accionesPorPdi = new Map<string, string[]>()
  for (const a of pdiAcc ?? []) {
    const arr = accionesPorPdi.get(a.pdi_id) ?? []
    arr.push(a.id)
    accionesPorPdi.set(a.pdi_id, arr)
  }

  const mapColab = new Map((colabs ?? []).map(c => [c.id, c]))
  const mapCiclo = new Map((ciclos ?? []).map(c => [c.id, c]))

  const filas: PdiFila[] = pdis.map(p => {
    const colab = p.evaluacion?.colaborador_id ? mapColab.get(p.evaluacion.colaborador_id) : null
    const ciclo = p.evaluacion?.ciclo_id ? mapCiclo.get(p.evaluacion.ciclo_id) : null
    const accIds = accionesPorPdi.get(p.id) ?? []
    const avances = accIds.map(id => ultimoAvancePorAcc.get(id) ?? 0)
    const avancePromedio = avances.length > 0 ? Math.round(avances.reduce((a, b) => a + b, 0) / avances.length) : 0
    return {
      id: p.id,
      estado: p.estado,
      fecha_acuerdo: p.fecha_acuerdo,
      proxima_revision: p.proxima_revision,
      evaluacion_id: p.evaluacion?.id ?? '',
      colaborador: colab ?? null,
      ciclo: ciclo ?? null,
      numAcciones: accIds.length,
      avancePromedio,
    }
  })

  // Filtrar por permisos si no es admin: solo los suyos o de sus reportes directos
  const filasVisibles = esAdmin
    ? filas
    : filas.filter(f => {
        if (!f.colaborador) return false
        if (f.colaborador.id === sesion.id) return true
        return (mapColab.get(f.colaborador.id)?.jefe_id === sesion.id)
      })

  const vigentes = filasVisibles.filter(f => f.estado === 'vigente' || f.estado === 'completado')
  const enFirma = filasVisibles.filter(f => f.estado === 'en_firma')
  const borradores = filasVisibles.filter(f => f.estado === 'borrador')
  const avanceGlobal = vigentes.length > 0
    ? Math.round(vigentes.reduce((a, b) => a + b.avancePromedio, 0) / vigentes.length)
    : 0

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'PDIs' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 24 }}>
          <div className="page__eyebrow">Cumplimiento</div>
          <h1 className="page__title">Planes de desarrollo</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            {esAdmin ? 'Todos los PDIs de la organización.' : 'PDIs tuyos y de tus reportes directos.'}
          </p>
        </div>

        <div className="grid-stats" style={{ marginBottom: 24 }}>
          <KpiCard num={filasVisibles.length} label="PDIs totales" />
          <KpiCard num={vigentes.length} label="Vigentes" color="var(--success-ink)" />
          <KpiCard num={enFirma.length} label="En firma" color="var(--warning-ink)" />
          <KpiCard num={`${avanceGlobal}%`} label="Avance promedio global" color="var(--primary-ink)" />
        </div>

        {filasVisibles.length === 0 ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              No hay PDIs para mostrar todavía.
            </p>
          </section>
        ) : (
          <TablaPdis filas={filasVisibles} />
        )}

        {borradores.length > 0 && (
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-3)' }}>
            Además hay {borradores.length} PDI(s) en borrador sin enviar a firma.
          </p>
        )}
      </main>
    </>
  )
}

function KpiCard({ num, label, color }: { num: number | string; label: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text)' }}>{num}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}
