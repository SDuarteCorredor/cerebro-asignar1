import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import NavAdmin from '../NavAdmin'
import Icono from '@/components/app/Icono'
import TablaUsuarios from './TablaUsuarios'

export default async function AdminUsuarios() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  // Queries separadas: más robusto que un select con joins nested
  const [
    { data: usuariosRaw, error: errUsr },
    { data: gestiones },
    { data: cargos },
  ] = await Promise.all([
    supabase.from('usuarios')
      .select('id, codigo_contrato, nombre, correo, rol, activo, sede, tiene_login, gestion_id, cargo_id')
      .order('nombre'),
    supabase.from('gestiones').select('id, nombre'),
    supabase.from('cargos').select('id, nombre, banda'),
  ])
  if (errUsr) console.error('Error cargando usuarios:', errUsr)

  const mapGestiones = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const mapCargos = new Map((cargos ?? []).map(c => [c.id, c]))
  const usuarios = (usuariosRaw ?? []).map(u => ({
    ...u,
    gestion_nombre: u.gestion_id ? mapGestiones.get(u.gestion_id) ?? null : null,
    cargo: u.cargo_id ? mapCargos.get(u.cargo_id) ?? null : null,
  }))

  const activos = usuarios.filter(u => u.activo).length
  const conLogin = usuarios.filter(u => u.tiene_login).length

  const { count: totalAprobaciones } = await supabase
    .from('procesos').select('id', { count: 'exact', head: true }).eq('estado', 'en_revision')
  const { count: totalGestiones } = await supabase
    .from('gestiones').select('id', { count: 'exact', head: true }).eq('activa', true)

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Usuarios' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Panel de Administración</h1>
            <p className="page__subtitle">Configura las Gestiones, gestiona usuarios y aprueba el contenido enviado por los Líderes.</p>
          </div>
        </div>

        <NavAdmin activa="usuarios" aprobacionesPendientes={totalAprobaciones ?? 0} totalGestiones={totalGestiones ?? 0} totalUsuarios={usuarios.length} />

        <div className="filter-row">
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            <strong style={{ color: 'var(--text)' }}>{usuarios?.length ?? 0}</strong> registrados ·{' '}
            <strong style={{ color: 'var(--text)' }}>{activos}</strong> activos ·{' '}
            <strong style={{ color: 'var(--text)' }}>{conLogin}</strong> con login
          </span>
          <span className="spacer" />
          <Link href="/admin/sedes" className="btn btn--ghost btn--sm">
            <Icono nombre="target" className="icon icon--sm" /> Excepciones de sede
          </Link>
          <Link href="/admin/usuarios/importar" className="btn btn--secondary btn--sm">
            <Icono nombre="upload" className="icon icon--sm" /> Importar lista
          </Link>
          <Link href="/admin/usuarios/nuevo" className="btn btn--primary btn--sm">
            <Icono nombre="plus" className="icon icon--sm" /> Nuevo usuario
          </Link>
        </div>

        <TablaUsuarios
          usuarios={usuarios}
          gestiones={[...(gestiones ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre))}
        />
      </main>
    </>
  )
}
