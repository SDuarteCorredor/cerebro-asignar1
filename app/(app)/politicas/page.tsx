import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'

const ICONO_CATEGORIA: Record<string, string> = {
  'Reglamento': 'book',
  'Política': 'paper',
  'Manual': 'clipboard',
  'Circular': 'bell',
  'Código': 'target',
}

export default async function PaginaPoliticas({ searchParams }: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const sesion = await obtenerSesion()
  const { q, cat } = await searchParams
  const supabase = await crearClienteServidor()

  let query = supabase
    .from('politicas')
    .select('id, nombre, categoria, descripcion, version_actual, updated_at')
    .eq('activo', true)
    .order('categoria').order('nombre')

  if (cat) query = query.eq('categoria', cat)
  if (q) query = query.ilike('nombre', `%${q}%`)

  const { data: politicas } = await query

  const porCategoria = new Map<string, typeof politicas>()
  for (const p of politicas ?? []) {
    const arr = porCategoria.get(p.categoria) ?? []
    arr.push(p)
    porCategoria.set(p.categoria, arr)
  }

  const categorias = ['Reglamento', 'Política', 'Manual', 'Circular', 'Código'] as const
  const esAdmin = sesion.rol === 'admin'

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Políticas y Reglamentos' }]} />
      <main className="page fade-up">
        <div className="hstack" style={{ marginBottom: 20, justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="page__eyebrow">Repositorio oficial</div>
            <h1 className="page__title">Políticas y Reglamentos</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Consulta y descarga los documentos vigentes de Asignar SAS.
            </p>
          </div>
          {esAdmin && (
            <Link href="/admin/politicas" className="btn btn--primary btn--sm">
              Administrar
            </Link>
          )}
        </div>

        {/* Filtros */}
        <form className="hstack" style={{ gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar por nombre…"
            className="input"
            style={{ minWidth: 240, flex: 1, maxWidth: 380 }}
          />
          <select name="cat" defaultValue={cat ?? ''} className="input" style={{ maxWidth: 200 }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn btn--ghost btn--sm">Filtrar</button>
        </form>

        {(!politicas || politicas.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              {q || cat ? 'Sin resultados con esos filtros.' : 'Aún no hay documentos publicados.'}
            </p>
          </section>
        ) : (
          categorias.filter(c => porCategoria.has(c)).map(c => (
            <section key={c} style={{ marginBottom: 28 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <div className="hstack" style={{ gap: 8 }}>
                  <Icono nombre={ICONO_CATEGORIA[c]} className="icon" />
                  <div className="page__eyebrow" style={{ margin: 0 }}>{c}</div>
                </div>
                <span className="section-count">{porCategoria.get(c)?.length ?? 0}</span>
              </div>
              <div className="grid-cards">
                {(porCategoria.get(c) ?? []).map(p => (
                  <Link key={p.id} href={`/politicas/${p.id}`} className="card" style={{ padding: 18, display: 'block' }}>
                    <div className="hstack" style={{ gap: 10, marginBottom: 10 }}>
                      <div className="icon-circle"><Icono nombre={ICONO_CATEGORIA[c]} className="icon" /></div>
                      <span className="badge badge--neutral badge--no-dot" style={{ marginLeft: 'auto', fontSize: 11 }}>
                        v{p.version_actual}
                      </span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{p.nombre}</h3>
                    {p.descripcion && (
                      <p className="text-muted text-sm" style={{ margin: 0, lineHeight: 1.4 }}>{p.descripcion}</p>
                    )}
                    <div className="hstack font-semibold text-sm" style={{ marginTop: 12, color: 'var(--primary)' }}>
                      Ver detalle <Icono nombre="arrowRight" className="icon icon--sm" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  )
}
