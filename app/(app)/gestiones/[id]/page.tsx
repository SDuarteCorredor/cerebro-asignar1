import { notFound } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion, obtenerIniciales } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import Icono from '@/components/app/Icono'
import FiltrosGestion from './FiltrosGestion'
import type { EstadoProceso } from '@/types'

export default async function PaginaGestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: gestion } = await supabase
    .from('gestiones')
    .select('*, lider:usuarios!gestiones_lider_id_fkey(id, nombre)')
    .eq('id', id)
    .single()

  if (!gestion) notFound()

  const puedeEditar = sesion.rol === 'admin' || (sesion.rol === 'lider' && sesion.gestion_id === id)

  // Procesos: colaboradores solo ven activos, líderes/admin ven todo de esta gestión
  let query = supabase
    .from('procesos')
    .select('id, nombre, objetivo, version, fecha_actualizacion, estado, pasos(cargo_responsable)')
    .eq('gestion_id', id)
    .order('nombre')

  if (!puedeEditar) {
    query = query.eq('estado', 'activo')
  }

  const { data: procesos } = await query

  const liderRaw = gestion.lider as unknown as { id: string; nombre: string }[] | { id: string; nombre: string } | null
  const lider = Array.isArray(liderRaw) ? (liderRaw[0] ?? null) : liderRaw
  const activos = (procesos ?? []).filter(p => p.estado === 'activo').length

  return (
    <>
      <Topbar
        usuario={sesion}
        migas={[{ etiqueta: 'Procesos y Procedimientos', href: '/gestiones' }, { etiqueta: gestion.nombre }]}
      />
      <main className="page fade-up">
        {/* Header de gestión */}
        <div className="gestion-header" style={{ background: gestion.color_soft }}>
          <IconoGestion gestion={gestion} size={64} rounded={16} />
          <div>
            <div className="font-semibold" style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: gestion.color_primary, marginBottom: 4 }}>Gestión</div>
            <h1 className="page__title" style={{ marginBottom: 4 }}>{gestion.nombre}</h1>
            <p className="page__subtitle" style={{ fontSize: 14.5 }}>{gestion.descripcion}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {lider && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="dl-label">Líder de Gestión</span>
                <div className="hstack" style={{ gap: 8, padding: '5px 10px 5px 5px', background: 'var(--surface)', borderRadius: 999, border: '1px solid var(--border)' }}>
                  <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                  <span className="text-sm font-semibold">{lider.nombre}</span>
                </div>
              </div>
            )}
            <div className="text-sm text-muted">
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{activos}</span> procesos activos ·{' '}
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{(procesos ?? []).length}</span> totales
            </div>
          </div>
        </div>

        <FiltrosGestion
          procesos={procesos ?? []}
          puedeEditar={puedeEditar}
          gestionId={id}
        />
      </main>
    </>
  )
}
