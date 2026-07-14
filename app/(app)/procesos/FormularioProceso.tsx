'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import IconoArchivo from '@/components/app/IconoArchivo'
import BadgeEstado from '@/components/app/BadgeEstado'
import { crearClienteNavegador } from '@/lib/supabase/client'
import type { Rol, EstadoProceso } from '@/types'

interface Paso {
  id?: string
  numero_orden: number
  nombre: string
  descripcion: string
  cargo_responsable: string
  entradas: string
  periodicidad: string
  salidas: string
  acuerdo_servicio: string
  tiempos: string
}
interface Documento { id?: string; nombre: string; tipo_archivo: string; url_descarga: string; tamano_bytes: number | null; archivo?: File }
interface Contacto { nombre: string; telefono: string; correo: string }

const pasoVacio = (orden: number): Paso => ({
  numero_orden: orden, nombre: '', descripcion: '', cargo_responsable: '',
  entradas: '', periodicidad: '', salidas: '', acuerdo_servicio: '', tiempos: '',
})
const contactoVacio = (): Contacto => ({ nombre: '', telefono: '', correo: '' })

interface Props {
  gestiones: { id: string; nombre: string }[]
  gestionIdInicial: string
  rol: Rol
  tiposDocumento: { id: string; nombre: string; prefijo: string }[]
  procesoExistente?: {
    id: string
    nombre: string
    objetivo: string
    version: string
    estado: string
    gestion_id: string
    pasos: Paso[]
    documentos: Documento[]
    es_proceso_cliente?: boolean
    cliente_nombre?: string | null
    cliente_contactos?: Contacto[]
    acuerdo_tarifa?: string | null
    acuerdo_tipo_servicio?: string | null
    acuerdo_uniforme?: string | null
    acuerdo_detalles?: string | null
    tipo_documento_id?: string | null
    codigo?: string | null
    fecha_emision?: string | null
    elaborado_por?: string | null
    revisado_por?: string | null
    aprobado_por?: string | null
    fecha_proxima_revision?: string | null
  }
}

const periodicidades = [
  'Diaria', 'Recurrente / Cotidiana', 'Semanal', 'Quincenal', 'Mensual',
  'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Ocasional', 'Por demanda',
]

