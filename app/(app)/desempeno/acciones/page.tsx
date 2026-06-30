import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

type Accion = {
  id: string
  competencia: string
  tipo: string
  nombre: string
  descripcion: string
  duracion: string | null
  banda_min: string
  banda_max: string
  prioridad_min: string
  esfuerzo_th: string
}
type Comp = { codigo: string; nombre: string; orden: number }

const tipoColor: Record<string, { bg: string; fg: string }> = {
  'Lectura':      { bg: 'oklch(0.95 0.04 250)', fg: 'oklch(0.32 0.10 250)' },
  'Curso':        { bg: 'oklch(0.95 0.05 280)', fg: 'oklch(0.32 0.10 280)' },
  'Aplicación':   { bg: 'oklch(0.95 0.05 155)', fg: 'oklch(0.30 0.10 155)' },
  'Feedback':     { bg: 'oklch(0.95 0.05 70)',  fg: 'oklch(0.35 0.13 60)'  },
  'Mentoría':     { bg: 'oklch(0.95 0.05 25)',  fg: 'oklch(0.35 0.14 25)'  },
  'Asignación':   { bg: 'oklch(0.95 0.04 195)', fg: 'oklch(0.30 0.10 195)' },
  'Reto':         { bg: 'oklch(0.94 0.06 30)',  fg: 'oklch(0.38 0.14 25)'  },
  'Voluntariado': { bg: 'oklch(0.96 0.04 130)', fg: 'oklch(0.30 0.10 145)' },
  'Programa':     { bg: 'oklch(0.93 0.07 320)', fg: 'oklch(0.32 0.10 320)' },
}

const prioridadColor: Record<string, string> = {
  'Monitorear':     'var(--text-3)',
  'Desarrollar':    'var(--primary)',
  'Prioridad alta': 'var(--danger)',
}

const esfuerzoColor: Record<string, string> = {
  'Bajo':  'var(--success-ink)',
  'Medio': 'var(--warning-ink)',
  'Alto':  'var(--danger-ink)',
}

export default async function PaginaAcciones() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const [{ data: acciones }, { data: competencias }] = await Promise.all([
    supabase.from('acciones_desarrollo').select('*').eq('activo', true).order('id'),
    supabase.from('competencias').select('codigo, nombre, orden').order('orden'),
  ])

  const As = (acciones ?? []) as Accion[]
  const Cs = (competencias ?? []) as Comp[]
  const compNombre = (codigo: string) => Cs.find(c => c.codigo === codigo)?.nombre ?? codigo

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño', href: '/desempeno' }, { etiqueta: 'Acciones de desarrollo' }]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 28 }}>
          <div className="page__eyebrow">Catálogo</div>
          <h1 className="page__title">Acciones de desarrollo · {As.length}</h1>
          <p className="page__subtitle">
            Catálogo curado por competencia, banda y tipo. El motor de cálculo elige las 3 acciones más relevantes
            (TOP 3) para construir el PDI de cada colaborador.
          </p>
        </div>

        <div className="card card--table">
          <table className="table table--in-card">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Acción</th>
                <th style={{ width: 110 }}>Tipo</th>
                <th style={{ width: 90 }}>Bandas</th>
                <th style={{ width: 130 }}>Prioridad mín.</th>
                <th style={{ width: 100 }}>Esfuerzo TH</th>
                <th style={{ width: 110 }}>Duración</th>
              </tr>
            </thead>
            <tbody>
              {As.map(a => {
                const tc = tipoColor[a.tipo] ?? { bg: 'var(--surface-sunken)', fg: 'var(--text-2)' }
                return (
                  <tr key={a.id}>
                    <td className="text-mono font-semibold text-sm">{a.id}</td>
                    <td>
                      <div className="row-title">{a.nombre}</div>
                      <div className="row-sub">
                        {a.competencia} · {compNombre(a.competencia)}
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: 4, lineHeight: 1.4 }}>{a.descripcion}</div>
                    </td>
                    <td>
                      <span className="badge badge--no-dot" style={{ background: tc.bg, color: tc.fg, fontSize: 11.5 }}>
                        {a.tipo}
                      </span>
                    </td>
                    <td className="text-mono text-sm text-2">
                      {a.banda_min}–{a.banda_max}
                    </td>
                    <td>
                      <span className="hstack" style={{ gap: 6, fontSize: 12.5, color: prioridadColor[a.prioridad_min] ?? 'var(--text-3)' }}>
                        <Icono nombre="target" className="icon icon--sm" /> {a.prioridad_min}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: esfuerzoColor[a.esfuerzo_th] ?? 'var(--text-3)' }}>
                        {a.esfuerzo_th}
                      </span>
                    </td>
                    <td className="text-xs text-muted text-mono">{a.duracion ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
