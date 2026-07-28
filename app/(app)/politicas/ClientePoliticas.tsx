'use client'

import Link from 'next/link'
import Icono from '@/components/app/Icono'
import SelectorVista, { useVista } from '@/components/app/SelectorVista'

export interface FilaPolitica {
  id: string
  nombre: string
  categoria: string
  descripcion: string | null
  version_actual: string
  updated_at: string | null
}

/** Cada categoría tiene su glifo. Los nombres deben existir en `Icono.tsx`;
 *  si alguno se renombra, el componente cae en un documento genérico. */
export const ICONO_CATEGORIA: Record<string, string> = {
  'Reglamento': 'book',
  'Política': 'paper',
  'Manual': 'clipboard',
  'Circular': 'bell',
  'Código': 'target',
}

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

export default function ClientePoliticas({ politicas, categorias }: {
  politicas: FilaPolitica[]
  categorias: readonly string[]
}) {
  const [vista, setVista] = useVista('vista:politicas', 'tarjetas')

  const porCategoria = new Map<string, FilaPolitica[]>()
  for (const p of politicas) {
    const arr = porCategoria.get(p.categoria) ?? []
    arr.push(p)
    porCategoria.set(p.categoria, arr)
  }

  return (
    <>
      <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <span className="section-count">{politicas.length} documentos</span>
        <SelectorVista vista={vista} onCambio={setVista} />
      </div>

      {vista === 'lista' ? (
        <div className="card card--table">
          <div className="table-scroll">
            <table className="table table--in-card">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Categoría</th>
                  <th>Versión</th>
                  <th>Actualizado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {politicas.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <Link href={`/politicas/${p.id}`} style={{ display: 'block' }}>
                        <div className="hstack">
                          <div className="icon-circle" style={{ width: 30, height: 30, borderRadius: 8 }}>
                            <Icono nombre={ICONO_CATEGORIA[p.categoria] ?? 'paper'} className="icon icon--sm" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="row-title">{p.nombre}</div>
                            {p.descripcion && (
                              <div className="row-sub" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td><span className="badge badge--neutral badge--no-dot">{p.categoria}</span></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>v{p.version_actual}</td>
                    <td style={{ color: 'var(--text-3)' }}>{fecha(p.updated_at)}</td>
                    <td>
                      <Link href={`/politicas/${p.id}`} aria-label={`Ver ${p.nombre}`}>
                        <Icono nombre="chevronRight" className="icon icon--sm" style={{ color: 'var(--text-muted)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        categorias.filter(c => porCategoria.has(c)).map(c => (
          <section key={c} style={{ marginBottom: 'var(--sp-7)' }}>
            <div className="section-header" style={{ marginBottom: 'var(--sp-3)' }}>
              <div className="hstack" style={{ gap: 8 }}>
                <Icono nombre={ICONO_CATEGORIA[c] ?? 'paper'} className="icon" style={{ color: 'var(--primary)' }} />
                <div className="page__eyebrow" style={{ margin: 0 }}>{c}</div>
              </div>
              <span className="section-count">{porCategoria.get(c)?.length ?? 0}</span>
            </div>
            <div className="grid-cards">
              {(porCategoria.get(c) ?? []).map(p => (
                <Link key={p.id} href={`/politicas/${p.id}`} className="card card--interactiva" style={{ padding: 18, display: 'block' }}>
                  <div className="hstack" style={{ gap: 10, marginBottom: 10 }}>
                    <div className="icon-circle"><Icono nombre={ICONO_CATEGORIA[c] ?? 'paper'} className="icon" /></div>
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
    </>
  )
}