export default function FormularioProceso({ gestiones, gestionIdInicial, rol, tiposDocumento, procesoExistente }: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const esAdmin = rol === 'admin'
  const esNuevo = !procesoExistente

  const [nombre, setNombre] = useState(procesoExistente?.nombre ?? '')
  const [gestionId, setGestionId] = useState(gestionIdInicial)
  const [objetivo, setObjetivo] = useState(procesoExistente?.objetivo ?? '')
  const [version, setVersion] = useState(procesoExistente?.version ?? '1.0')
  const [estado, setEstado] = useState<EstadoProceso>((procesoExistente?.estado as EstadoProceso) ?? 'borrador')
  const [pasos, setPasos] = useState<Paso[]>(
    procesoExistente?.pasos?.length ? procesoExistente.pasos : [pasoVacio(1)]
  )
  const [documentos, setDocumentos] = useState<Documento[]>(procesoExistente?.documentos ?? [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  // Proceso por cliente (solo Servicio y Programación)
  const [esCliente, setEsCliente] = useState(procesoExistente?.es_proceso_cliente ?? false)
  const [clienteNombre, setClienteNombre] = useState(procesoExistente?.cliente_nombre ?? '')
  const [contactos, setContactos] = useState<Contacto[]>(
    procesoExistente?.cliente_contactos?.length ? procesoExistente.cliente_contactos : [contactoVacio()]
  )
  const [acuerdoTarifa, setAcuerdoTarifa] = useState(procesoExistente?.acuerdo_tarifa ?? '')
  const [acuerdoTipoServicio, setAcuerdoTipoServicio] = useState(procesoExistente?.acuerdo_tipo_servicio ?? '')
  const [acuerdoUniforme, setAcuerdoUniforme] = useState(procesoExistente?.acuerdo_uniforme ?? '')
  const [acuerdoDetalles, setAcuerdoDetalles] = useState(procesoExistente?.acuerdo_detalles ?? '')

  // Control documental (Calidad)
  const [tipoDocId, setTipoDocId] = useState(procesoExistente?.tipo_documento_id ?? '')
  const [codigo, setCodigo] = useState(procesoExistente?.codigo ?? '')
  const [fechaEmision, setFechaEmision] = useState(procesoExistente?.fecha_emision ?? '')
  const [elaboradoPor, setElaboradoPor] = useState(procesoExistente?.elaborado_por ?? '')
  const [revisadoPor, setRevisadoPor] = useState(procesoExistente?.revisado_por ?? '')
  const [aprobadoPor, setAprobadoPor] = useState(procesoExistente?.aprobado_por ?? '')
  const [proximaRevision, setProximaRevision] = useState(procesoExistente?.fecha_proxima_revision ?? '')
  const prefijoSugerido = tiposDocumento.find(t => t.id === tipoDocId)?.prefijo ?? ''

  const gestionActual = gestiones.find(g => g.id === gestionId)
  const esServicioYProgramacion = gestionActual?.nombre === 'Servicio y Programación'
  // Si cambia a una gestión que no es Servicio y Programación, el modo cliente se apaga
  const modoCliente = esServicioYProgramacion && esCliente

  function agregarContacto() { setContactos([...contactos, contactoVacio()]) }
  function actualizarContacto(i: number, campo: keyof Contacto, valor: string) {
    setContactos(contactos.map((c, j) => j === i ? { ...c, [campo]: valor } : c))
  }
  function eliminarContacto(i: number) {
    setContactos(contactos.length === 1 ? [contactoVacio()] : contactos.filter((_, j) => j !== i))
  }

  function agregarPaso() {
    setPasos([...pasos, pasoVacio(pasos.length + 1)])
  }

  function actualizarPaso(i: number, campo: keyof Paso, valor: string) {
    setPasos(pasos.map((p, j) => j === i ? { ...p, [campo]: valor } : p))
  }

  function eliminarPaso(i: number) {
    setPasos(pasos.filter((_, j) => j !== i).map((p, j) => ({ ...p, numero_orden: j + 1 })))
  }

  function moverPaso(desde: number, hacia: number) {
    if (desde === hacia) return
    const sig = [...pasos]
    const [item] = sig.splice(desde, 1)
    sig.splice(hacia, 0, item)
    setPasos(sig.map((p, j) => ({ ...p, numero_orden: j + 1 })))
  }

  function alSeleccionarArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    const nuevos: Documento[] = archivos.map(f => ({
      nombre: f.name,
      tipo_archivo: (f.name.split('.').pop() ?? 'pdf').toLowerCase(),
      url_descarga: '',
      tamano_bytes: f.size,
      archivo: f,
    }))
    setDocumentos([...documentos, ...nuevos])
    e.target.value = ''
  }

  function eliminarDocumento(i: number) {
    setDocumentos(documentos.filter((_, j) => j !== i))
  }

  async function guardar(estadoFinal: EstadoProceso) {
    if (!nombre.trim()) { setError('El nombre del proceso es obligatorio.'); return }
    if (!gestionId) { setError('Selecciona una gestión.'); return }
    setGuardando(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const dataProceso = {
        nombre: nombre.trim(),
        gestion_id: gestionId,
        objetivo: objetivo.trim(),
        version,
        estado: estadoFinal,
        fecha_actualizacion: new Date().toISOString().split('T')[0],
        creado_por: esNuevo ? user.id : undefined,
        es_proceso_cliente: modoCliente,
        cliente_nombre: modoCliente ? clienteNombre.trim() : null,
        cliente_contactos: modoCliente
          ? contactos.filter(c => c.nombre.trim() || c.telefono.trim() || c.correo.trim())
          : [],
        acuerdo_tarifa: modoCliente ? acuerdoTarifa.trim() : null,
        acuerdo_tipo_servicio: modoCliente ? acuerdoTipoServicio.trim() : null,
        acuerdo_uniforme: modoCliente ? acuerdoUniforme.trim() : null,
        acuerdo_detalles: modoCliente ? acuerdoDetalles.trim() : null,
        tipo_documento_id: tipoDocId || null,
        codigo: codigo.trim() || null,
        fecha_emision: fechaEmision || null,
        elaborado_por: elaboradoPor.trim() || null,
        revisado_por: revisadoPor.trim() || null,
        aprobado_por: aprobadoPor.trim() || null,
        fecha_proxima_revision: proximaRevision || null,
      }

      let procesoId: string

      if (esNuevo) {
        const { data, error: err } = await supabase.from('procesos').insert(dataProceso).select('id').single()
        if (err) throw err
        procesoId = data.id
      } else {
        const { error: err } = await supabase.from('procesos').update(dataProceso).eq('id', procesoExistente!.id)
        if (err) throw err
        procesoId = procesoExistente!.id
        // Eliminar pasos y documentos existentes para recriarlos
        await supabase.from('pasos').delete().eq('proceso_id', procesoId)
      }

      // Insertar pasos (los procesos de cliente no llevan pasos)
      if (!modoCliente && pasos.length > 0) {
        const pasosData = pasos.map((p, i) => ({
          proceso_id: procesoId,
          numero_orden: i + 1,
          nombre: p.nombre,
          descripcion: p.descripcion,
          cargo_responsable: p.cargo_responsable,
          entradas: p.entradas,
          periodicidad: p.periodicidad,
          salidas: p.salidas,
          acuerdo_servicio: p.acuerdo_servicio,
          tiempos: p.tiempos,
        }))
        const { error: errPasos } = await supabase.from('pasos').insert(pasosData)
        if (errPasos) throw errPasos
      }

      // Subir documentos nuevos
      for (const doc of documentos) {
        if (doc.archivo) {
          const ruta = `${procesoId}/${Date.now()}-${doc.nombre}`
          const { data: subida, error: errSubida } = await supabase.storage
            .from('documentos-procesos')
            .upload(ruta, doc.archivo)
          if (errSubida) throw errSubida

          const { data: { publicUrl } } = supabase.storage
            .from('documentos-procesos')
            .getPublicUrl(subida.path)

          await supabase.from('documentos').insert({
            proceso_id: procesoId,
            nombre: doc.nombre,
            tipo_archivo: doc.tipo_archivo,
            url_descarga: publicUrl,
            tamano_bytes: doc.tamano_bytes,
          })
        }
      }

      router.push(`/procesos/${procesoId}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={procesoExistente ? `/procesos/${procesoExistente.id}` : `/gestiones/${gestionId}`}
          className="btn btn--ghost btn--sm"
        >
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <div className="page__eyebrow">{esNuevo ? 'Nuevo proceso' : 'Editando proceso'}</div>
          <h1 className="page__title">{nombre || 'Crear nuevo proceso'}</h1>
        </div>
        <BadgeEstado estado={estado} />
      </div>

      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="vstack" style={{ gap: 20 }}>
        {/* Información general */}
        <section className="card" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Información general</h3>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">Nombre del proceso</label>
              <input className="ca-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Selección de Personal" />
            </div>
            <div className="grid-3col" style={{ gap: 14 }}>
              <div className="field">
                <label className="field__label">Gestión</label>
                <select className="ca-select" value={gestionId} onChange={e => setGestionId(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">Estado</label>
                <select className="ca-select" value={estado} onChange={e => setEstado(e.target.value as EstadoProceso)}
                  disabled={!esAdmin}>
                  <option value="borrador">Borrador</option>
                  {esAdmin && <option value="activo">Activo</option>}
                  {esAdmin && <option value="desactualizado">Desactualizado</option>}
                </select>
                {!esAdmin && <span className="field__hint">El Admin aprueba el estado final.</span>}
              </div>
              <div className="field">
                <label className="field__label">Versión</label>
                <input className="ca-input" value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0" />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Objetivo</label>
              <textarea className="ca-textarea" value={objetivo} onChange={e => setObjetivo(e.target.value)} placeholder="Una línea que explica para qué existe este proceso." />
            </div>
          </div>
        </section>

        {/* Control documental (Calidad) */}
        <section className="card card--padded">
          <div className="page__eyebrow" style={{ marginBottom: 4 }}>Control documental</div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Datos de calidad</h2>
          <p className="text-muted text-sm" style={{ margin: '0 0 16px' }}>
            Tipo de documento, código y responsables. Se usarán en el encabezado del PDF oficial.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <label className="field__label">Tipo de documento</label>
              <select className="ca-select" value={tipoDocId} onChange={e => setTipoDocId(e.target.value)}>
                <option value="">Sin definir</option>
                {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Código</label>
              <input className="ca-input" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder={prefijoSugerido ? `Ej. XX-${prefijoSugerido}-01` : 'Ej. TH-PR-01'} />
              {prefijoSugerido && <span className="field__hint">Prefijo del tipo: {prefijoSugerido}</span>}
            </div>
            <div className="field">
              <label className="field__label">Fecha de emisión</label>
              <input type="date" className="ca-input" value={fechaEmision ?? ''} onChange={e => setFechaEmision(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <div className="field">
              <label className="field__label">Elaborado por</label>
              <input className="ca-input" value={elaboradoPor} onChange={e => setElaboradoPor(e.target.value)} placeholder="Nombre y cargo" />
            </div>
            <div className="field">
              <label className="field__label">Revisado por</label>
              <input className="ca-input" value={revisadoPor} onChange={e => setRevisadoPor(e.target.value)} placeholder="Nombre y cargo" />
            </div>
            <div className="field">
              <label className="field__label">Aprobado por</label>
              <input className="ca-input" value={aprobadoPor} onChange={e => setAprobadoPor(e.target.value)} placeholder="Nombre y cargo" />
            </div>
            <div className="field">
              <label className="field__label">Próxima revisión</label>
              <input type="date" className="ca-input" value={proximaRevision ?? ''} onChange={e => setProximaRevision(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Selector de tipo — solo Servicio y Programación */}
        {esServicioYProgramacion && (
          <section className="card" style={{ padding: 26 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Tipo de proceso</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-3)' }}>
              En Servicio y Programación puedes documentar el proceso general o un proceso específico por cliente.
            </p>
            <div className="tipo-selector">
              <button type="button" onClick={() => setEsCliente(false)}
                className={`tipo-opcion${!esCliente ? ' is-active' : ''}`}>
                <span className="tipo-opcion__radio" />
                <span className="tipo-opcion__body">
                  <strong><Icono nombre="workflow" className="icon icon--sm" /> Proceso general</strong>
                  <span>Procedimiento con pasos y actividades.</span>
                </span>
              </button>
              <button type="button" onClick={() => setEsCliente(true)}
                className={`tipo-opcion${esCliente ? ' is-active' : ''}`}>
                <span className="tipo-opcion__radio" />
                <span className="tipo-opcion__body">
                  <strong><Icono nombre="handshake" className="icon icon--sm" /> Proceso por cliente</strong>
                  <span>Ficha del cliente y acuerdo de servicio.</span>
                </span>
              </button>
            </div>
          </section>
        )}

        {/* Datos del cliente + acuerdo (modo cliente) */}
        {modoCliente && (
          <>
            <section className="card" style={{ padding: 26 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Datos del cliente</h3>
              <div className="vstack" style={{ gap: 14 }}>
                <div className="field">
                  <label className="field__label">Nombre del cliente / empresa</label>
                  <input className="ca-input" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej: Industrias XYZ S.A.S." />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="field__label">Contactos</label>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{contactos.length} contacto(s)</span>
                  </div>
                  <div className="vstack" style={{ gap: 10 }}>
                    {contactos.map((c, i) => (
                      <div key={i} className="paso-card">
                        <div className="form-row-contacto">
                          <div className="field">
                            <label className="field__label">Nombre</label>
                            <input className="ca-input ca-input--sm" value={c.nombre} onChange={e => actualizarContacto(i, 'nombre', e.target.value)} placeholder="Nombre del contacto" />
                          </div>
                          <div className="field">
                            <label className="field__label">Teléfono</label>
                            <input className="ca-input ca-input--sm" value={c.telefono} onChange={e => actualizarContacto(i, 'telefono', e.target.value)} placeholder="Ej: 300 123 4567" />
                          </div>
                          <div className="field">
                            <label className="field__label">Correo</label>
                            <input className="ca-input ca-input--sm" value={c.correo} onChange={e => actualizarContacto(i, 'correo', e.target.value)} placeholder="correo@cliente.com" />
                          </div>
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => eliminarContacto(i)}>
                            <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn--secondary" onClick={agregarContacto} style={{ alignSelf: 'flex-start' }}>
                      <Icono nombre="plus" className="icon icon--sm" /> Agregar contacto
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="card" style={{ padding: 26 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Acuerdo de servicio con el cliente</h3>
              <div className="paso-grid">
                <div className="field">
                  <label className="field__label">Tarifa</label>
                  <input className="ca-input ca-input--sm" value={acuerdoTarifa} onChange={e => setAcuerdoTarifa(e.target.value)} placeholder="Ej: $2.500.000 / mes por puesto" />
                </div>
                <div className="field">
                  <label className="field__label">Tipo de servicio</label>
                  <input className="ca-input ca-input--sm" value={acuerdoTipoServicio} onChange={e => setAcuerdoTipoServicio(e.target.value)} placeholder="Ej: Vigilancia, aseo, operarios…" />
                </div>
                <div className="field paso-grid--full">
                  <label className="field__label">Acuerdo de uniforme</label>
                  <input className="ca-input ca-input--sm" value={acuerdoUniforme} onChange={e => setAcuerdoUniforme(e.target.value)} placeholder="Ej: Uniforme dotado por Asignar, cambio cada 6 meses" />
                </div>
                <div className="field paso-grid--full">
                  <label className="field__label">Detalles adicionales</label>
                  <textarea className="ca-textarea" value={acuerdoDetalles} onChange={e => setAcuerdoDetalles(e.target.value)} placeholder="Horarios, condiciones especiales, cláusulas del acuerdo, etc." />
                </div>
              </div>
            </section>
          </>
        )}

        {/* Pasos */}
        {!modoCliente && (
        <section className="card" style={{ padding: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Pasos del procedimiento</h3>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Arrastra para reordenar</span>
          </div>
          <div className="vstack" style={{ gap: 10 }}>
            {pasos.map((paso, i) => (
              <div
                key={i}
                onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
                onDragEnd={() => {
                  if (draggingIdx !== null && overIdx !== null) moverPaso(draggingIdx, overIdx)
                  setDraggingIdx(null); setOverIdx(null)
                }}
                className={`paso-card${draggingIdx === i ? ' is-dragging' : ''}${overIdx === i && draggingIdx !== null ? ' is-over' : ''}`}
              >
                <div className="paso-card__head">
                  <span className="paso-drag" draggable onDragStart={() => setDraggingIdx(i)}>
                    <Icono nombre="drag" className="icon icon--sm" />
                  </span>
                  <div className="paso-num">{String(i + 1).padStart(2, '0')}</div>
                  <input
                    className="ca-input"
                    placeholder="Nombre de la actividad…"
                    value={paso.nombre}
                    onChange={e => actualizarPaso(i, 'nombre', e.target.value)}
                  />
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminarPaso(i)}>
                    <Icono nombre="trash" className="icon icon--sm" style={{ color: 'var(--danger-ink)' }} />
                  </button>
                </div>

                <div className="paso-grid">
                  <div className="field paso-grid--full">
                    <label className="field__label">Procedimiento</label>
                    <textarea
                      className="ca-textarea" style={{ minHeight: 60 }}
                      placeholder="Describe cómo se realiza esta actividad…"
                      value={paso.descripcion}
                      onChange={e => actualizarPaso(i, 'descripcion', e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label className="field__label">Cargo responsable</label>
                    <input className="ca-input ca-input--sm" placeholder="Ej: Analista de Selección"
                      value={paso.cargo_responsable} onChange={e => actualizarPaso(i, 'cargo_responsable', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Periodicidad</label>
                    <select className="ca-select ca-select--sm" value={paso.periodicidad} onChange={e => actualizarPaso(i, 'periodicidad', e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {periodicidades.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field__label">Entradas</label>
                    <input className="ca-input ca-input--sm" placeholder="Qué necesita para empezar"
                      value={paso.entradas} onChange={e => actualizarPaso(i, 'entradas', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Salidas</label>
                    <input className="ca-input ca-input--sm" placeholder="Qué produce esta actividad"
                      value={paso.salidas} onChange={e => actualizarPaso(i, 'salidas', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Tiempos</label>
                    <input className="ca-input ca-input--sm" placeholder="Ej: 2 días hábiles"
                      value={paso.tiempos} onChange={e => actualizarPaso(i, 'tiempos', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field__label">Acuerdo de servicio</label>
                    <input className="ca-input ca-input--sm" placeholder="SLA o compromiso"
                      value={paso.acuerdo_servicio} onChange={e => actualizarPaso(i, 'acuerdo_servicio', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn--secondary" onClick={agregarPaso} style={{ alignSelf: 'flex-start' }}>
              <Icono nombre="plus" className="icon icon--sm" /> Agregar paso
            </button>
          </div>
        </section>
        )}

        {/* Documentos */}
        <section className="card" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Documentos relacionados</h3>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, border: '2px dashed var(--border-strong)', borderRadius: 12, padding: 28,
            color: 'var(--text-3)', cursor: 'pointer', background: 'var(--surface-sunken)',
          }}>
            <Icono nombre="upload" className="icon icon--lg" style={{ color: 'var(--primary)' }} />
            <strong style={{ color: 'var(--text)' }}>Arrastra archivos aquí o haz clic para subir</strong>
            <span style={{ fontSize: 12 }}>Acepta PDF, DOCX, XLSX, PPTX. Máx 20 MB por archivo.</span>
            <input type="file" multiple accept=".pdf,.docx,.xlsx,.pptx" onChange={alSeleccionarArchivos} style={{ display: 'none' }} />
          </label>

          {documentos.length > 0 && (
            <div className="grid-2col" style={{ gap: 8, marginTop: 14 }}>
              {documentos.map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <IconoArchivo tipo={d.tipo_archivo} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.tamano_bytes ? `${Math.round(d.tamano_bytes / 1024)} KB` : ''}
                      {d.archivo ? ' · Nuevo' : ''}
                    </div>
                  </div>
                  <button className="btn btn--ghost btn--sm" onClick={() => eliminarDocumento(i)}>
                    <Icono nombre="trash" className="icon icon--sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '20px 0 0', borderTop: '1px solid var(--divider)' }}>
          <Link
            href={procesoExistente ? `/procesos/${procesoExistente.id}` : `/gestiones/${gestionId}`}
            className="btn btn--ghost"
          >
            Cancelar
          </Link>
          <div className="hstack" style={{ gap: 10 }}>
            <button className="btn btn--secondary" disabled={guardando} onClick={() => guardar('borrador')}>
              Guardar como borrador
            </button>
            {esAdmin ? (
              <button className="btn btn--primary" disabled={guardando} onClick={() => guardar('activo')}>
                <Icono nombre="check" className="icon icon--sm" />
                {guardando ? 'Publicando…' : 'Publicar'}
              </button>
            ) : (
              <button className="btn btn--primary" disabled={guardando} onClick={() => guardar('en_revision')}>
                <Icono nombre="upload" className="icon icon--sm" />
                {guardando ? 'Enviando…' : 'Enviar para aprobación'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
