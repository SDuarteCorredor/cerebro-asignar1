import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import IconoGestion from '@/components/app/IconoGestion'
import BadgeEstado from '@/components/app/BadgeEstado'
import Icono from '@/components/app/Icono'
import type { EstadoProceso } from '@/types'

interface Props {
  gestionId: string | null
}

/** Procesos recientes de la gestión del usuario (o vacío si no tiene). */
export default async function NovedadesGestion({ gestionId }: Props) {
  if (!gestionId) return null
  const supabase = await crearClienteServidor()

  const [{ data: gestion }, { data: procesos }] = await Promise.all([
    supabase.from('gestiones').select('id, nombre, icono, color_soft, color_primary').eq('id', gestionId).single(),
    supabase.from('procesos')
      .select('id, nombre, version, fecha_actualizacion, estado')
      .eq('gestion_id', gestionId).eq('estado', 'activo')
      .order('fecha_actualizacion', { ascending: false })
      .limit(5),
  ])
  if (!gestion) return null
  if (!procesos || procesos.length === 0) return null

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title hstack" style={{ gap: 10 }}>
          <IconoGestion gestion={gestion} size={26} rounded={8} />
          Novedades de {gestion.nombre}
        </h2>
        <Link href={`/gestiones/${gestion.id}`} className="btn btn--ghost btn--sm">
          Ver gestión <Icono nombre="arrowRight" className="icon icon--sm" />
        </Link>
      </div>
      <div className="card card--table">
        <table className="table table--in-card">
          <thead>
            <tr>
              <th>Proceso</th>
              <th style={{ width: 120 }}>Versión</th>
              <th style={{ width: 140 }}>Actualizado</th>
              <th style={{ width: 110 }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {procesos.map(p => (
              <tr key={p.id}>
                <td>
                  <Link href={`/procesos/${p.id}`} className="row-title" style={{ display: 'block' }}>
                    {p.nombre}
                  </Link>
                </td>
                <td className="text-mono text-sm">v{p.version}</td>
                <td className="text-mono text-xs text-muted">
                  {new Date(p.fecha_actualizacion).toLocaleDateString('es-CO')}
                </td>
                <td><BadgeEstado estado={p.estado as EstadoProceso} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
