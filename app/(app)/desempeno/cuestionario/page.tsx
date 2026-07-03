import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'

type Item = { id: string; competencia: string; numero: number; texto_tercero: string; texto_primera: string }
type Comp = { codigo: string; nombre: string; tipo: string; orden: number }

export default async function PaginaCuestionario() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const [{ data: items }, { data: competencias }] = await Promise.all([
    supabase.from('items_cuestionario').select('*').order('competencia').order('numero'),
    supabase.from('competencias').select('*').order('orden'),
  ])

  const Is = (items ?? []) as Item[]
  const Cs = (competencias ?? []) as Comp[]
  const porComp = Cs.map(c => ({ comp: c, items: Is.filter(i => i.competencia === c.codigo).sort((a, b) => a.numero - b.numero) }))

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Desempeño', href: '/desempeno' }, { etiqueta: 'Cuestionario' }]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 28 }}>
          <div className="page__eyebrow">Catálogo</div>
          <h1 className="page__title">Cuestionario · {Is.length} ítems</h1>
          <p className="page__subtitle">
            Cada ítem tiene dos redacciones: <strong>tercera persona</strong> para jefes, pares y reportes;
            <strong> primera persona</strong> para la autoevaluación. Escala 1-5 (Nunca → Siempre).
          </p>
        </div>

        <div className="vstack" style={{ gap: 20 }}>
          {porComp.map(({ comp, items }) => (
            <section key={comp.codigo} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--divider)', background: 'var(--surface-sunken)' }}>
                <div className="hstack" style={{ gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: comp.tipo === 'Gerencial' ? 'oklch(0.92 0.07 280)' : 'var(--primary-soft-2)',
                    color: comp.tipo === 'Gerencial' ? 'oklch(0.30 0.10 280)' : 'var(--primary-ink)',
                    display: 'grid', placeItems: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  }}>{comp.codigo}</div>
                  <div>
                    <strong style={{ fontSize: 15 }}>{comp.nombre}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{comp.tipo} · {items.length} ítems</div>
                  </div>
                </div>
              </div>
              <div>
                {items.map((it, idx) => (
                  <div key={it.id} className="form-row-cuestionario" style={{
                    padding: '14px 22px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: 'var(--surface-sunken)', border: '1px solid var(--border)',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)',
                    }}>{it.numero}</div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tercera persona</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>{it.texto_tercero}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Autoevaluación</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-2)' }}>{it.texto_primera}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  )
}
