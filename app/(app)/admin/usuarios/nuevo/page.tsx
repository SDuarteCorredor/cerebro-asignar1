import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormNuevoUsuario from './FormNuevoUsuario'

export default async function NuevoUsuarioPage() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const [{ data: cargos }, { data: gestiones }, { data: posiblesJefes }] = await Promise.all([
    supabase.from('cargos').select('id, nombre, banda').order('banda').order('nombre'),
    supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre'),
    supabase.from('usuarios').select('id, nombre, codigo_contrato').eq('activo', true).order('nombre'),
  ])

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Admin', href: '/admin/gestiones' },
        { etiqueta: 'Usuarios', href: '/admin/usuarios' },
        { etiqueta: 'Nuevo' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link href="/admin/usuarios" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div className="page__eyebrow">Administración</div>
          <h1 className="page__title">Nuevo usuario</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            Registra un colaborador y opcionalmente envíale un enlace mágico para acceder.
          </p>
        </div>
        <FormNuevoUsuario
          cargos={cargos ?? []}
          gestiones={gestiones ?? []}
          posiblesJefes={posiblesJefes ?? []}
        />
      </main>
    </>
  )
}
