import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Icono from '@/components/app/Icono'
import BotonImprimir from './BotonImprimir'

/** Fechas tipo DATE ('YYYY-MM-DD') → 'DD/MM/YYYY' sin pasar por Date (evita el corrimiento de zona horaria). */
function fFecha(d?: string | null) {
  if (!d) return '—'
  const [a, m, dia] = d.split('-')
  return a && m && dia ? `${dia}/${m}/${a}` : d
}

interface PasoDoc {
  id: string
  numero_orden: number
  nombre: string | null
  descripcion: string | null
  cargo_responsable: string | null
  entradas: string | null
  periodicidad: string | null
  salidas: string | null
  acuerdo_servicio: string | null
  tiempos: string | null
}

export default async function PaginaImprimirProceso({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: proceso } = await supabase
    .from('procesos')
    .select(`
      *,
      gestion:gestiones(id, nombre),
      pasos(id, numero_orden, nombre, descripcion, cargo_responsable, entradas, periodicidad, salidas, acuerdo_servicio, tiempos),
      documentos(id, nombre, tipo_archivo),
      tipo_documento:tipos_documento(nombre, prefijo)
    `)
    .eq('id', id)
    .single()

  if (!proceso) notFound()

  const puedeVer = proceso.estado === 'activo'
    || sesion.rol === 'admin'
    || (sesion.rol === 'lider' && sesion.gestion_id === proceso.gestion_id)
  if (!puedeVer) notFound()

  const { data: historial } = await supabase
    .from('historial_versiones')
    .select('id, version_anterior, version_nueva, fecha_cambio, resumen_cambio, usuario:usuarios(nombre)')
    .eq('proceso_id', id)
    .order('fecha_cambio', { ascending: false })

  // Supabase devuelve las relaciones como arrays
  const gRaw = proceso.gestion as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
  const gestion = Array.isArray(gRaw) ? (gRaw[0] ?? null) : gRaw
  const tdRaw = proceso.tipo_documento as unknown as { nombre: string; prefijo: string }[] | { nombre: string; prefijo: string } | null
  const tipoDoc = Array.isArray(tdRaw) ? (tdRaw[0] ?? null) : tdRaw

  const pasos = ((proceso.pasos ?? []) as PasoDoc[]).sort((a, b) => a.numero_orden - b.numero_orden)
  const documentos = (proceso.documentos ?? []) as { id: string; nombre: string; tipo_archivo: string }[]
  const esCliente = proceso.es_proceso_cliente === true
  const contactos = (proceso.cliente_contactos as { nombre: string; telefono: string; correo: string }[]) ?? []

  const cambios = (historial ?? []).map(h => {
    const uRaw = h.usuario as unknown as { nombre: string }[] | { nombre: string } | null
    const usuario = Array.isArray(uRaw) ? (uRaw[0] ?? null) : uRaw
    return { ...h, usuarioNombre: usuario?.nombre ?? 'Sistema' }
  })

  // La firma se guarda como "Nombre — ISO"
  const [firmanteNombre, firmanteFecha] = (proceso.firma_aprobacion as string | null)?.split(' — ') ?? []

  const secciones = ((proceso.secciones ?? []) as { titulo: string; contenido: string }[])
    .filter(s => s.titulo?.trim() || s.contenido?.trim())

  // Numeración corrida: las secciones del documento son variables según el tipo
  let nSec = 0
  const nx = () => ++nSec

  return (
    <main className="page fade-up">
      {/* Barra de acciones — no se imprime */}
      <div className="no-print hstack" style={{ gap: 10, marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Link href={`/procesos/${id}`} className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver al proceso
        </Link>
        <div className="hstack" style={{ gap: 10, alignItems: 'center' }}>
          <span className="text-muted text-sm">
            Usa &ldquo;Guardar como PDF&rdquo; como destino de impresión.
          </span>
          <BotonImprimir />
        </div>
      </div>

      {proceso.estado !== 'activo' && (
        <div className="no-print card" style={{ padding: 12, marginBottom: 16, background: 'var(--warning-soft)', border: '1px solid var(--warning)' }}>
          <span style={{ fontSize: 13, color: 'var(--warning-ink)' }}>
            Este documento está en estado <strong>{proceso.estado}</strong>: aún no es una versión oficial aprobada.
          </span>
        </div>
      )}

      {/* ===== Documento oficial ===== */}
      <div className="doc-print">
        {/* Encabezado normalizado */}
        <table className="doc-head">
          <tbody>
            <tr>
              <td className="doc-head__marca">
                <Image
                  src="/logo-asignar.png"
                  alt="Asignar S.A.S."
                  width={150}
                  height={150}
                  priority
                  className="doc-head__logo"
                />
                <span>{gestion?.nombre ?? 'Gestión'}</span>
              </td>
              <td className="doc-head__titulo">
                <strong>{proceso.nombre}</strong>
                <span>{tipoDoc?.nombre ?? 'Documento'}</span>
              </td>
              <td className="doc-head__control">
                <div><b>Código:</b> <span>{proceso.codigo ?? '—'}</span></div>
                <div><b>Versión:</b> <span>{proceso.version}</span></div>
                <div><b>Emisión:</b> <span>{fFecha(proceso.fecha_emision)}</span></div>
                <div><b>Actualización:</b> <span>{fFecha(proceso.fecha_actualizacion)}</span></div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Objetivo */}
        <section className="doc-seccion">
          <h2>{nx()}. Objetivo</h2>
          <p>{proceso.objetivo || 'No definido.'}</p>
        </section>

        {/* Alcance: gestión responsable */}
        <section className="doc-seccion">
          <h2>{nx()}. Alcance</h2>
          <p>
            Aplica a la gestión de <b>{gestion?.nombre ?? '—'}</b> de Asignar S.A.S.
            {tipoDoc?.nombre ? ` Documento tipo ${tipoDoc.nombre.toLowerCase()}.` : ''}
          </p>
        </section>

        {/* Secciones propias del documento (según su tipo) */}
        {secciones.map((s, i) => (
          <section className="doc-seccion" key={i}>
            <h2>{nx()}. {s.titulo || 'Sección'}</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{s.contenido || '—'}</p>
          </section>
        ))}

        {/* Desarrollo: actividades o ficha de cliente */}
        {esCliente ? (
          <>
            <section className="doc-seccion">
              <h2>{nx()}. Cliente</h2>
              <p><b>{proceso.cliente_nombre || 'Sin nombre de cliente'}</b></p>
              {contactos.length > 0 && (
                <table className="doc-tabla">
                  <thead>
                    <tr><th>Contacto</th><th>Teléfono</th><th>Correo</th></tr>
                  </thead>
                  <tbody>
                    {contactos.map((c, i) => (
                      <tr key={i}>
                        <td>{c.nombre || '—'}</td>
                        <td>{c.telefono || '—'}</td>
                        <td>{c.correo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="doc-seccion">
              <h2>{nx()}. Acuerdo de servicio</h2>
              <table className="doc-tabla">
                <tbody>
                  <tr><th style={{ width: '28%' }}>Tarifa</th><td>{proceso.acuerdo_tarifa || '—'}</td></tr>
                  <tr><th>Tipo de servicio</th><td>{proceso.acuerdo_tipo_servicio || '—'}</td></tr>
                  <tr><th>Uniforme</th><td>{proceso.acuerdo_uniforme || '—'}</td></tr>
                  <tr><th>Detalles</th><td>{proceso.acuerdo_detalles || '—'}</td></tr>
                </tbody>
              </table>
            </section>
          </>
        ) : pasos.length > 0 ? (
          <section className="doc-seccion">
            <h2>{nx()}. Desarrollo del procedimiento</h2>
            {(
              <table className="doc-tabla">
                <thead>
                  <tr>
                    <th className="doc-tabla__num">Nº</th>
                    <th style={{ width: '46%' }}>Actividad</th>
                    <th style={{ width: '22%' }}>Responsable</th>
                    <th>Entradas / Salidas</th>
                  </tr>
                </thead>
                <tbody>
                  {pasos.map((p, i) => (
                    <tr key={p.id}>
                      <td className="doc-tabla__num">{i + 1}</td>
                      <td>
                        {p.nombre && <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.nombre}</div>}
                        <div>{p.descripcion || '—'}</div>
                        {(p.periodicidad || p.tiempos || p.acuerdo_servicio) && (
                          <div className="doc-dato" style={{ marginTop: 4 }}>
                            {p.periodicidad && <><b>Periodicidad:</b> {p.periodicidad}. </>}
                            {p.tiempos && <><b>Tiempo:</b> {p.tiempos}. </>}
                            {p.acuerdo_servicio && <><b>Acuerdo:</b> {p.acuerdo_servicio}.</>}
                          </div>
                        )}
                      </td>
                      <td>{p.cargo_responsable || '—'}</td>
                      <td className="doc-dato">
                        <div><b>Entradas:</b> {p.entradas || '—'}</div>
                        <div><b>Salidas:</b> {p.salidas || '—'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : null}

        {/* Documentos relacionados */}
        {documentos.length > 0 && (
          <section className="doc-seccion">
            <h2>{nx()}. Documentos y formatos relacionados</h2>
            <table className="doc-tabla">
              <thead>
                <tr><th className="doc-tabla__num">Nº</th><th>Nombre</th><th style={{ width: '18%' }}>Tipo</th></tr>
              </thead>
              <tbody>
                {documentos.map((d, i) => (
                  <tr key={d.id}>
                    <td className="doc-tabla__num">{i + 1}</td>
                    <td>{d.nombre}</td>
                    <td>{d.tipo_archivo?.toUpperCase() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Control de cambios — alimentado por historial_versiones */}
        <section className="doc-seccion">
          <h2>{nx()}. Control de cambios</h2>
          {cambios.length > 0 ? (
            <table className="doc-tabla">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>Versión</th>
                  <th style={{ width: '17%' }}>Fecha</th>
                  <th>Descripción del cambio</th>
                  <th style={{ width: '24%' }}>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {cambios.map(h => (
                  <tr key={h.id}>
                    <td className="text-mono">
                      {h.version_anterior !== h.version_nueva
                        ? `${h.version_anterior} → ${h.version_nueva}`
                        : h.version_nueva}
                    </td>
                    <td>{new Date(h.fecha_cambio).toLocaleDateString('es-CO')}</td>
                    <td>{h.resumen_cambio}</td>
                    <td>{h.usuarioNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Versión inicial. Sin cambios registrados.</p>
          )}
        </section>

        {/* Firmas */}
        <section className="doc-seccion">
          <h2>{nx()}. Control documental</h2>
          <table className="doc-firmas">
            <thead>
              <tr>
                <th style={{ width: '33.3%' }}>Elaborado por</th>
                <th style={{ width: '33.3%' }}>Revisado por</th>
                <th>Aprobado por</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{proceso.elaborado_por || '—'}</td>
                <td>{proceso.revisado_por || '—'}</td>
                <td>{proceso.aprobado_por_nombre || '—'}</td>
              </tr>
            </tbody>
          </table>

          {proceso.firma_aprobacion && (
            <div className="doc-firma-electronica">
              <b>Firma electrónica de aprobación:</b> {firmanteNombre}
              {firmanteFecha && <> · {new Date(firmanteFecha).toLocaleString('es-CO')}</>}
              <div style={{ marginTop: 2 }}>
                Aprobado en Cerebro Asignar. La validez de este documento se verifica en la plataforma.
              </div>
            </div>
          )}
        </section>

        <div className="doc-pie">
          <span>
            {proceso.codigo ? `${proceso.codigo} · ` : ''}Versión {proceso.version} · {gestion?.nombre ?? ''}
          </span>
          <span>
            Próxima revisión: {fFecha(proceso.fecha_proxima_revision)} · Documento controlado — copia impresa no controlada
          </span>
        </div>
      </div>
    </main>
  )
}
