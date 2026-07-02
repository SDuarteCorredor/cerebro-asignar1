import Link from 'next/link'
import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FormNuevoComite from './FormNuevoComite'

export default async function NuevoComitePage() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  const { data: gestiones } = esAdmin
    ? await supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre')
    : await supabase.from('gestiones').select('id, nombre').eq('lider_id', sesion.id).eq('activa', true).order('nombre')

  if (!gestiones || gestiones.length === 0) redirect('/comites')

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Comités', href: '/comites' },
        { etiqueta: 'Nuevo' },
      ]} />
      <main className="page fade-up">
        <div style={{ marginBottom: 20 }}>
          <Link href="/comites" className="btn btn--ghost btn--sm">
            <Icono nombre="chevronRight" className="icon icon--sm" style={{ transform: 'rotate(180deg)' }} /> Volver
          </Link>
        </div>
        <div style={{ marginBottom: 22 }}>
          <div className="page__eyebrow">Ejecución semanal</div>
          <h1 className="page__title">Nuevo comité</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
            Se crea el acta y se cargan los miembros activos de la gestión como asistentes.
          </p>
        </div>
        <FormNuevoComite gestiones={gestiones} />
      </main>
    </>
  )
}
