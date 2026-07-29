import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Icono from '@/components/app/Icono'
import BotonImprimir from './BotonImprimir'

function uno<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
}
function hoyBogota() {
  return new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}

interface FilaCargo {
  tipo: string
  descripcion: string | null
  paso: {
    nombre: string | null
    descripcion: string | null
    numero_orden: number
    periodicidad: string | null
    tiempos: string | null
    entradas: string | null
    salidas: string | null
    proceso: {
      id: string; nombre: string; estado: string
      gestion: { id: string; nombre: string } | { id: string; nombre: string }[] | null
    } | null
  } | null
}

export default async function ImprimirManualCargo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  if (sesion.rol === 'colaborador') redirect(`/cargos/${id}`)

  const supabase = await crearClienteServidor()
  const { data: cargo } = await supabase.from('cargos').select('id, nombre, banda').eq('id', id).maybeSingle()
  if (!cargo) notFound()

  const [{ data: filasRaw }, { data: personas }] = await Promise.all([
    supabase.from('paso_cargos')
      .select(`tipo, descripcion,
        paso:pasos(nombre, descripcion, numero_orden, periodicidad, tiempos, entradas, salidas,
          proceso:procesos(id, nombre, estado, gestion:gestiones(id, nombre)))`)
      .eq('cargo_id', id),
    supabase.from('usuarios').select('nombre, codigo_contrato').eq('cargo_id', id).eq('activo', true).order('nombre'),
  ])

  const filas = ((filasRaw ?? []) as unknown as FilaCargo[])
    .filter(f => f.paso?.proceso && f.paso.proceso.estado === 'activo')

  // Agrupar por gestión → proceso
  const porGestion = new Map<string, { gestion: string; procesos: Map<string, { nombre: string; items: FilaCargo[] }> }>()
  for (const f of filas) {
    const g = uno(f.paso!.proceso!.gestion)
    const gid = g?.id ?? 'sin'
    const grupo = porGestion.get(gid) ?? { gestion: g?.nombre ?? 'Sin gestión', procesos: new Map() }
    const proc = f.paso!.proceso!
    const p = grupo.procesos.get(proc.id) ?? { nombre: proc.nombre, items: [] }
    p.items.push(f)
    grupo.procesos.set(proc.id, p)
    porGestion.set(gid, grupo)
  }

  const responsables = filas.filter(f => f.tipo !== 'apoyo').length
  const apoyos = filas.filter(f => f.tipo === 'apoyo').length

  return (
    <main className="page fade-up">
      <div className="no-print hstack" style={{ gap: 10, marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Link href={`/cargos/${id}`} className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
        </Link>
        <div className="hstack" style={{ gap: 10, alignItems: 'center' }}>
          <span className="text-muted text-sm">Usa &ldquo;Guardar como PDF&rdquo; como destino de impresión.</span>
          <BotonImprimir />
        </div>
      </div>

      {/* ===== Documento oficial ===== */}
      <div className="doc-print">
        <table className="doc-head">
          <tbody>
            <tr>
              <td className="doc-head__marca">
                <Image src="/logo-asignar.png" alt="Asignar S.A.S." width={150} height={150} priority className="doc-head__logo" />
                <span>Talento Humano</span>
              </td>
              <td className="doc-head__titulo">
                <strong>Manual de funciones — {cargo.nombre}</strong>
                <span>Banda {cargo.banda}</span>
              </td>
              <td className="doc-head__control">
                <div><b>Cargo:</b> <span>{cargo.nombre}</span></div>
                <div><b>Funciones:</b> <span>{responsables}{apoyos > 0 ? ` (+${apoyos} apoyo)` : ''}</span></div>
                <div><b>Generado:</b> <span>{hoyBogota()}</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        <section className="doc-seccion">
          <h2>1. Propósito</h2>
          <p>
            Este manual reúne las funciones del cargo <b>{cargo.nombre}</b> tal como quedan definidas en los
            procedimientos vigentes de la organización. Se genera automáticamente desde la documentación,
            por lo que refleja siempre la versión aprobada de cada proceso.
          </p>
        </section>

        {personas && personas.length > 0 && (
          <section className="doc-seccion">
            <h2>2. Personas en el cargo</h2>
            <p>{personas.map(p => `${p.nombre}${p.codigo_contrato ? ` (${p.codigo_contrato})` : ''}`).join(' · ')}</p>
          </section>
        )}

        <section className="doc-seccion">
          <h2>{personas && personas.length > 0 ? '3' : '2'}. Funciones por proceso</h2>
          {filas.length === 0 ? (
            <p>Este cargo aún no aparece en ninguna actividad de un procedimiento publicado.</p>
          ) : (
            [...porGestion.values()]
              .sort((a, b) => a.gestion.localeCompare(b.gestion))
              .map((grupo, gi) => (
                <div key={gi} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 11.5, margin: '8px 0 4px', textTransform: 'uppercase' }}>
                    {grupo.gestion}
                  </div>
                  {[...grupo.procesos.values()].map((proc, pi) => (
                    <div key={pi} style={{ marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 11, marginBottom: 2 }}>{proc.nombre}</div>
                      <table className="doc-tabla">
                        <thead>
                          <tr>
                            <th className="doc-tabla__num">Nº</th>
                            <th style={{ width: '32%' }}>Actividad</th>
                            <th>Función del cargo</th>
                            <th style={{ width: '14%' }}>Periodicidad</th>
                            <th style={{ width: '12%' }}>Tiempo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proc.items
                            .sort((a, b) => (a.paso?.numero_orden ?? 0) - (b.paso?.numero_orden ?? 0))
                            .map((f, i) => (
                              <tr key={i}>
                                <td className="doc-tabla__num">{f.paso?.numero_orden}</td>
                                <td>
                                  {f.paso?.nombre || '—'}
                                  {f.tipo === 'apoyo' && <span className="doc-dato"> · apoyo</span>}
                                </td>
                                <td>{f.descripcion || f.paso?.descripcion || '—'}</td>
                                <td>{f.paso?.periodicidad || '—'}</td>
                                <td>{f.paso?.tiempos || '—'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))
          )}
        </section>

        <div className="doc-pie">
          <span>{cargo.nombre} · Banda {cargo.banda}</span>
          <span>Manual generado desde la documentación vigente — Cerebro Asignar</span>
        </div>
      </div>
    </main>
  )
}
