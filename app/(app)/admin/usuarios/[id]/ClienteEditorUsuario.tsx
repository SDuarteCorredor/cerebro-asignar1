'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'
import { enviarInvitacion } from '../acciones'

interface Cargo { id: string; nombre: string; banda: string }
interface PosibleJefe { id: string; nombre: string; codigo_contrato: string | null; cargo_id: string | null }
interface Gestion { id: string; nombre: string }

type Usuario = {
  id: string
  codigo_contrato: string | null
  nombre: string
  correo: string | null
  documento: string | null
  rol: string
  activo: boolean
  cargo_id: string | null
  jefe_id: string | null
  gestion_id: string | null
  sede: string | null
  celular: string | null
  direccion: string | null
  tipo_contrato: string | null
  caja_compensacion: string | null
  departamento: string | null
  ciudad: string | null
  fecha_ingreso: string | null
  fecha_nacimiento: string | null
  fecha_retiro: string | null
  salario: number | null
  valor_hora: number | null
  tiene_login: boolean
}

interface Props {
  usuario: Usuario
  cargos: Cargo[]
  posiblesJefes: PosibleJefe[]
  gestiones: Gestion[]
}

const sedes = ['Bogotá', 'Medellín', 'Rionegro', 'Cali', 'Pereira', 'Cartagena', 'Santa Marta', 'Barranquilla', 'Por confirmar']

