import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import Icono from '@/components/app/Icono'
import FiltrosGestion from './FiltrosGestion'
import type { SesionUsuario, Rol, EstadoProceso } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase()
}

export default async function PaginaGestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 22,
          alignItems: 'center',
          padding: '26px 28px',
          background: gestion.color_soft,
          borderRadius: 16,
          marginBottom: 28,
          border: '1px solid var(--border)',
        }}>
          <IconoGestion gestion={gestion} size={64} rounded={16} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: gestion.color_primary, marginBottom: 4 }}>Gestión</div>
            <h1 className="page__title" style={{ marginBottom: 4 }}>{gestion.nombre}</h1>
            <p className="page__subtitle" style={{ fontSize: 14.5 }}>{gestion.descripcion}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            {lider && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Líder de Gestión</span>
                <div className="hstack" style={{ gap: 8, padding: '5px 10px 5px 5px', background: 'var(--surface)', borderRadius: 999, border: '1px solid var(--border)' }}>
                  <div className="avatar avatar--sm">{obtenerIniciales(lider.nombre)}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{lider.nombre}</span>
                </div>
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
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
