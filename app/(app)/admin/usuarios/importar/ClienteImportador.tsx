'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type * as XLSXType from 'xlsx'
import Link from 'next/link'
import Icono from '@/components/app/Icono'
import { crearClienteNavegador } from '@/lib/supabase/client'

interface Cargo { id: string; nombre: string; banda: string }

interface FilaExcel {
  codigo_contrato: string
  nombre: string
  documento: string | null
  tipo_documento: string
  fecha_ingreso: string | null
  salario: number | null
  valor_hora: number | null
  cargo_nombre: string
  caja_compensacion: string
  fecha_nacimiento: string | null
  departamento: string
  ciudad: string
  fecha_retiro: string | null
  sede_inferida: string
  cargo_id: string | null  // resuelto con el catálogo
  // Campos opcionales del nuevo Excel
  correo: string | null
  celular: string | null
  direccion: string | null
  tipo_contrato: string | null
}

interface Preview {
  nuevos: FilaExcel[]
  actualizar: FilaExcel[]
  inactivar: { codigo_contrato: string; nombre: string }[]
  cargosFaltantes: string[]
  errores: string[]
}

// Mapeo CCF → Sede de trabajo (default)
const SEDE_POR_CCF: Record<string, string> = {
  'COLSUBSIDIO': 'Bogotá',
  'ANDI COMFENALCO CARTAGENA': 'Cartagena',
  'CCF DEL MAGDALENA': 'Santa Marta',
  'COMFAMILIAR DEL ATLANTICO': 'Barranquilla',
  'CCF RISARALDA- COMFAMILIAR RISARALDA': 'Pereira',
  'CCF RISARALDA - COMFAMILIAR RISARALDA': 'Pereira',
  'COMFENALCO VALLE': 'Cali',
  'CCF COMFENALCO ANTIOQUIA': 'Medellín',
}
// Excepciones por código de contrato: cargadas desde public.sede_overrides en runtime
const inferirSede = (codigo: string, ccf: string, overrides: Map<string, string>): string => {
  const ov = overrides.get(codigo)
  if (ov) return ov
  const k = (ccf ?? '').trim()
  return SEDE_POR_CCF[k] ?? 'Por confirmar'
}