export default function ClienteEditorUsuario({ usuario, cargos, posiblesJefes, gestiones }: Props) {
  const router = useRouter()
  const supabase = crearClienteNavegador()

  // Campos editables
  const [nombre, setNombre] = useState(usuario.nombre)
  const [correo, setCorreo] = useState(usuario.correo ?? '')
  const [celular, setCelular] = useState(usuario.celular ?? '')
  const [cargoId, setCargoId] = useState(usuario.cargo_id ?? '')
  const [jefeId, setJefeId] = useState(usuario.jefe_id ?? '')
  const [gestionId, setGestionId] = useState(usuario.gestion_id ?? '')
  const [sede, setSede] = useState(usuario.sede ?? '')
  const [rol, setRol] = useState(usuario.rol)
  const [activo, setActivo] = useState(usuario.activo)
  const [direccion, setDireccion] = useState(usuario.direccion ?? '')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [invitando, startInvitar] = useTransition()
  const [invitacionMsg, setInvitacionMsg] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null)

  const cargoSeleccionado = cargos.find(c => c.id === cargoId)
  const cargosByBanda: Record<string, Cargo[]> = {}
  for (const c of cargos) {
    if (!cargosByBanda[c.banda]) cargosByBanda[c.banda] = []
    cargosByBanda[c.banda].push(c)
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    setExito(false)
    try {
      const { error: errUpd } = await supabase
        .from('usuarios')
        .update({
          nombre: nombre.trim(),
          correo: correo.trim() || null,
          celular: celular.trim() || null,
          cargo_id: cargoId || null,
          jefe_id: jefeId || null,
          gestion_id: gestionId || null,
          sede: sede.trim() || null,
          rol,
          activo,
          direccion: direccion.trim() || null,
        })
        .eq('id', usuario.id)
      if (errUpd) throw errUpd
      setExito(true)
      router.refresh()
      // Mostrar el éxito 2 segundos antes de desaparecer
      setTimeout(() => setExito(false), 2500)
    } catch (e: unknown) {
      const detalle = e instanceof Error ? e.message : String(e)
      setError(`Error al guardar: ${detalle}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/usuarios" className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver a usuarios
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <div className="page__eyebrow">Editar usuario</div>
          <h1 className="page__title">{usuario.nombre}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            {usuario.codigo_contrato && <><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{usuario.codigo_contrato}</span> · </>}
            {usuario.documento && <>Doc {usuario.documento} · </>}
            {usuario.tipo_contrato ?? 'Sin tipo de contrato'}
          </p>
        </div>
        <div className="vstack" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div className="hstack" style={{ gap: 8 }}>
            {usuario.tiene_login && (
              <span className="badge badge--success badge--no-dot">
                <Icono nombre="check" className="icon icon--sm" /> Con login
              </span>
            )}
            <span className={`badge badge--${usuario.activo ? 'success' : 'neutral'}`}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {!usuario.tiene_login && usuario.correo && (
            <button
              className="btn btn--primary btn--sm"
              disabled={invitando}
              onClick={() => startInvitar(async () => {
                setInvitacionMsg(null)
                const res = await enviarInvitacion(usuario.id)
                if (res.error) setInvitacionMsg({ tipo: 'err', msg: res.error })
                else setInvitacionMsg({ tipo: 'ok', msg: `Invitación enviada a ${usuario.correo}` })
              })}
            >
              {invitando ? 'Enviando…' : 'Enviar invitación'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {exito && (
        <div style={{ background: 'var(--success-soft)', color: 'var(--success-ink)', border: '1px solid var(--success)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16 }}>
          <Icono nombre="check" className="icon icon--sm" /> Cambios guardados.
        </div>
      )}
      {invitacionMsg && (
        <div style={{
          background: invitacionMsg.tipo === 'ok' ? 'var(--success-soft)' : 'var(--danger-soft)',
          color: invitacionMsg.tipo === 'ok' ? 'var(--success-ink)' : 'var(--danger-ink)',
          border: `1px solid ${invitacionMsg.tipo === 'ok' ? 'var(--success)' : 'var(--danger)'}`,
          borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 16,
        }}>
          {invitacionMsg.msg}
        </div>
      )}

      <div className="vstack" style={{ gap: 16 }}>
        {/* Datos personales */}
        <section className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Datos personales</h3>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">Nombre completo</label>
              <input className="ca-input" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="grid-2col">
              <div className="field">
                <label className="field__label">Correo corporativo</label>
                <input className="ca-input" type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="nombre@asignar.com.co" />
              </div>
              <div className="field">
                <label className="field__label">Celular</label>
                <input className="ca-input" value={celular} onChange={e => setCelular(e.target.value)} placeholder="Ej: 300 123 4567" />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Dirección</label>
              <input className="ca-input" value={direccion} onChange={e => setDireccion(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Cargo + jerarquía */}
        <section className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Cargo y jerarquía</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
            El cargo determina la banda (B1–B5) y por tanto la modalidad de evaluación (360° o 270°) en el módulo Desempeño.
          </p>
          <div className="vstack" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">Cargo</label>
              <select className="ca-select" value={cargoId} onChange={e => setCargoId(e.target.value)}>
                <option value="">— Sin cargo asignado —</option>
                {['B1','B2','B3','B4','B5'].map(banda => (
                  cargosByBanda[banda] && cargosByBanda[banda].length > 0 ? (
                    <optgroup key={banda} label={`${banda} — ${
                      banda==='B1'?'Operativo':banda==='B2'?'Analista/Especialista':banda==='B3'?'Líder':banda==='B4'?'Coordinador/Director':'Gerente'
                    }`}>
                      {cargosByBanda[banda].map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </optgroup>
                  ) : null
                ))}
              </select>
              {cargoSeleccionado && (
                <span className="field__hint">
                  Banda <strong>{cargoSeleccionado.banda}</strong> — modalidad{' '}
                  <strong>{['B3','B4','B5'].includes(cargoSeleccionado.banda) ? '360°' : '270°'}</strong>
                </span>
              )}
            </div>
            <div className="field">
              <label className="field__label">Jefe directo</label>
              <select className="ca-select" value={jefeId} onChange={e => setJefeId(e.target.value)}>
                <option value="">— Sin jefe asignado —</option>
                {posiblesJefes.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.codigo_contrato ? `${j.codigo_contrato} · ` : ''}{j.nombre}
                  </option>
                ))}
              </select>
              <span className="field__hint">
                El jefe se auto-asigna como evaluador en los ciclos de Desempeño.
              </span>
            </div>
            <div className="field">
              <label className="field__label">Gestión asociada (opcional)</label>
              <select className="ca-select" value={gestionId} onChange={e => setGestionId(e.target.value)}>
                <option value="">— Sin gestión —</option>
                {gestiones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
              <span className="field__hint">
                Para líderes de gestión y miembros del equipo (mostrar &quot;Mi Gestión&quot; en sidebar).
              </span>
            </div>
          </div>
        </section>

        {/* Ubicación y acceso */}
        <section className="card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Ubicación y acceso</h3>
          <div className="grid-3col">
            <div className="field">
              <label className="field__label">Sede de trabajo</label>
              <select className="ca-select" value={sede} onChange={e => setSede(e.target.value)}>
                <option value="">— Sin sede —</option>
                {sedes.map(s => <option key={s} value={s}>{s}</option>)}
                {sede && !sedes.includes(sede) && <option value={sede}>{sede}</option>}
              </select>
            </div>
            <div className="field">
              <label className="field__label">Rol</label>
              <select className="ca-select" value={rol} onChange={e => setRol(e.target.value)}>
                <option value="colaborador">Colaborador</option>
                <option value="lider">Líder de Gestión</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label">Estado</label>
              <select className="ca-select" value={activo ? 'activo' : 'inactivo'} onChange={e => setActivo(e.target.value === 'activo')}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </section>

        {/* Datos contractuales (solo lectura) */}
        <section className="card" style={{ padding: 22, background: 'var(--surface-sunken)' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Datos contractuales</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-3)' }}>
            Provenientes del software de Asignar (solo lectura — se actualizan con cada importación semanal).
          </p>
          <dl className="grid-3col" style={{ margin: 0, fontSize: 13 }}>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Documento</dt>
              <dd style={{ margin: '3px 0 0', fontFamily: 'var(--font-mono)' }}>{usuario.documento ?? '—'}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Fecha de ingreso</dt>
              <dd style={{ margin: '3px 0 0', fontFamily: 'var(--font-mono)' }}>{usuario.fecha_ingreso ?? '—'}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Tipo de contrato</dt>
              <dd style={{ margin: '3px 0 0' }}>{usuario.tipo_contrato ?? '—'}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Caja de compensación</dt>
              <dd style={{ margin: '3px 0 0' }}>{usuario.caja_compensacion ?? '—'}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Salario</dt>
              <dd style={{ margin: '3px 0 0', fontFamily: 'var(--font-mono)' }}>
                {usuario.salario ? `$${usuario.salario.toLocaleString('es-CO')}` : '—'}
              </dd>
            </div>
            <div>
              <dt style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}>Departamento · Ciudad</dt>
              <dd style={{ margin: '3px 0 0' }}>{[usuario.departamento, usuario.ciudad].filter(Boolean).join(' · ') || '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
          <Link href="/admin/usuarios" className="btn btn--ghost">Cancelar</Link>
          <button className="btn btn--primary" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : <><Icono nombre="check" className="icon icon--sm" /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  )
}
