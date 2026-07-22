import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'

interface Props {
  usuarioId: string
  gestionId: string | null
  esLider: boolean
  esAdmin: boolean
}

interface TarjetaAccion {
  clave: string
  icono: string
  tono: 'primary' | 'warning' | 'danger' | 'success' | 'neutral'
  titulo: string
  detalle: string
  href: string
  cta: string
  cuenta?: number
}

/** Bandeja de acción: lo que el usuario tiene que hacer hoy. */
export default async function BandejaAccion({ usuarioId, gestionId, esLider, esAdmin }: Props) {
  const supabase = await crearClienteServidor()

  const [
    { count: cuestionariosPendientes },
    { count: ausenciasEsperando },
    { data: comitesGestion },
    { count: docsAprobarAdmin },
    { count: ausenciasSegundoTH },
  ] = await Promise.all([
    supabase.from('plan_evaluacion').select('id', { count: 'exact', head: true })
      .eq('evaluador_id', usuarioId).eq('estado', 'Pendiente'),
    supabase.from('ausencias').select('id', { count: 'exact', head: true })
      .eq('solicitante_id', usuarioId)
      .in('estado', ['pendiente_jefe', 'pendiente_segundo']),
    gestionId
      ? supabase.from('comites').select('id, fecha, cerrado')
          .eq('gestion_id', gestionId).order('fecha', { ascending: false }).limit(1)
      : Promise.resolve({ data: [] as { id: string; fecha: string; cerrado: boolean }[] }),
    esAdmin
      ? supabase.from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')
      : Promise.resolve({ count: 0 }),
    esAdmin
      ? supabase.from('ausencias').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente_segundo')
      : Promise.resolve({ count: 0 }),
  ])

  // Compromisos pendientes de reportar en el comité actual/próximo de mi gestión
  const comiteActual = comitesGestion?.[0]
  let compromisosMios = 0
  if (comiteActual && !comiteActual.cerrado) {
    const { count } = await supabase.from('compromisos').select('id', { count: 'exact', head: true })
      .eq('comite_origen_id', comiteActual.id)
      .eq('responsable_id', usuarioId)
      .eq('estado', 'pendiente')
    compromisosMios = count ?? 0
  }

  const tarjetas: TarjetaAccion[] = []

  if ((cuestionariosPendientes ?? 0) > 0) {
    tarjetas.push({
      clave: 'cuestionarios',
      icono: 'target',
      tono: 'primary',
      titulo: 'Cuestionarios de desempeño',
      detalle: `${cuestionariosPendientes} por responder`,
      href: '/desempeno/mis-pendientes',
      cta: 'Responder',
      cuenta: cuestionariosPendientes ?? 0,
    })
  }

  if (compromisosMios > 0 && comiteActual) {
    tarjetas.push({
      clave: 'compromisos',
      icono: 'check',
      tono: 'warning',
      titulo: 'Compromisos por reportar',
      detalle: `${compromisosMios} en el comité de esta semana`,
      href: `/comites/${comiteActual.id}`,
      cta: 'Reportar avance',
      cuenta: compromisosMios,
    })
  }

  if ((ausenciasEsperando ?? 0) > 0) {
    tarjetas.push({
      clave: 'ausencias',
      icono: 'calendar',
      tono: 'neutral',
      titulo: 'Mis ausencias',
      detalle: `${ausenciasEsperando} esperando decisión`,
      href: '/ausencias',
      cta: 'Ver estado',
      cuenta: ausenciasEsperando ?? 0,
    })
  }

  if (esAdmin) {
    if ((docsAprobarAdmin ?? 0) > 0) {
      tarjetas.push({
        clave: 'docs-aprobar',
        icono: 'fileCheck',
        tono: 'primary',
        titulo: 'Documentos por aprobar',
        detalle: `${docsAprobarAdmin} en revisión documental`,
        href: '/admin/aprobaciones',
        cta: 'Revisar',
        cuenta: docsAprobarAdmin ?? 0,
      })
    }
    if ((ausenciasSegundoTH ?? 0) > 0) {
      tarjetas.push({
        clave: 'ausencias-th',
        icono: 'shield',
        tono: 'warning',
        titulo: '2ª validación TH',
        detalle: `${ausenciasSegundoTH} ausencias esperando tu firma`,
        href: '/ausencias/bandeja',
        cta: 'Validar',
        cuenta: ausenciasSegundoTH ?? 0,
      })
    }
  }

  // Sin tarjetas — no renderizar la sección (evita ruido visual)
  if (tarjetas.length === 0) {
    return (
      <section className="dash-section">
        <div className="section-header">
          <h2 className="section-title">Mi día</h2>
        </div>
        <div className="card dash-empty">
          <Icono nombre="check" className="icon" style={{ color: 'var(--success-ink)' }} />
          <div>
            <div className="dash-empty__title">Tu día está limpio.</div>
            <div className="dash-empty__msg">
              No tienes cuestionarios, compromisos ni solicitudes pendientes.
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">
          {esLider || esAdmin ? 'Mi día' : 'Pendiente por hacer'}
        </h2>
        <span className="section-count text-sm">{tarjetas.length}</span>
      </div>
      <div className="dash-bandeja">
        {tarjetas.map(t => (
          <Link key={t.clave} href={t.href} className="dash-tarjeta">
            <div className={`dash-tarjeta__icono dash-tarjeta__icono--${t.tono}`}>
              <Icono nombre={t.icono} className="icon" />
            </div>
            <div className="dash-tarjeta__cuerpo">
              <div className="dash-tarjeta__titulo">{t.titulo}</div>
              <div className="dash-tarjeta__detalle">{t.detalle}</div>
            </div>
            <div className="dash-tarjeta__cta">
              {t.cta}
              <Icono nombre="arrowRight" className="icon icon--sm" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function BandejaAccionSkeleton() {
  return (
    <section className="dash-section">
      <div className="section-header">
        <div className="skeleton skeleton--title" style={{ width: 120 }} />
      </div>
      <div className="dash-bandeja">
        {[0, 1].map(i => (
          <div key={i} className="dash-tarjeta" style={{ pointerEvents: 'none' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton--text" style={{ width: '60%' }} />
              <div className="skeleton skeleton--text" style={{ width: '40%', marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
