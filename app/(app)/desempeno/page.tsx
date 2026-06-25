import { redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export default async function PaginaDesempeno() {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

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
    .eq('evaluador_id', user.id)
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
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="page__eyebrow" style={{ margin: 0 }}>Catálogos · Etapa A</div>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Configuración del modelo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {catalogos.map(c => (
              <Link key={c.href} href={c.href} className="card" style={{
                padding: 22, transition: 'border-color 120ms, transform 120ms', display: 'block',
                ...(c.destacado ? { borderColor: 'var(--warning)', background: 'var(--warning-soft)' } : {}),
              }}>
                <div className="hstack" style={{ gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: c.destacado ? 'var(--warning)' : 'var(--primary-soft)',
                    color: c.destacado ? '#fff' : 'var(--primary-ink)',
                    display: 'grid', placeItems: 'center',
                  }}>
                    <Icono nombre={c.icono} className="icon" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.destacado ? 'var(--warning-ink)' : 'var(--text-3)' }}>{c.sub}</div>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.titulo}</h3>
                <p style={{ margin: 0, fontSize: 13.5, color: c.destacado ? 'var(--warning-ink)' : 'var(--text-3)', lineHeight: 1.5 }}>{c.desc}</p>
                <div className="hstack" style={{ marginTop: 14, color: c.destacado ? 'var(--warning-ink)' : 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
                  {c.destacado ? 'Responder ahora' : 'Abrir'} <Icono nombre="arrowRight" className="icon icon--sm" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="page__eyebrow" style={{ marginBottom: 14 }}>Próximas etapas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {proximos.map(p => (
              <div key={p.titulo} className="card" style={{ padding: 18, opacity: 0.7 }}>
                <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                  <Icono nombre={p.icono} className="icon" style={{ color: 'var(--text-3)' }} />
                  <strong style={{ fontSize: 14 }}>{p.titulo}</strong>
                  <span className="nav-item__pill" style={{ marginLeft: 'auto' }}>Pronto</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.4 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