function fechaIso(v: unknown, XLSX?: typeof XLSXType): string | null {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return v.toISOString().split('T')[0]
  if (typeof v === 'string') {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  if (typeof v === 'number' && XLSX) {
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  return null
}

function txt(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return isNaN(n) ? null : n
}

export default function ClienteImportador({ cargos }: { cargos: Cargo[] }) {
  const router = useRouter()
  const supabase = crearClienteNavegador()
  const cargosByName = new Map(cargos.map(c => [c.nombre.trim().toLowerCase(), c]))

  const [archivo, setArchivo] = useState<File | null>(null)
  const [filas, setFilas] = useState<FilaExcel[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [resultado, setResultado] = useState<{ insertados: number; actualizados: number; inactivados: number } | null>(null)
  const [error, setError] = useState('')

  async function procesarArchivo(file: File) {
    setProcesando(true)
    setError('')
    setPreview(null)
    setResultado(null)
    try {
      const { data: overridesData } = await supabase
        .from('sede_overrides').select('codigo_contrato, sede')
      const overrides = new Map((overridesData ?? []).map(o => [o.codigo_contrato, o.sede]))

      const XLSX = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1, defval: null })

      const filasParseadas: FilaExcel[] = []
      const errores: string[] = []
      const cargosFaltantesSet = new Set<string>()

      for (const row of json) {
        const codigo = txt(row['Código'] ?? row['Codigo'])
        if (!codigo) continue
        const nombre = txt(row['Nombre'])
        if (!nombre) { errores.push(`${codigo}: falta nombre`); continue }
        const cargoNombre = txt(row['Cargo'])
        const cargo = cargosByName.get(cargoNombre.toLowerCase())
        if (cargoNombre && !cargo) cargosFaltantesSet.add(cargoNombre)
        const ccf = txt(row['CCF'])
        filasParseadas.push({
          codigo_contrato: codigo,
          nombre,
          documento: txt(row['Documento']) || null,
          tipo_documento: txt(row['Tipo']) || 'CC',
          fecha_ingreso: fechaIso(row['F. Ingreso'], XLSX),
          salario: num(row['Salario']),
          valor_hora: num(row['Valor hora']),
          cargo_nombre: cargoNombre,
          caja_compensacion: ccf,
          fecha_nacimiento: fechaIso(row['F. Nacimiento'], XLSX),
          departamento: txt(row['Departamento']),
          ciudad: txt(row['Ciudad']),
          fecha_retiro: fechaIso(row['F. Retiro'], XLSX),
          sede_inferida: inferirSede(codigo, ccf, overrides),
          cargo_id: cargo?.id ?? null,
          // Campos opcionales del nuevo Excel (si no están en el archivo, quedan null)
          correo: txt(row['Email'] ?? row['Correo']) || null,
          celular: txt(row['Celular']) || null,
          direccion: txt(row['Dirección'] ?? row['Direccion']) || null,
          tipo_contrato: txt(row['Tipo contrato'] ?? row['Tipo de contrato']) || null,
        })
      }

      const codigos = filasParseadas.map(f => f.codigo_contrato)
      const { data: existentes, error: errExist } = await supabase
        .from('usuarios')
        .select('codigo_contrato, nombre, documento, cargo_id, sede, salario, valor_hora, activo, fecha_retiro')
        .not('codigo_contrato', 'is', null)
      if (errExist) throw errExist

      const mapExistentes = new Map((existentes ?? []).map(e => [e.codigo_contrato, e]))

      const nuevos: FilaExcel[] = []
      const actualizar: FilaExcel[] = []
      for (const f of filasParseadas) {
        const ex = mapExistentes.get(f.codigo_contrato)
        if (!ex) { nuevos.push(f); continue }
        // Preservar sede si el admin la edito manualmente (no es 'Por confirmar' y no es null)
        const exTyped = ex as { sede?: string | null }
        if (exTyped.sede && exTyped.sede.trim() !== '' && exTyped.sede !== 'Por confirmar') {
          f.sede_inferida = exTyped.sede
        }
        // hay diferencias?
        const cambio = (
          ex.nombre !== f.nombre ||
          ex.documento !== f.documento ||
          ex.cargo_id !== f.cargo_id ||
          ex.salario !== f.salario ||
          ex.valor_hora !== f.valor_hora ||
          (!!ex.fecha_retiro) !== (!!f.fecha_retiro) ||
          !ex.activo
        )
        if (cambio) actualizar.push(f)
      }

      const codigosExcel = new Set(codigos)
      const inactivar = (existentes ?? [])
        .filter(e => e.activo && !codigosExcel.has(e.codigo_contrato!))
        .map(e => ({ codigo_contrato: e.codigo_contrato!, nombre: e.nombre }))

      setFilas(filasParseadas)
      setPreview({
        nuevos,
        actualizar,
        inactivar,
        cargosFaltantes: Array.from(cargosFaltantesSet).sort(),
        errores,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error procesando el archivo')
    } finally {
      setProcesando(false)
    }
  }

  async function aplicar() {
    if (!preview) return
    setAplicando(true)
    setError('')
    try {
      let insertados = 0
      let actualizados = 0
      let inactivados = 0

      const aUpsert = [...preview.nuevos, ...preview.actualizar]
      if (aUpsert.length > 0) {
        const filasParaBD = aUpsert.map(f => ({
          codigo_contrato: f.codigo_contrato,
          nombre: f.nombre,
          rol: 'colaborador',
          documento: f.documento,
          tipo_documento: f.tipo_documento,
          fecha_ingreso: f.fecha_ingreso,
          fecha_nacimiento: f.fecha_nacimiento,
          fecha_retiro: f.fecha_retiro,
          salario: f.salario,
          valor_hora: f.valor_hora,
          cargo_id: f.cargo_id,
          caja_compensacion: f.caja_compensacion,
          departamento: f.departamento,
          ciudad: f.ciudad,
          sede: f.sede_inferida,
          // Solo incluir campos opcionales si el Excel los trae (no sobreescribir con null si admin los seteo)
          ...(f.correo ? { correo: f.correo } : {}),
          ...(f.celular ? { celular: f.celular } : {}),
          ...(f.direccion ? { direccion: f.direccion } : {}),
          ...(f.tipo_contrato ? { tipo_contrato: f.tipo_contrato } : {}),
          activo: !f.fecha_retiro,
          tiene_login: false,
        }))
        const { error: errUpsert, data } = await supabase
          .from('usuarios')
          .upsert(filasParaBD, { onConflict: 'codigo_contrato' })
          .select('codigo_contrato')
        if (errUpsert) throw errUpsert
        insertados = preview.nuevos.length
        actualizados = (data?.length ?? 0) - insertados
      }

      if (preview.inactivar.length > 0) {
        const codigos = preview.inactivar.map(i => i.codigo_contrato)
        const { error: errInact } = await supabase
          .from('usuarios')
          .update({ activo: false })
          .in('codigo_contrato', codigos)
        if (errInact) throw errInact
        inactivados = codigos.length
      }

      setResultado({ insertados, actualizados, inactivados })
      setPreview(null)
      router.refresh()
    } catch (e: unknown) {
      const detalle = e instanceof Error
        ? e.message
        : (typeof e === 'object' && e !== null ? JSON.stringify(e, null, 2) : String(e))
      setError(`Error aplicando los cambios: ${detalle}`)
      console.error('Detalle del error de import:', e)
    } finally {
      setAplicando(false)
    }
  }

  function reset() {
    setArchivo(null); setFilas([]); setPreview(null); setResultado(null); setError('')
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/usuarios" className="btn btn--ghost btn--sm">
          <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="page__eyebrow">Lista semanal</div>
        <h1 className="page__title">Importar lista de personal</h1>
        <p className="page__subtitle">
          Sube el archivo Excel que descargas del software de Asignar. El sistema identifica las personas por el código de contrato
          (columna A) y compara con la base actual.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {resultado && (
        <section className="card" style={{ padding: 22, marginBottom: 20, background: 'var(--success-soft)', borderColor: 'var(--success)' }}>
          <div className="hstack" style={{ gap: 10, marginBottom: 8 }}>
            <Icono nombre="check" className="icon" style={{ color: 'var(--success-ink)' }} />
            <strong style={{ color: 'var(--success-ink)' }}>Importación completada</strong>
          </div>
          <ul style={{ margin: '8px 0 12px 24px', color: 'var(--success-ink)', fontSize: 14 }}>
            <li>Insertados nuevos: <strong>{resultado.insertados}</strong></li>
            <li>Actualizados: <strong>{resultado.actualizados}</strong></li>
            <li>Marcados como inactivos: <strong>{resultado.inactivados}</strong></li>
          </ul>
          <button className="btn btn--secondary btn--sm" onClick={reset}>Importar otro archivo</button>
        </section>
      )}

      {!preview && !resultado && (
        <section className="card" style={{ padding: 26 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Sube el archivo</h3>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, border: '2px dashed var(--border-strong)', borderRadius: 12, padding: 32,
            color: 'var(--text-3)', cursor: 'pointer', background: 'var(--surface-sunken)',
          }}>
            <Icono nombre="upload" className="icon icon--lg" style={{ color: 'var(--primary)' }} />
            <strong style={{ color: 'var(--text)' }}>
              {archivo ? archivo.name : 'Selecciona o arrastra el archivo Excel'}
            </strong>
            <span style={{ fontSize: 12 }}>El archivo debe tener encabezados Código, Nombre, Cargo, CCF, F. Retiro…</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) { setArchivo(f); procesarArchivo(f) }
              }}
              style={{ display: 'none' }}
              disabled={procesando}
            />
          </label>
          {procesando && (
            <div style={{ marginTop: 14, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Procesando archivo…
            </div>
          )}
        </section>
      )}

      {preview && (
        <div className="vstack" style={{ gap: 16 }}>
          {/* Resumen */}
          <section className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Previsualización de cambios</h3>
            <div className="grid-stats">
              <ResumenCard label="Total en archivo" valor={filas.length} color="neutral" />
              <ResumenCard label="Nuevos a agregar" valor={preview.nuevos.length} color="success" />
              <ResumenCard label="Por actualizar" valor={preview.actualizar.length} color="warning" />
              <ResumenCard label="A marcar inactivos" valor={preview.inactivar.length} color="danger" />
            </div>
          </section>

          {preview.cargosFaltantes.length > 0 && (
            <section className="card" style={{ padding: 18, borderColor: 'var(--warning)', background: 'var(--warning-soft)' }}>
              <div className="hstack" style={{ gap: 8, marginBottom: 8 }}>
                <Icono nombre="info" className="icon" style={{ color: 'var(--warning-ink)' }} />
                <strong style={{ color: 'var(--warning-ink)' }}>
                  {preview.cargosFaltantes.length} cargo(s) sin mapear
                </strong>
              </div>
              <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--warning-ink)' }}>
                Estos cargos aparecen en el Excel pero no están en el catálogo. Las personas con estos cargos se importarán
                sin cargo asignado. Puedes crearlos manualmente después.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {preview.cargosFaltantes.map(c => (
                  <span key={c} className="badge badge--no-dot" style={{ background: 'var(--surface)', color: 'var(--warning-ink)', border: '1px solid var(--warning)' }}>{c}</span>
                ))}
              </div>
            </section>
          )}

          {preview.errores.length > 0 && (
            <section className="card" style={{ padding: 18, borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
              <strong style={{ color: 'var(--danger-ink)' }}>{preview.errores.length} fila(s) con errores</strong>
              <ul style={{ margin: '8px 0 0 22px', color: 'var(--danger-ink)', fontSize: 13 }}>
                {preview.errores.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </section>
          )}

          {preview.nuevos.length > 0 && (
            <ListaPersonas titulo="Nuevos colaboradores" personas={preview.nuevos} cargos={cargos} estado="success" />
          )}
          {preview.actualizar.length > 0 && (
            <ListaPersonas titulo="A actualizar" personas={preview.actualizar} cargos={cargos} estado="warning" />
          )}
          {preview.inactivar.length > 0 && (
            <section className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>
                A marcar como inactivos ({preview.inactivar.length})
              </h3>
              <div className="grid-2col" style={{ fontSize: 13 }}>
                {preview.inactivar.map(p => (
                  <div key={p.codigo_contrato} style={{ padding: '6px 10px', background: 'var(--danger-soft)', borderRadius: 6, color: 'var(--danger-ink)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, marginRight: 8 }}>{p.codigo_contrato}</span>
                    {p.nombre}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '20px 0 0', borderTop: '1px solid var(--divider)' }}>
            <button className="btn btn--ghost" onClick={reset} disabled={aplicando}>
              Cancelar y subir otro
            </button>
            <button className="btn btn--primary" onClick={aplicar} disabled={aplicando}>
              {aplicando ? 'Aplicando…' : (
                <>
                  <Icono nombre="check" className="icon icon--sm" />
                  Aplicar cambios ({preview.nuevos.length + preview.actualizar.length + preview.inactivar.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumenCard({ label, valor, color }: { label: string; valor: number; color: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const map = {
    neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-2)' },
    success: { bg: 'var(--success-soft)', fg: 'var(--success-ink)' },
    warning: { bg: 'var(--warning-soft)', fg: 'var(--warning-ink)' },
    danger:  { bg: 'var(--danger-soft)',  fg: 'var(--danger-ink)'  },
  }
  const c = map[color]
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: c.bg }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: c.fg, fontFamily: 'var(--font-mono)' }}>{valor}</div>
      <div style={{ fontSize: 12, color: c.fg, opacity: 0.85, marginTop: 2 }}>{label}</div>
    </div>
  )
}

function ListaPersonas({ titulo, personas, cargos, estado }: { titulo: string; personas: FilaExcel[]; cargos: Cargo[]; estado: 'success' | 'warning' }) {
  const colorBg = estado === 'success' ? 'var(--success-soft)' : 'var(--warning-soft)'
  const colorFg = estado === 'success' ? 'var(--success-ink)' : 'var(--warning-ink)'
  const cargosById = new Map(cargos.map(c => [c.id, c]))
  return (
    <section className="card" style={{ padding: 22 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>{titulo} ({personas.length})</h3>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Código</th>
              <th>Nombre</th>
              <th>Cargo (banda)</th>
              <th>Sede</th>
              <th>Ingreso</th>
            </tr>
          </thead>
          <tbody>
            {personas.slice(0, 50).map(p => {
              const cargo = p.cargo_id ? cargosById.get(p.cargo_id) : null
              return (
                <tr key={p.codigo_contrato}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5 }}>{p.codigo_contrato}</td>
                  <td className="row-title">{p.nombre}</td>
                  <td>
                    {cargo ? (
                      <span style={{ fontSize: 13 }}>
                        {cargo.nombre} <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>· {cargo.banda}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger-ink)', fontSize: 12.5 }}>
                        Sin mapear: {p.cargo_nombre}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {p.sede_inferida}
                    {p.sede_inferida === 'Por confirmar' && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>(CCF: {p.caja_compensacion})</div>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{p.fecha_ingreso ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {personas.length > 50 && (
        <div style={{ padding: '12px 0 0', fontSize: 12.5, color: 'var(--text-3)' }}>
          Mostrando 50 de {personas.length}. Todos se incluyen al aplicar.
        </div>
      )}
      <div style={{ marginTop: 8, height: 3, background: colorBg, borderRadius: 999, opacity: 0.6 }} />
      <span style={{ display: 'none' }}>{colorFg}</span>
    </section>
  )
}
