'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import type { EstadoProceso } from '@/types'

interface Gestion { id: string; nombre: string; icono: string; color_soft: string; color_primary: string }
interface Proceso {
  id: string; nombre: string; objetivo: string; version: string
  fecha_actualizacion: string; estado: string
  gestion: Gestion | null
  pasos: { descripcion: string; cargo_responsable: string }[]
}

interface Props {
  procesos: Proceso[]
  gestiones: { id: string; nombre: string }[]
  consultaInicial: string
  puedeCrear: boolean
}

export default function ClienteBusqueda({ procesos, gestiones, consultaInicial, puedeCrear }: Props) {
  const router = useRouter()
  const [qLocal, setQ] = useState(consultaInicial)
  const [ultimaInicial, setUltimaInicial] = useState(consultaInicial)
  const [filtroGestion, setFiltroGestion] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  // Si cambió la consulta inicial (nueva navegación), resincronizamos sin useEffect.
  if (consultaInicial !== ultimaInicial) {
    setUltimaInicial(consultaInicial)
    setQ(consultaInicial)
  }
  const q = qLocal

  const termino = q.trim().toLowerCase()

  const resultados = procesos
    .map(p => {
      const enNombre = p.nombre.toLowerCase().includes(termino)
      const enObjetivo = p.objetivo.toLowerCase().includes(termino)
      const pasosCoincidentes = p.pasos.filter(s => s.descripcion.toLowerCase().includes(termino))
      const puntaje = (enNombre ? 100 : 0) + (enObjetivo ? 30 : 0) + pasosCoincidentes.length * 10
      return { p, enNombre, enObjetivo, pasosCoincidentes, puntaje }
    })
    .filter(r => termino && r.puntaje > 0)
    .filter(r => filtroGestion === 'Todas' || r.p.gestion?.nombre === filtroGestion)
    .filter(r => filtroEstado === 'Todos' || r.p.estado === filtroEstado)
    .sort((a, b) => b.puntaje - a.puntaje)

  function resaltar(texto: string) {
    if (!termino) return <>{texto}</>
    const idx = texto.toLowerCase().indexOf(termino)
    if (idx < 0) return <>{texto}</>
    return (
      <>
        {texto.slice(0, idx)}
        <mark style={{ background: 'oklch(0.94 0.1 90)', color: 'var(--text)', padding: '1px 3px', borderRadius: 3 }}>
          {texto.slice(idx, idx + termino.length)}
        </mark>
        {texto.slice(idx + termino.length)}
      </>
    )
  }

  const porNombre = resultados.filter(r => r.enNombre)
  const porContenido = resultados.filter(r => !r.enNombre)

  return (
    <div className="layout-aside-main">
      {/* Filtros */}
      <aside style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
        <div className="page__eyebrow">Filtros</div>
        <div className="card" style={{ padding: 16, marginTop: 8 }}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field__label">Gestión</label>
            <select className="ca-select" value={filtroGestion} onChange={e => setFiltroGestion(e.target.value)}>
              <option>Todas</option>
              {gestiones.map(g => <option key={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Estado</label>
            <select className="ca-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option>Todos</option>
              <option value="activo">Activo</option>
              <option value="borrador">Borrador</option>
              <option value="desactualizado">Desactualizado</option>
            </select>
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 12, background: 'var(--surface-sunken)' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.5 }}>
            La búsqueda es por <strong style={{ color: 'var(--text-2)' }}>texto simple</strong>. Busca en nombre, objetivo y pasos de cada proceso.
          </div>
        </div>
      </aside>

      <div>
        {/* Barra de búsqueda */}
        <form
          onSubmit={e => { e.preventDefault(); router.push(`/buscar?q=${encodeURIComponent(q)}`) }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '8px 8px 8px 16px', marginBottom: 22 }}
        >
          <Icono nombre="search" className="icon" style={{ color: 'var(--text-3)' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar procesos…"
            autoFocus
            style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 16, padding: '8px 0' }}
          />
          {q && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setQ('')}>
              <Icono nombre="x" className="icon icon--sm" />
            </button>
          )}
        </form>

        <div style={{ marginBottom: 18, fontSize: 13.5, color: 'var(--text-3)' }}>
          {termino
            ? <><strong style={{ color: 'var(--text)' }}>{resultados.length}</strong> resultados para <strong style={{ color: 'var(--text)' }}>&ldquo;{q}&rdquo;</strong></>
            : 'Escribe algo para buscar.'}
        </div>

        {/* Sin resultados */}
        {termino && resultados.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>No encontramos procesos con ese término.</h3>
            <p style={{ color: 'var(--text-3)', margin: 0 }}>Revisa la ortografía o intenta con otra palabra clave.</p>
            {puedeCrear && (
              <Link href="/procesos/nuevo" className="btn btn--primary" style={{ marginTop: 18, display: 'inline-flex' }}>
                <Icono nombre="plus" className="icon icon--sm" /> ¿Quieres crearlo?
              </Link>
            )}
          </div>
        )}

        {/* Resultados por nombre */}
        {porNombre.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Coincidencias por nombre · {porNombre.length}
            </h3>
            <div className="vstack" style={{ gap: 10 }}>
              {porNombre.map(r => <FilaResultado key={r.p.id} r={r} resaltar={resaltar} />)}
            </div>
          </section>
        )}

        {/* Resultados por contenido */}
        {porContenido.length > 0 && (
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Coincidencias por contenido · {porContenido.length}
            </h3>
            <div className="vstack" style={{ gap: 10 }}>
              {porContenido.map(r => <FilaResultado key={r.p.id} r={r} resaltar={resaltar} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function FilaResultado({ r, resaltar }: {
  r: { p: Proceso; pasosCoincidentes: { descripcion: string }[] }
  resaltar: (t: string) => React.ReactNode
}) {
  return (
    <Link href={`/procesos/${r.p.id}`} className="card" style={{ textAlign: 'left', padding: 18, display: 'block' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {r.p.gestion && (
            <div className="hstack" style={{ gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-3)' }}>
              <IconoGestion gestion={r.p.gestion} size={18} rounded={5} />
              {r.p.gestion.nombre}
              <span>·</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>v{r.p.version}</span>
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{resaltar(r.p.nombre)}</div>
          <p style={{ margin: '0 0 8px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{resaltar(r.p.objetivo)}</p>
          {r.pasosCoincidentes.length > 0 && (
            <div style={{ borderLeft: '2px solid var(--primary-soft-2)', paddingLeft: 12, marginTop: 8 }}>
              {r.pasosCoincidentes.slice(0, 2).map((s, i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 4 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Paso:</span>{' '}
                  {resaltar(s.descripcion.length > 130 ? s.descripcion.slice(0, 130) + '…' : s.descripcion)}
                </div>
              ))}
              {r.pasosCoincidentes.length > 2 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>+ {r.pasosCoincidentes.length - 2} más en este proceso</div>
              )}
            </div>
          )}
        </div>
        <BadgeEstado estado={r.p.estado as EstadoProceso} />
      </div>
    </Link>
  )
}
