import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import { calcularVigencia, hoyISO } from '@/lib/documentos/vigencia'
import FormRegistro from './FormRegistro'
import TablaRegistros, { type RegistroFila } from './TablaRegistros'

export default async function PaginaCapacitaciones() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'
  const esLider = sesion.rol === 'lider'
  const puedeGestionar = esAdmin || esLider

  // La RLS ya limita los registros a los que el usuario puede ver
  const { data: registrosRaw } = await supabase
    .from('capacitacion_registros')
    .select(`id, fecha_realizada, fecha_vence, horas, certificado_path,
      usuario:usuarios(nombre, codigo_contrato, gestion_id),
      capacitacion:capacitaciones(nombre, certifica)`)
    .order('fecha_realizada', { ascending: false })

  // Para registrar: capacitaciones activas + personas que puede registrar (su gente o todas)
  const [{ data: caps }, { data: personas }] = puedeGestionar
    ? await Promise.all([
        supabase.from('capacitaciones').select('id, nombre').eq('activa', true).order('nombre'),
        esAdmin
          ? supabase.from('usuarios').select('id, nombre, codigo_contrato').eq('activo', true).order('nombre')
          : supabase.from('usuarios').select('id, nombre, codigo_contrato').eq('activo', true)
              .eq('gestion_id', sesion.gestion_id ?? '').order('nombre'),
      ])
    : [{ data: [] as { id: string; nombre: string }[] }, { data: [] as { id: string; nombre: string; codigo_contrato: string | null }[] }]

  const hoy = hoyISO()

  const registros: RegistroFila[] = (registrosRaw ?? []).map(r => {
    const uRaw = r.usuario as unknown as { nombre: string; codigo_contrato: string | null }[] | { nombre: string; codigo_contrato: string | null } | null
    const u = Array.isArray(uRaw) ? uRaw[0] : uRaw
    const cRaw = r.capacitacion as unknown as { nombre: string; certifica: boolean }[] | { nombre: string; certifica: boolean } | null
    const c = Array.isArray(cRaw) ? cRaw[0] : cRaw
    return {
      id: r.id,
      usuario_nombre: u?.nombre ?? '—',
      usuario_codigo: u?.codigo_contrato ?? null,
      capacitacion_nombre: c?.nombre ?? '—',
      certifica: c?.certifica ?? false,
      fecha_realizada: r.fecha_realizada,
      fecha_vence: r.fecha_vence,
      horas: r.horas,
      certificado_path: r.certificado_path,
      puedeEditar: puedeGestionar,
    }
  })

  // KPIs de vigencia (solo de las que vencen)
  const conVence = registros.filter(r => r.fecha_vence)
  const vencidas = conVence.filter(r => calcularVigencia(r.fecha_vence, hoy).vigencia === 'vencido').length
  const porVencer = conVence.filter(r => calcularVigencia(r.fecha_vence, hoy).vigencia === 'por_vencer').length

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Capacitaciones' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Formación</div>
            <h1 className="page__title">Capacitaciones</h1>
            <p className="page__subtitle">
              {esAdmin ? 'Registro de capacitaciones de toda la organización.'
                : esLider ? 'Capacitaciones de tu equipo.'
                : 'Tus capacitaciones y certificaciones.'}
            </p>
          </div>
        </div>

        <div className="grid-stats" style={{ marginBottom: 22 }}>
          <Kpi num={registros.length} label="Registros" />
          <Kpi num={vencidas} label="Certificaciones vencidas" color="var(--danger-ink)" />
          <Kpi num={porVencer} label="Por vencer (30 días)" color="var(--warning-ink)" />
        </div>

        {puedeGestionar && (
          <div style={{ marginBottom: 8 }}>
            <FormRegistro capacitaciones={caps ?? []} personas={personas ?? []} />
          </div>
        )}

        {registros.length === 0 ? (
          <section className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              {puedeGestionar ? 'Aún no hay capacitaciones registradas.' : 'Todavía no tienes capacitaciones registradas.'}
            </p>
          </section>
        ) : (
          <TablaRegistros registros={registros} hoy={hoy} puedeGestionar={puedeGestionar} />
        )}
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
