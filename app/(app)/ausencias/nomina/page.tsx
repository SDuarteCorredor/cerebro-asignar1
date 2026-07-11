import Link from 'next/link'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import TablaNomina, { type FilaNomina } from './TablaNomina'

export const metadata = { title: 'Ausencias para nómina · Cerebro Asignar' }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function iso(d: Date) { return d.toISOString().slice(0, 10) }
function diasInterseccion(desde: string, hasta: string, ini: string, fin: string): number {
  const a = desde > ini ? desde : ini
  const b = hasta < fin ? hasta : fin
  if (a > b) return 0
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()
  return Math.round(ms / 86400000) + 1
}

export default async function NominaAusencias({ searchParams }: {
  searchParams: Promise<{ anio?: string; mes?: string; q?: string }>
}) {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: yo } = await supabase.from('usuarios').select('ve_ausencias, rol').eq('id', sesion.id).single()
  if (!yo || !(yo.ve_ausencias || yo.rol === 'admin')) redirect('/ausencias')

  const { anio: aParam, mes: mParam, q: qParam } = await searchParams
  const hoy = new Date()
  const anio = aParam ? parseInt(aParam, 10) : hoy.getFullYear()
  const mes = mParam ? parseInt(mParam, 10) : hoy.getMonth() + 1
  const quincena = qParam === '2' ? 2 : qParam === '1' ? 1 : (hoy.getDate() <= 15 ? 1 : 2)

  const ultimoDia = new Date(anio, mes, 0).getDate()
  const ini = `${anio}-${String(mes).padStart(2, '0')}-${quincena === 1 ? '01' : '16'}`
  const fin = `${anio}-${String(mes).padStart(2, '0')}-${quincena === 1 ? '15' : String(ultimoDia).padStart(2, '0')}`

  // Aprobadas que INTERSECTAN la quincena
  const { data: enQuincena } = await supabase
    .from('ausencias')
    .select('id, solicitante_id, tipo_id, fecha_desde, fecha_hasta, horario, ciudad, soporte_path')
    .eq('estado', 'aprobada')
    .lte('fecha_desde', fin).gte('fecha_hasta', ini)
    .order('fecha_desde')

  // Sub-etapa D — vigentes que CRUZAN a la próxima quincena (siguen tras 'fin' y siguen vigentes hoy)
  const { data: vigentes } = await supabase
    .from('ausencias')
    .select('id, solicitante_id, tipo_id, fecha_desde, fecha_hasta, horario, soporte_path')
    .eq('estado', 'aprobada')
    .gt('fecha_hasta', fin).gte('fecha_hasta', iso(hoy))
    .order('fecha_hasta')

  const todas = [...(enQuincena ?? []), ...(vigentes ?? [])]
  const tipoIds = Array.from(new Set(todas.map(a => a.tipo_id)))
  const persIds = Array.from(new Set(todas.map(a => a.solicitante_id)))

  const [{ data: tipos }, { data: personas }] = await Promise.all([
    tipoIds.length > 0
      ? supabase.from('tipos_ausencia').select('id, nombre, remunerado, descuenta').in('id', tipoIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; remunerado: boolean; descuenta: boolean }[] }),
    persIds.length > 0
      ? supabase.from('directorio_usuarios').select('id, nombre, codigo_contrato, cargo_id, gestion_id').in('id', persIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string; codigo_contrato: string | null; cargo_id: string | null; gestion_id: string | null }[] }),
  ])

  const cargoIds = Array.from(new Set((personas ?? []).map(p => p.cargo_id).filter(Boolean) as string[]))
  const gestIds = Array.from(new Set((personas ?? []).map(p => p.gestion_id).filter(Boolean) as string[]))
  const [{ data: cargos }, { data: gestiones }] = await Promise.all([
    cargoIds.length > 0 ? supabase.from('cargos').select('id, nombre').in('id', cargoIds) : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    gestIds.length > 0 ? supabase.from('gestiones').select('id, nombre').in('id', gestIds) : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ])
  const mapTipo = new Map((tipos ?? []).map(t => [t.id, t]))
  const mapPers = new Map((personas ?? []).map(p => [p.id, p]))
  const mapCargo = new Map((cargos ?? []).map(c => [c.id, c.nombre]))
  const mapGest = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))

  const filas: FilaNomina[] = (enQuincena ?? []).map(a => {
    const t = mapTipo.get(a.tipo_id); const p = mapPers.get(a.solicitante_id)
    const dias = diasInterseccion(a.fecha_desde, a.fecha_hasta, ini, fin)
    const diasAjustado = (a.horario !== 'TODO EL DÍA' && a.fecha_desde === a.fecha_hasta) ? 0.5 : dias
    return {
      id: a.id,
      colaborador: p?.nombre ?? '—',
      codigo: p?.codigo_contrato ?? '',
      cargo: p?.cargo_id ? (mapCargo.get(p.cargo_id) ?? '') : '',
      gestion: p?.gestion_id ? (mapGest.get(p.gestion_id) ?? '') : '',
      tipo: t?.nombre ?? '—',
      remunerado: t?.remunerado ?? false,
      descuenta: t?.descuenta ?? false,
      desde: a.fecha_desde, hasta: a.fecha_hasta,
      horario: a.horario, ciudad: a.ciudad ?? '',
      dias: diasAjustado,
      soporte_path: a.soporte_path,
    }
  })

  const filasVigentes = (vigentes ?? []).map(a => {
    const t = mapTipo.get(a.tipo_id); const p = mapPers.get(a.solicitante_id)
    return {
      id: a.id, colaborador: p?.nombre ?? '—',
      tipo: t?.nombre ?? '—', hasta: a.fecha_hasta,
    }
  })

  const totalDias = filas.reduce((s, f) => s + f.dias, 0)
  const conDescuento = filas.filter(f => f.descuenta).length

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Ausencias', href: '/ausencias' },
        { etiqueta: 'Nómina' },
      ]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="page__eyebrow">Consolidado para nómina</div>
            <h1 className="page__title">Ausencias · {MESES[mes - 1]} {anio} · {quincena === 1 ? '1ª' : '2ª'} quincena</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Permisos aprobados que afectan esta quincena ({ini} al {fin}).
            </p>
          </div>
          <Link href="/ausencias" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>

        {/* Selector de quincena */}
        <form className="hstack" style={{ gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <select name="mes" defaultValue={mes} className="input" style={{ maxWidth: 150 }}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select name="anio" defaultValue={anio} className="input" style={{ maxWidth: 110 }}>
            {[anio - 1, anio, anio + 1].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="q" defaultValue={quincena} className="input" style={{ maxWidth: 160 }}>
            <option value="1">1ª quincena (1-15)</option>
            <option value="2">2ª quincena (16-fin)</option>
          </select>
          <button type="submit" className="btn btn--primary btn--sm">Ver</button>
        </form>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{filas.length}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Ausencias en la quincena</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalDias}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Días de ausencia</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: conDescuento > 0 ? 'var(--danger-ink)' : undefined }}>{conDescuento}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Con descuento de nómina</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: filasVigentes.length > 0 ? 'var(--warning-ink)' : undefined }}>{filasVigentes.length}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Vigentes que continúan</div>
          </div>
        </div>

        {/* Sub-etapa D: recordatorio de ausencias largas que cruzan */}
        {filasVigentes.length > 0 && (
          <div style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--warning-ink)' }}>
            <strong>⚠ Ausencias que siguen vigentes después de esta quincena</strong> — recuérdalas en la próxima nómina:
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {filasVigentes.map(v => (
                <li key={v.id}>{v.colaborador} — {v.tipo} <strong>hasta {v.hasta}</strong></li>
              ))}
            </ul>
          </div>
        )}

        <TablaNomina filas={filas} periodo={`${MESES[mes - 1]}_${anio}_Q${quincena}`} />
      </main>
    </>
  )
}
