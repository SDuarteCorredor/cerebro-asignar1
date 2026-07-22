import { Suspense } from 'react'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import BuscadorHero from './BuscadorHero'
import StatsAdmin, { StatsAdminSkeleton } from './StatsAdmin'
import BandejaAccion, { BandejaAccionSkeleton } from '@/components/dashboard/BandejaAccion'
import BandejaAprobacion from '@/components/dashboard/BandejaAprobacion'
import AvisoComiteSemanal from '@/components/dashboard/AvisoComiteSemanal'
import KPICicloActivo from '@/components/dashboard/KPICicloActivo'
import MiGestionProcesos from '@/components/dashboard/MiGestionProcesos'
import SaludEquipo from '@/components/dashboard/SaludEquipo'
import MiPDI from '@/components/dashboard/MiPDI'
import MiComites from '@/components/dashboard/MiComites'
import NovedadesGestion from '@/components/dashboard/NovedadesGestion'
import UltimasNotificaciones from '@/components/dashboard/UltimasNotificaciones'
import { crearClienteServidor } from '@/lib/supabase/server'

/** Dashboard personalizado según rol.
 *  - Colaborador: mi día (pendientes) + mi desempeño + novedades de mi gestión
 *  - Líder / admin: además bandeja de aprobación arriba + procesos por atender
 *  - Admin: además KPIs globales de la organización
 */
export default async function PaginaDashboard() {
  const sesion = await obtenerSesion()
  const esAdmin = sesion.rol === 'admin'

  // Determinar si el usuario lidera al menos una gestión (para el bloque administrativo)
  const supabase = await crearClienteServidor()
  const { data: gestionesLidera } = await supabase
    .from('gestiones').select('id').eq('lider_id', sesion.id).eq('activa', true)
  const esLider = (gestionesLidera?.length ?? 0) > 0 || sesion.rol === 'lider'
  const muestraBloqueAdmin = esLider || esAdmin

  const saludo = sesion.saludo ?? sesion.nombre.split(' ')[0]
  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <Topbar usuario={sesion} mostrarBuscar={false} />
      <main className="page fade-up">

        {/* Hero */}
        <div className="dash-hero">
          <div className="page__eyebrow">{fechaHoy}</div>
          <h1 className="page__title" style={{ fontSize: 34 }}>Hola, {saludo}.</h1>
          <p className="page__subtitle" style={{ fontSize: 16 }}>
            {muestraBloqueAdmin ? 'Este es el pulso de tu equipo hoy.' : 'Esto es lo que tienes hoy.'}
          </p>
          <BuscadorHero />
        </div>

        {/* Admin: KPIs organizacionales */}
        {esAdmin && (
          <Suspense fallback={<StatsAdminSkeleton />}>
            <StatsAdmin />
          </Suspense>
        )}

        {/* Admin: ciclo de desempeño activo (cobertura + días restantes) */}
        {esAdmin && (
          <Suspense fallback={null}>
            <KPICicloActivo />
          </Suspense>
        )}

        {/* Líder / admin: comité de esta semana (crear o cerrar) */}
        {muestraBloqueAdmin && (
          <Suspense fallback={null}>
            <AvisoComiteSemanal usuarioId={sesion.id} esAdmin={esAdmin} />
          </Suspense>
        )}

        {/* Líder / admin: bandeja de aprobación (arriba) */}
        {muestraBloqueAdmin && (
          <Suspense fallback={null}>
            <BandejaAprobacion usuarioId={sesion.id} esAdmin={esAdmin} />
          </Suspense>
        )}

        {/* Todos: bandeja de acción (mi día) */}
        <Suspense fallback={<BandejaAccionSkeleton />}>
          <BandejaAccion
            usuarioId={sesion.id}
            gestionId={sesion.gestion_id}
            esLider={esLider}
            esAdmin={esAdmin}
          />
        </Suspense>

        {/* Líder / admin: salud del equipo (comités / desempeño / PDIs) */}
        {muestraBloqueAdmin && (
          <Suspense fallback={null}>
            <SaludEquipo usuarioId={sesion.id} esAdmin={esAdmin} />
          </Suspense>
        )}

        {/* Líder / admin: procesos por atender */}
        {muestraBloqueAdmin && (
          <Suspense fallback={null}>
            <MiGestionProcesos usuarioId={sesion.id} esAdmin={esAdmin} />
          </Suspense>
        )}

        {/* Todos: dos columnas — PDI + Comités */}
        <div className="dash-cols">
          <Suspense fallback={null}>
            <MiPDI usuarioId={sesion.id} />
          </Suspense>
          <Suspense fallback={null}>
            <MiComites usuarioId={sesion.id} gestionId={sesion.gestion_id} />
          </Suspense>
        </div>

        {/* Novedades de mi gestión */}
        <Suspense fallback={null}>
          <NovedadesGestion gestionId={sesion.gestion_id} />
        </Suspense>

        {/* Notificaciones sin leer */}
        <Suspense fallback={null}>
          <UltimasNotificaciones usuarioId={sesion.id} />
        </Suspense>
      </main>
    </>
  )
}
