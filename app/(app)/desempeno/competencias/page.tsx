import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

type Banda = { codigo: string; nombre: string; descripcion: string; modalidad: string; orden: number; tiene_personal_a_cargo: boolean }
type Competencia = { codigo: string; nombre: string; tipo: string; definicion: string; aplica_a_bandas: string; orden: number }
type Matriz = { banda: string; competencia: string; nivel: number }

export default async function PaginaCompetencias() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const [{ data: bandas }, { data: competencias }, { data: matriz }] = await Promise.all([
    supabase.from('bandas').select('*').order('orden'),
    supabase.from('competencias').select('*').order('orden'),
    supabase.from('matriz_niveles_esperados').select('*'),
  ])

  const Bs = (bandas ?? []) as Banda[]
  const Cs = (competencias ?? []) as Competencia[]
  const M = (matriz ?? []) as Matriz[]

  const nivel = (banda: string, comp: string) =>
    M.find(m => m.banda === banda && m.competencia === comp)?.nivel ?? null

  const colorNivel = (n: number | null) => {
    if (n === null) return { bg: 'var(--surface-sunken)', fg: 'var(--text-muted)' }
    if (n >= 5) return { bg: 'oklch(0.90 0.08 145)', fg: 'oklch(0.30 0.12 145)' }
    if (n >= 4) return { bg: 'var(--primary-soft)', fg: 'var(--primary-ink)' }
    if (n >= 3) return { bg: 'var(--warning-soft)', fg: 'var(--warning-ink)' }
    return { bg: 'var(--danger-soft)', fg: 'var(--danger-ink)' }
  }

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño', href: '/desempeno' }, { etiqueta: 'Modelo de competencias' }]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 28 }}>
          <div className="page__eyebrow">Catálogo</div>
          <h1 className="page__title">Modelo de competencias</h1>
          <p className="page__subtitle">
            8 competencias organizacionales (5 corporativas + 3 gerenciales) y la matriz de niveles esperados por banda de cargo.
          </p>
        </div>

        {/* Matriz */}
        <section className="card card--table" style={{ marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px 12px', borderBottom: '1px solid var(--divider)' }}>
            <div className="page__eyebrow" style={{ marginBottom: 4 }}>Niveles esperados</div>
            <h2 className="section-title" style={{ fontSize: 16 }}>Matriz banda × competencia</h2>
          </div>
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Competencia</th>
                  {Bs.map(b => (
                    <th key={b.codigo} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.codigo}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0, fontWeight: 500, marginTop: 2 }}>{b.nombre}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Cs.map(c => (
                  <tr key={c.codigo}>
                    <td>
                      <div className="row-title">{c.codigo} · {c.nombre}</div>
                      <div className="row-sub">{c.tipo} · {c.aplica_a_bandas}</div>
                    </td>
                    {Bs.map(b => {
                      const n = nivel(b.codigo, c.codigo)
                      const col = colorNivel(n)
                      return (
                        <td key={b.codigo} style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: 8,
                            background: col.bg, color: col.fg, fontWeight: 700, fontSize: 14,
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {n ?? '—'}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 22px', borderTop: '1px solid var(--divider)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-3)' }}>
            <div className="hstack" style={{ gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'oklch(0.90 0.08 145)' }} /> Nivel 5 — Excelente
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--primary-soft)' }} /> Nivel 4 — Competente
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--warning-soft)' }} /> Nivel 3 — Satisfactorio mínimo
            </div>
            <div className="hstack" style={{ gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--surface-sunken)', border: '1px solid var(--border)' }} /> No aplica
            </div>
          </div>
        </section>

        {/* Competencias detalle */}
        <section style={{ marginBottom: 28 }}>
          <div className="page__eyebrow" style={{ marginBottom: 14 }}>Definiciones</div>
          <div className="grid-2col">
            {Cs.map(c => (
              <div key={c.codigo} className="card card--padded-sm">
                <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
                  <div className="icon-circle text-mono font-semibold" style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 13,
                    background: c.tipo === 'Gerencial' ? 'oklch(0.95 0.05 280)' : undefined,
                    color: c.tipo === 'Gerencial' ? 'oklch(0.35 0.10 280)' : undefined,
                  }}>{c.codigo}</div>
                  <strong style={{ fontSize: 14.5 }}>{c.nombre}</strong>
                  <span className="badge badge--neutral badge--no-dot" style={{ marginLeft: 'auto', fontSize: 11 }}>{c.tipo}</span>
                </div>
                <p className="text-sm text-2" style={{ margin: '4px 0 8px', lineHeight: 1.5 }}>{c.definicion}</p>
                <div className="text-xs text-muted text-mono">Aplica a {c.aplica_a_bandas}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Bandas */}
        <section>
          <div className="page__eyebrow" style={{ marginBottom: 14 }}>Bandas de cargo</div>
          <div className="card card--table">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center', width: 110 }}>Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {Bs.map(b => (
                  <tr key={b.codigo}>
                    <td className="font-semibold text-mono">{b.codigo}</td>
                    <td className="row-title">{b.nombre}</td>
                    <td className="text-muted text-sm">{b.descripcion}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge--neutral badge--no-dot text-mono">
                        <Icono nombre="target" className="icon icon--sm" /> {b.modalidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}
