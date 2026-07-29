import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import ClienteGlosario, { type Termino } from './ClienteGlosario'

export default async function PaginaGlosario() {
  const sesion = await obtenerSesion()
  const supabase = await crearClienteServidor()
  const esAdmin = sesion.rol === 'admin'

  const [{ data: terminosRaw }, { data: gestionesLidera }] = await Promise.all([
    supabase.from('glosario_terminos')
      .select('id, gestion_id, termino, definicion, gestion:gestiones(nombre)')
      .order('termino'),
    // Gestiones que el usuario puede editar (admin = todas; líder = las suyas)
    esAdmin
      ? supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre')
      : supabase.from('gestiones').select('id, nombre').eq('lider_id', sesion.id).eq('activa', true).order('nombre'),
  ])

  const editables = new Set((gestionesLidera ?? []).map(g => g.id))

  const terminos: Termino[] = (terminosRaw ?? []).map(t => {
    const gRaw = t.gestion as unknown as { nombre: string }[] | { nombre: string } | null
    const g = Array.isArray(gRaw) ? (gRaw[0] ?? null) : gRaw
    return {
      id: t.id,
      gestion_id: t.gestion_id,
      gestion_nombre: g?.nombre ?? null,
      termino: t.termino,
      definicion: t.definicion,
      // Editable: admin cualquiera; líder solo los de su gestión (los generales no)
      editable: esAdmin || (t.gestion_id !== null && editables.has(t.gestion_id)),
    }
  })

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Glosario' }]} />
      <main className="page page--narrow fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Gestión documental</div>
            <h1 className="page__title">Glosario</h1>
            <p className="page__subtitle">
              Los términos de la organización y de cada gestión, en un solo lugar. Cada líder mantiene los
              de su área; los generales los administra Talento Humano.
            </p>
          </div>
        </div>

        <ClienteGlosario
          terminos={terminos}
          puedeCrearGeneral={esAdmin}
          gestionesEditables={gestionesLidera ?? []}
        />
      </main>
    </>
  )
}
