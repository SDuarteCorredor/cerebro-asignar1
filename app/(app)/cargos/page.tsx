import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import TablaCargos, { type CargoFila } from './TablaCargos'

export default async function PaginaCargos() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const [{ data: cargos }, { data: enlaces }, { data: personas }, { data: huerfanos }] = await Promise.all([
    supabase.from('cargos').select('id, nombre, banda').order('nombre'),
    // Actividades donde cada cargo participa, con la gestión del proceso
    supabase.from('paso_cargos')
      .select('cargo_id, tipo, paso:pasos(proceso:procesos(gestion_id))'),
    supabase.from('usuarios').select('cargo_id').eq('activo', true),
    supabase.rpc('cargos_sin_responsable'),
  ])
  const sinResponsable = (huerfanos ?? []).length
  const puedeVerCargas = sesion.rol !== 'colaborador'

  // Un cargo puede repetirse en varias actividades del mismo proceso: se cuenta por paso
  const porCargo = new Map<string, { actividades: number; apoyos: number; gestiones: Set<string> }>()
  for (const e of enlaces ?? []) {
    const reg = porCargo.get(e.cargo_id) ?? { actividades: 0, apoyos: 0, gestiones: new Set<string>() }
    if (e.tipo === 'apoyo') reg.apoyos += 1
    else reg.actividades += 1
    const pRaw = e.paso as unknown as { proceso: { gestion_id: string } | { gestion_id: string }[] | null } | { proceso: unknown }[] | null
    const paso = Array.isArray(pRaw) ? pRaw[0] : pRaw
    const procRaw = (paso as { proceso?: unknown } | null)?.proceso
    const proc = Array.isArray(procRaw) ? procRaw[0] : procRaw
    const gid = (proc as { gestion_id?: string } | null)?.gestion_id
    if (gid) reg.gestiones.add(gid)
    porCargo.set(e.cargo_id, reg)
  }

  const conteoPersonas = new Map<string, number>()
  for (const p of personas ?? []) {
    if (p.cargo_id) conteoPersonas.set(p.cargo_id, (conteoPersonas.get(p.cargo_id) ?? 0) + 1)
  }

  const filas: CargoFila[] = (cargos ?? []).map(c => {
    const reg = porCargo.get(c.id)
    return {
      id: c.id,
      nombre: c.nombre,
      banda: c.banda,
      actividades: reg?.actividades ?? 0,
      apoyos: reg?.apoyos ?? 0,
      gestiones: reg?.gestiones.size ?? 0,
      personas: conteoPersonas.get(c.id) ?? 0,
    }
  })

  const conActividades = filas.filter(f => f.actividades + f.apoyos > 0).length

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Manuales de cargo' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Procesos y procedimientos</div>
            <h1 className="page__title">Manuales de cargo</h1>
            <p className="page__subtitle">
              Las funciones de cada cargo salen solas de los procedimientos: cada actividad donde el
              cargo aparece como responsable o de apoyo se recoge aquí, sin importar la gestión.
            </p>
          </div>
        </div>

        <div className="grid-stats" style={{ marginBottom: 22 }}>
          <Kpi num={filas.length} label="Cargos en el catálogo" />
          <Kpi num={conActividades} label="Con funciones documentadas" color="var(--success-ink)" />
          <Kpi num={filas.length - conActividades} label="Sin actividades aún" color="var(--text-3)" />
        </div>

        {puedeVerCargas && sinResponsable > 0 && (
          <Link href="/cargos/sin-responsable" className="card" style={{ display: 'block', padding: 14, marginBottom: 18, background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
            <div className="hstack" style={{ gap: 8, color: 'var(--danger-ink)', justifyContent: 'space-between' }}>
              <span className="hstack" style={{ gap: 8 }}>
                <Icono nombre="info" className="icon icon--sm" />
                <span style={{ fontSize: 13.5 }}>
                  <strong>{sinResponsable}</strong> cargo{sinResponsable === 1 ? '' : 's'} con funciones pero sin nadie que las ejecute.
                </span>
              </span>
              <span className="hstack" style={{ gap: 4, fontSize: 13, fontWeight: 600 }}>
                Ver cargas en riesgo <Icono nombre="chevronRight" className="icon icon--sm" />
              </span>
            </div>
          </Link>
        )}

        {conActividades === 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 18, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
            <div className="hstack" style={{ gap: 8, color: 'var(--warning-ink)' }}>
              <Icono nombre="info" className="icon icon--sm" />
              <span style={{ fontSize: 13.5 }}>
                Ningún cargo tiene actividades enlazadas. Revisa{' '}
                <Link href="/admin/homologacion" style={{ textDecoration: 'underline' }}>Homologar cargos</Link>.
              </span>
            </div>
          </div>
        )}

        <TablaCargos filas={filas} />
      </main>
    </>
  )
}

function Kpi({ num, label, color }: { num: number; label: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: color ?? 'var(--text)' }}>{num}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{label}</div>
    </div>
  )
}
