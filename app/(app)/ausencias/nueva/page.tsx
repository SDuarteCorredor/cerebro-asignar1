import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormAusencia from './FormAusencia'

export default async function NuevaAusenciaPage() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()

  const { data: u } = await supabase
    .from('usuarios')
    .select('id, nombre, documento, ciudad, sede, cargo_id, gestion_id, jefe_id')
    .eq('id', sesion.id).single()

  const [{ data: cargo }, { data: gestion }, { data: jefe }, { data: tipos }] = await Promise.all([
    u?.cargo_id ? supabase.from('cargos').select('nombre').eq('id', u.cargo_id).single() : Promise.resolve({ data: null }),
    u?.gestion_id ? supabase.from('gestiones').select('nombre').eq('id', u.gestion_id).single() : Promise.resolve({ data: null }),
    u?.jefe_id ? supabase.from('directorio_usuarios').select('nombre').eq('id', u.jefe_id).single() : Promise.resolve({ data: null }),
    supabase.from('tipos_ausencia').select('id, nombre, requiere_soporte, requiere_doble_validacion').eq('activo', true).order('orden'),
  ])

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Ausencias', href: '/ausencias' },
        { etiqueta: 'Nueva solicitud' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link href="/ausencias" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div className="page__eyebrow">Talento Humano</div>
          <h1 className="page__title">Solicitar permiso o registrar ausencia</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            Tu solicitud va a tu jefe inmediato para aprobación. Adjunta el soporte cuando aplique.
          </p>
        </div>
        <FormAusencia
          tipos={tipos ?? []}
          datos={{
            nombre: u?.nombre ?? sesion.nombre,
            documento: u?.documento ?? null,
            cargo: cargo?.nombre ?? null,
            gestion: gestion?.nombre ?? null,
            jefe: jefe?.nombre ?? null,
            ciudad: u?.ciudad ?? u?.sede ?? null,
          }}
        />
      </main>
    </>
  )
}
