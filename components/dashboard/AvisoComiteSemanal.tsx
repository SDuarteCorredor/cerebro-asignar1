import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'
import { calcularPonderado, semanaISOde } from '@/lib/comites/puntaje'

interface Props {
  usuarioId: string
  esAdmin: boolean
}

interface Aviso {
  gestion_id: string
  gestion_nombre: string
  tipo: 'crear' | 'cerrar' | 'reportar_pendiente'
  comite_id?: string
  detalle: string
}

/** Aviso operativo: al líder le falta crear el comité de la semana, o hay uno con
 *  todos los compromisos evaluados listo para cerrar. Admin ve todas las gestiones. */
export default async function AvisoComiteSemanal({ usuarioId, esAdmin }: Props) {
  const supabase = await crearClienteServidor()

  // Gestiones donde el usuario es líder (o todas si es admin)
  const { data: gestiones } = esAdmin
    ? await supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre')
    : await supabase.from('gestiones').select('id, nombre').eq('lider_id', usuarioId).eq('activa', true)

  if (!gestiones || gestiones.length === 0) return null

  const hoy = new Date()
  const { semana: semanaActual, anio: anioActual } = semanaISOde(hoy)
  const avisos: Aviso[] = []

  // Último comité de cada gestión + sus compromisos
  for (const g of gestiones) {
    const { data: ultimo } = await supabase
      .from('comites')
      .select('id, fecha, semana_iso, anio, cerrado')
      .eq('gestion_id', g.id)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Sin comités todavía en esa gestión: no avisamos (podría ser una gestión nueva)
    if (!ultimo) continue

    const esDeEstaSemana = ultimo.semana_iso === semanaActual && ultimo.anio === anioActual

    // Caso 1: no hay comité de esta semana → toca crear
    if (!esDeEstaSemana) {
      avisos.push({
        gestion_id: g.id,
        gestion_nombre: g.nombre,
        tipo: 'crear',
        detalle: `Última acta: W${ultimo.semana_iso}/${ultimo.anio}`,
      })
      continue
    }

    // Caso 2: es de esta semana. ¿Está listo para cerrar?
    if (!ultimo.cerrado) {
      const { data: comps } = await supabase
        .from('compromisos').select('estado, impacto')
        .eq('comite_origen_id', ultimo.id)
      const stats = calcularPonderado(comps ?? [])
      if (stats.total > 0 && stats.evaluados === stats.total) {
        avisos.push({
          gestion_id: g.id,
          gestion_nombre: g.nombre,
          tipo: 'cerrar',
          comite_id: ultimo.id,
          detalle: `Todos los compromisos evaluados · ${stats.pctPonderado ?? 0}%`,
        })
      }
    }
  }

  if (avisos.length === 0) return null

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Comités de esta semana</h2>
        <span className="section-count text-sm">{avisos.length}</span>
      </div>
      <div className="dash-aviso-grid">
        {avisos.map(a => {
          const clase = a.tipo === 'crear' ? 'dash-aviso--info' : 'dash-aviso--success'
          const icono = a.tipo === 'crear' ? 'plus' : 'check'
          const titulo = a.tipo === 'crear'
            ? `Falta el acta de ${a.gestion_nombre}`
            : `Cerrar el comité de ${a.gestion_nombre}`
          const cta = a.tipo === 'crear' ? 'Crear acta' : 'Cerrar comité'
          const href = a.tipo === 'crear'
            ? `/comites/nuevo?gestion=${a.gestion_id}`
            : `/comites/${a.comite_id}`

          return (
            <Link key={`${a.gestion_id}-${a.tipo}`} href={href} className={`card dash-aviso ${clase}`}>
              <div className="dash-aviso__icono">
                <Icono nombre={icono} className="icon" />
              </div>
              <div className="dash-aviso__cuerpo">
                <div className="dash-aviso__titulo">{titulo}</div>
                <div className="dash-aviso__detalle">{a.detalle}</div>
              </div>
              <div className="dash-aviso__cta">
                {cta}
                <Icono nombre="arrowRight" className="icon icon--sm" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
