import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FilaCatalogo, { type CapCatalogo } from './FilaCatalogo'

export default async function AdminCapacitaciones() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const [{ data: caps }, { data: registros }] = await Promise.all([
    supabase.from('capacitaciones').select('id, nombre, descripcion, tipo, certifica, vigencia_meses, activa').order('nombre'),
    supabase.from('capacitacion_registros').select('capacitacion_id'),
  ])

  const conteo = new Map<string, number>()
  for (const r of registros ?? []) conteo.set(r.capacitacion_id, (conteo.get(r.capacitacion_id) ?? 0) + 1)

  const filas: CapCatalogo[] = (caps ?? []).map(c => ({ ...c, registros: conteo.get(c.id) ?? 0 }))

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Capacitaciones' }]} />
      <main className="page page--narrow fade-up">
        <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Catálogo de capacitaciones</h1>
            <p className="page__subtitle">
              Define las capacitaciones y entrenamientos, si certifican y cada cuánto se renuevan.
              Los registros por persona se llevan en <Link href="/capacitaciones" style={{ textDecoration: 'underline' }}>Capacitaciones</Link>.
            </p>
          </div>
        </div>

        <div className="vstack" style={{ gap: 16 }}>
          <div className="card card--padded">
            <div className="hstack" style={{ gap: 8, marginBottom: 10 }}>
              <Icono nombre="plus" className="icon icon--sm" style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: 14 }}>Nueva capacitación</strong>
            </div>
            <FilaCatalogo cap={null} />
          </div>

          <div className="vstack" style={{ gap: 10 }}>
            {filas.map(c => <FilaCatalogo key={c.id} cap={c} />)}
            {filas.length === 0 && (
              <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 20 }}>
                Aún no hay capacitaciones en el catálogo.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
