import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'

interface Props {
  usuarioId: string
  esAdmin: boolean
}

/** Lo que espera aprobación del líder / admin (ausencias como jefe + compromisos reportados). */
export default async function BandejaAprobacion({ usuarioId, esAdmin }: Props) {
  const supabase = await crearClienteServidor()

  const [
    { count: ausenciasPorAprobar },
    { data: gestionesLidera },
    { count: docsAprobarAdmin },
    { count: ausenciasSegundoTH },
  ] = await Promise.all([
    supabase.from('ausencias').select('id', { count: 'exact', head: true })
      .eq('jefe_id', usuarioId).eq('estado', 'pendiente_jefe'),
    supabase.from('gestiones').select('id').eq('lider_id', usuarioId).eq('activa', true),
    esAdmin
      ? supabase.from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')
      : Promise.resolve({ count: 0 }),
    esAdmin
      ? supabase.from('ausencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente_segundo')
      : Promise.resolve({ count: 0 }),
  ])

  // Compromisos reportados por el equipo esperando confirmación en gestiones que lidero
  const gestionesIds = (gestionesLidera ?? []).map(g => g.id)
  let compromisosReportados = 0
  if (gestionesIds.length > 0) {
    const { data: comitesLidera } = await supabase
      .from('comites').select('id').in('gestion_id', gestionesIds).eq('cerrado', false)
    const cids = (comitesLidera ?? []).map(c => c.id)
    if (cids.length > 0) {
      const { count } = await supabase.from('compromisos').select('id', { count: 'exact', head: true })
        .in('comite_origen_id', cids).eq('estado', 'reportado')
      compromisosReportados = count ?? 0
    }
  }

  interface Fila {
    clave: string
    icono: string
    tono: 'primary' | 'warning' | 'danger'
    titulo: string
    detalle: string
    href: string
    cuenta: number
  }

  const filas: Fila[] = []
  if ((ausenciasPorAprobar ?? 0) > 0) {
    filas.push({
      clave: 'ausencias',
      icono: 'inbox',
      tono: 'warning',
      titulo: 'Ausencias de mi equipo',
      detalle: 'esperando tu firma',
      href: '/ausencias/bandeja',
      cuenta: ausenciasPorAprobar ?? 0,
    })
  }
  if (compromisosReportados > 0) {
    filas.push({
      clave: 'compromisos',
      icono: 'check',
      tono: 'primary',
      titulo: 'Compromisos reportados',
      detalle: 'confirma cumplimiento',
      href: '/comites',
      cuenta: compromisosReportados,
    })
  }
  if (esAdmin && (docsAprobarAdmin ?? 0) > 0) {
    filas.push({
      clave: 'docs',
      icono: 'fileCheck',
      tono: 'primary',
      titulo: 'Documentos en revisión',
      detalle: 'de calidad, para publicar',
      href: '/admin/aprobaciones',
      cuenta: docsAprobarAdmin ?? 0,
    })
  }
  if (esAdmin && (ausenciasSegundoTH ?? 0) > 0) {
    filas.push({
      clave: 'segunda',
      icono: 'shield',
      tono: 'warning',
      titulo: '2ª validación TH',
      detalle: 'Día de la Excelencia',
      href: '/ausencias/bandeja',
      cuenta: ausenciasSegundoTH ?? 0,
    })
  }

  if (filas.length === 0) return null

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Bandeja de aprobación</h2>
        <span className="section-count text-sm">{filas.reduce((a, f) => a + f.cuenta, 0)}</span>
      </div>
      <div className="dash-aprob">
        {filas.map(f => (
          <Link key={f.clave} href={f.href} className={`card dash-aprob__tarjeta dash-aprob__tarjeta--${f.tono}`}>
            <div className="dash-aprob__icono">
              <Icono nombre={f.icono} className="icon" />
            </div>
            <div className="dash-aprob__cuenta">{f.cuenta}</div>
            <div className="dash-aprob__meta">
              <div className="dash-aprob__titulo">{f.titulo}</div>
              <div className="dash-aprob__detalle">{f.detalle}</div>
            </div>
            <Icono nombre="arrowRight" className="icon icon--sm dash-aprob__flecha" />
          </Link>
        ))}
      </div>
    </section>
  )
}
