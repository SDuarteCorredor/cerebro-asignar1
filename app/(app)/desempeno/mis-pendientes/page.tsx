import { redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const colorTipo: Record<string, { bg: string; fg: string; etiqueta: string }> = {
  'Jefe inmediato':  { bg: 'oklch(0.95 0.04 250)', fg: 'oklch(0.32 0.10 250)', etiqueta: 'Como jefe' },
  'Par':             { bg: 'oklch(0.95 0.05 280)', fg: 'oklch(0.32 0.10 280)', etiqueta: 'Como par' },
  'Reporte directo': { bg: 'oklch(0.95 0.05 155)', fg: 'oklch(0.30 0.10 155)', etiqueta: 'Como reporte' },
  'Autoevaluación':  { bg: 'oklch(0.95 0.05 70)',  fg: 'oklch(0.35 0.13 60)',  etiqueta: 'Autoevaluación' },
}

export default async function PaginaMisPendientes() {
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

  // Planes asignados al usuario actual
  const { data: planes } = await supabase
    .from('plan_evaluacion')
    .select('id, evaluacion_id, tipo_evaluador, estado, fecha_respuesta')
    .eq('evaluador_id', user.id)
    .order('estado')

  // Evaluaciones para conocer al colaborador evaluado
  const evalIds = (planes ?? []).map(p => p.evaluacion_id)
  const [{ data: evaluaciones }, { data: ciclos }, { data: usuariosBd }] = await Promise.all([
    evalIds.length > 0
      ? supabase.from('evaluaciones').select('id, ciclo_id, colaborador_id').in('id', evalIds)
      : Promise.resolve({ data: [] as { id: string; ciclo_id: string; colaborador_id: string }[] }),
    supabase.from('ciclos_evaluacion').select('id, nombre, fecha_fin_captura'),
    supabase.from('usuarios').select('id, nombre, codigo_contrato'),
  ])

  const mapEval = new Map((evaluaciones ?? []).map(e => [e.id, e]))
  const mapCiclo = new Map((ciclos ?? []).map(c => [c.id, c]))
  const mapUsr = new Map((usuariosBd ?? []).map(u => [u.id, u]))

  const items = (planes ?? []).map(p => {
    const ev = mapEval.get(p.evaluacion_id)
    const colab = ev ? mapUsr.get(ev.colaborador_id) : null
    const ciclo = ev ? mapCiclo.get(ev.ciclo_id) : null
    return {
      plan_id: p.id,
      tipo: p.tipo_evaluador,
      estado: p.estado,
      fecha_respuesta: p.fecha_respuesta,
      colaborador_nombre: colab?.nombre ?? '?',
      colaborador_codigo: colab?.codigo_contrato ?? null,
      ciclo_nombre: ciclo?.nombre ?? '?',
      ciclo_id: ciclo?.id ?? null,
      fecha_fin_captura: ciclo?.fecha_fin_captura ?? null,
    }
  })

  const pendientes = items.filter(i => i.estado === 'Pendiente')
  const respondidas = items.filter(i => i.estado === 'Respondida')

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño', href: '/desempeno' }, { etiqueta: 'Mis pendientes' }]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 28 }}>
          <div className="page__eyebrow">ECO-Asignar</div>
          <h1 className="page__title">Mis cuestionarios</h1>
          <p className="page__subtitle">
            Aquí encuentras las evaluaciones que te asignaron. Responde con sinceridad — el evaluado nunca verá quién le calificó qué.
          </p>
        </div>

        {/* KPI bar */}
        <div className="grid-stats-3" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning-ink)' }}>{pendientes.length}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Pendientes por responder</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success-ink)' }}>{respondidas.length}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Respondidas</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{items.length}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Total asignados</div>
          </div>
        </div>

        {/* Pendientes */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Pendientes ({pendientes.length})</h2>
          {pendientes.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <Icono nombre="check" className="icon icon--lg" style={{ marginBottom: 8, color: 'var(--success-ink)' }} />
              <div style={{ fontSize: 14 }}>No tienes cuestionarios pendientes 🎉</div>
            </div>
          ) : (
            <div className="vstack" style={{ gap: 10 }}>
              {pendientes.map(item => {
                const tipo = colorTipo[item.tipo] ?? { bg: 'var(--surface-sunken)', fg: 'var(--text-2)', etiqueta: item.tipo }
                return (
                  <Link
                    key={item.plan_id}
                    href={`/desempeno/cuestionarios/${item.plan_id}`}
                    className="card"
                    style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', transition: 'border-color 120ms' }}
                  >
                    <div>
                      <div className="hstack" style={{ gap: 8, marginBottom: 6 }}>
                        <span className="badge badge--no-dot" style={{ background: tipo.bg, color: tipo.fg, fontSize: 11.5 }}>
                          {tipo.etiqueta}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.ciclo_nombre}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {item.tipo === 'Autoevaluación' ? 'Tú mismo' : item.colaborador_nombre}
                      </div>
                      {item.tipo !== 'Autoevaluación' && item.colaborador_codigo && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                          {item.colaborador_codigo}
                        </div>
                      )}
                      {item.fecha_fin_captura && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>
                          Cierre: {item.fecha_fin_captura}
                        </div>
                      )}
                    </div>
                    <div className="hstack" style={{ gap: 8 }}>
                      <span className="badge badge--warning badge--no-dot">Pendiente</span>
                      <Icono nombre="arrowRight" className="icon icon--sm" style={{ color: 'var(--primary)' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Respondidas */}
        {respondidas.length > 0 && (
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'var(--text-3)' }}>Ya respondiste ({respondidas.length})</h2>
            <div className="vstack" style={{ gap: 8 }}>
              {respondidas.map(item => {
                const tipo = colorTipo[item.tipo] ?? { bg: 'var(--surface-sunken)', fg: 'var(--text-2)', etiqueta: item.tipo }
                return (
                  <div key={item.plan_id} className="card" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', opacity: 0.75 }}>
                    <div>
                      <div className="hstack" style={{ gap: 8 }}>
                        <span className="badge badge--no-dot" style={{ background: tipo.bg, color: tipo.fg, fontSize: 11 }}>
                          {tipo.etiqueta}
                        </span>
                        <span style={{ fontSize: 13 }}>{item.tipo === 'Autoevaluación' ? 'Tú mismo' : item.colaborador_nombre}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>· {item.ciclo_nombre}</span>
                      </div>
                    </div>
                    <span className="badge badge--success badge--no-dot">
                      <Icono nombre="check" className="icon icon--sm" /> Respondida
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
