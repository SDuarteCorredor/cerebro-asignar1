import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

export default async function PaginaDesempeno() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const [bandas, competencias, items, acciones] = await Promise.all([
    supabase.from('bandas').select('codigo', { count: 'exact', head: true }),
    supabase.from('competencias').select('codigo', { count: 'exact', head: true }),
    supabase.from('items_cuestionario').select('id', { count: 'exact', head: true }),
    supabase.from('acciones_desarrollo').select('id', { count: 'exact', head: true }),
  ])
  const { count: ciclosCount } = await supabase
    .from('ciclos_evaluacion').select('id', { count: 'exact', head: true })
  const { count: misPendientes } = await supabase
    .from('plan_evaluacion')
    .select('id', { count: 'exact', head: true })
    .eq('evaluador_id', sesion.id)
    .eq('estado', 'Pendiente')

  const catalogos = [
    { href: '/desempeno/mis-pendientes', icono: 'edit', titulo: 'Mis cuestionarios', sub: `${misPendientes ?? 0} pendientes por responder`, desc: 'Responde los cuestionarios que te asignaron en los ciclos activos.', destacado: (misPendientes ?? 0) > 0 },
    { href: '/desempeno/ciclos', icono: 'history', titulo: 'Ciclos de evaluación', sub: `${ciclosCount ?? 0} ciclos`, desc: 'Crear ciclos, instanciar evaluaciones y asignar evaluadores.', destacado: false },
    { href: '/desempeno/competencias', icono: 'target', titulo: 'Modelo de competencias', sub: `${competencias.count ?? 0} competencias · ${bandas.count ?? 0} bandas`, desc: 'Las 8 competencias organizacionales y la matriz de niveles esperados por banda.', destacado: false },
    { href: '/desempeno/cuestionario', icono: 'clipboard', titulo: 'Cuestionario', sub: `${items.count ?? 0} ítems`, desc: 'Los ítems con doble redacción (tercera persona y primera persona).', destacado: false },
    { href: '/desempeno/acciones', icono: 'bookmark', titulo: 'Acciones de desarrollo', sub: `${acciones.count ?? 0} acciones`, desc: 'Catálogo de acciones por competencia y banda para construir los PDIs.', destacado: false },
  ]

  const proximos = [
    { icono: 'chart', titulo: 'Reporte individual', desc: 'Radar actual vs esperado, brechas y TOP 3 de acciones.' },
    { icono: 'paper', titulo: 'Plan de Desarrollo Individual', desc: 'PDI con firmas y seguimiento mensual.' },
  ]

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño' }]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 28 }}>
          <div className="page__eyebrow">ECO-Asignar</div>
          <h1 className="page__title">Evaluación de Competencias</h1>
          <p className="page__subtitle">
            Mide las competencias organizacionales de cada colaborador, compara contra el nivel esperado del cargo,
            identifica brechas y genera un Plan de Desarrollo Individual.
          </p>
        </div>

        <section style={{ marginBottom: 32 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Catálogos · Etapa A</div>
            <span className="section-count">Configuración del modelo</span>
          </div>
          <div className="grid-3col">
            {catalogos.map(c => (
              <Link key={c.href} href={c.href} className="card" style={{
                padding: 22, transition: 'border-color 120ms, transform 120ms', display: 'block',
                ...(c.destacado ? { borderColor: 'var(--warning)', background: 'var(--warning-soft)' } : {}),
              }}>
                <div className="hstack" style={{ gap: 10, marginBottom: 12 }}>
                  <div className="icon-circle" style={c.destacado ? { background: 'var(--warning)', color: '#fff' } : undefined}>
                    <Icono nombre={c.icono} className="icon" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }} className={c.destacado ? '' : 'text-muted'}>{c.sub}</div>
                </div>
                <h3 className="section-title" style={{ marginBottom: 6, fontSize: 16 }}>{c.titulo}</h3>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: c.destacado ? 'var(--warning-ink)' : undefined }} className={c.destacado ? '' : 'text-muted'}>{c.desc}</p>
                <div className="hstack font-semibold text-sm" style={{ marginTop: 14, color: c.destacado ? 'var(--warning-ink)' : 'var(--primary)' }}>
                  {c.destacado ? 'Responder ahora' : 'Abrir'} <Icono nombre="arrowRight" className="icon icon--sm" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="page__eyebrow" style={{ marginBottom: 14 }}>Próximas etapas</div>
          <div className="grid-2col">
            {proximos.map(p => (
              <div key={p.titulo} className="card card--padded-sm" style={{ opacity: 0.7 }}>
                <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                  <Icono nombre={p.icono} className="icon text-muted" />
                  <strong style={{ fontSize: 14 }}>{p.titulo}</strong>
                  <span className="nav-item__pill" style={{ marginLeft: 'auto' }}>Pronto</span>
                </div>
                <p className="text-muted text-sm" style={{ margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
