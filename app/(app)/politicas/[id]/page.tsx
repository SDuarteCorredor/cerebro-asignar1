import Link from 'next/link'
import { notFound } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import BotonDescarga from '../BotonDescarga'

function tamanoLegible(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DetallePolitica({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: politica } = await supabase
    .from('politicas')
    .select('id, nombre, categoria, descripcion, version_actual, activo, updated_at')
    .eq('id', id).single()
  if (!politica) notFound()

  const { data: versiones } = await supabase
    .from('politicas_versiones')
    .select('id, version, archivo_path, archivo_nombre, archivo_tipo, archivo_tamano, resumen_cambio, created_at, subido_por')
    .eq('politica_id', id)
    .order('created_at', { ascending: false })

  const subidoIds = Array.from(new Set((versiones ?? []).map(v => v.subido_por).filter((x): x is string => !!x)))
  const { data: usuarios } = subidoIds.length > 0
    ? await supabase.from('usuarios').select('id, nombre').in('id', subidoIds)
    : { data: [] as { id: string; nombre: string }[] }
  const mapUsuarios = new Map((usuarios ?? []).map(u => [u.id, u.nombre]))

  const vigente = (versiones ?? []).find(v => v.version === politica.version_actual)
    ?? (versiones ?? [])[0]
  const historico = (versiones ?? []).filter(v => v.id !== vigente?.id)

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Políticas y Reglamentos', href: '/politicas' },
        { etiqueta: politica.nombre },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link href="/politicas" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="page__eyebrow">{politica.categoria}</div>
          <h1 className="page__title">{politica.nombre}</h1>
          <div className="hstack" style={{ gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
            <span className="badge badge--neutral badge--no-dot">Versión vigente v{politica.version_actual}</span>
            {!politica.activo && <span className="badge badge--danger">Inactivo</span>}
            <span>Actualizado: {new Date(politica.updated_at).toLocaleDateString('es-CO')}</span>
          </div>
        </div>

        {politica.descripcion && (
          <section className="card" style={{ padding: 18, marginBottom: 18 }}>
            <div className="page__eyebrow" style={{ marginBottom: 6 }}>Descripción</div>
            <div style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{politica.descripcion}</div>
          </section>
        )}

        {/* Vigente */}
        {vigente && (
          <section className="card" style={{ padding: 22, marginBottom: 18, background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
            <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="page__eyebrow" style={{ marginBottom: 4, color: 'var(--success-ink)' }}>Documento vigente</div>
                <div style={{ fontSize: 15, fontWeight: 700, wordBreak: 'break-word' }}>{vigente.archivo_nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  v{vigente.version} · {tamanoLegible(vigente.archivo_tamano)} · Subido {new Date(vigente.created_at).toLocaleDateString('es-CO')}
                  {vigente.subido_por && ` · por ${mapUsuarios.get(vigente.subido_por) ?? '—'}`}
                </div>
                {vigente.resumen_cambio && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}>
                    {vigente.resumen_cambio}
                  </div>
                )}
              </div>
              <BotonDescarga path={vigente.archivo_path} nombre={vigente.archivo_nombre} />
            </div>
          </section>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <section className="card" style={{ padding: 20 }}>
            <div className="page__eyebrow" style={{ marginBottom: 12 }}>Versiones anteriores</div>
            <div className="vstack" style={{ gap: 8 }}>
              {historico.map(v => (
                <div key={v.id} className="hstack" style={{
                  gap: 12, padding: 12, background: 'var(--surface-sunken)',
                  borderRadius: 8, alignItems: 'center',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v.archivo_nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                      v{v.version} · {tamanoLegible(v.archivo_tamano)} · {new Date(v.created_at).toLocaleDateString('es-CO')}
                      {v.subido_por && ` · ${mapUsuarios.get(v.subido_por) ?? '—'}`}
                    </div>
                    {v.resumen_cambio && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 3, fontStyle: 'italic' }}>
                        {v.resumen_cambio}
                      </div>
                    )}
                  </div>
                  <BotonDescarga path={v.archivo_path} nombre={v.archivo_nombre} variante="ghost" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
