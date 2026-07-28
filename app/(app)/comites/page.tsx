import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesion } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import { calcularPonderado } from '@/lib/comites/puntaje'
import TableroGestiones from './TableroGestiones'
import ClienteActas, { type ActaFila } from './ClienteActas'

export default async function PaginaComites({ searchParams }: {
  searchParams: Promise<{ gestion?: string }>
}) {
  const sesion = await obtenerSesion()
  const { gestion: filtroGestion } = await searchParams
  const supabase = await crearClienteServidor()

  const esAdmin = sesion.rol === 'admin'

  // Comités visibles: todos si admin; los de su gestión si líder/colaborador
  let query = supabase
    .from('comites')
    .select('id, gestion_id, fecha, semana_iso, anio, titulo, cerrado')
    .order('fecha', { ascending: false })
    .limit(50)
  if (!esAdmin && sesion.gestion_id) query = query.eq('gestion_id', sesion.gestion_id)
  else if (esAdmin && filtroGestion) query = query.eq('gestion_id', filtroGestion)

  const { data: comites } = await query

  const gestionIds = Array.from(new Set((comites ?? []).map(c => c.gestion_id)))
  const comiteIds = (comites ?? []).map(c => c.id)

  const [{ data: gestiones }, { data: compromisos }] = await Promise.all([
    gestionIds.length > 0
      ? supabase.from('gestiones').select('id, nombre').in('id', gestionIds)
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
    comiteIds.length > 0
      ? supabase.from('compromisos').select('comite_origen_id, estado, impacto').in('comite_origen_id', comiteIds)
      : Promise.resolve({ data: [] as { comite_origen_id: string; estado: string; impacto: string }[] }),
  ])

  const mapGestion = new Map((gestiones ?? []).map(g => [g.id, g.nombre]))
  const compsPorComite = new Map<string, { estado: string; impacto: string }[]>()
  for (const c of compromisos ?? []) {
    const arr = compsPorComite.get(c.comite_origen_id) ?? []
    arr.push({ estado: c.estado, impacto: c.impacto })
    compsPorComite.set(c.comite_origen_id, arr)
  }
  const statsPorComite = new Map(
    Array.from(compsPorComite.entries()).map(([id, comps]) => [id, calcularPonderado(comps)])
  )

  // Serializado plano para el cliente: agrupa, filtra y ordena en el navegador
  const actas: ActaFila[] = (comites ?? []).map(c => {
    const s = statsPorComite.get(c.id)
    return {
      id: c.id,
      gestion: mapGestion.get(c.gestion_id) ?? '—',
      fecha: c.fecha,
      semana_iso: c.semana_iso,
      anio: c.anio,
      titulo: c.titulo,
      cerrado: c.cerrado,
      total: s?.total ?? 0,
      pct: s?.pctPonderado ?? null,
    }
  })
  const nombresGestion = Array.from(new Set(actas.map(a => a.gestion))).sort()

  // Mis gestiones para crear
  const misGestiones = esAdmin
    ? (await supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre')).data ?? []
    : (await supabase.from('gestiones').select('id, nombre').eq('lider_id', sesion.id)).data ?? []

  const puedeCrear = misGestiones.length > 0

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Comités' }]} />
      <main className="page fade-up">
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div>
            <div className="page__eyebrow">Ejecución semanal</div>
            <h1 className="page__title">Comités y compromisos</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-3)' }}>
              Actas semanales por equipo con compromisos, revisión y % de cumplimiento.
            </p>
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <Link href="/comites/ranking" className="btn btn--ghost btn--sm">
              <Icono nombre="target" className="icon icon--sm" /> Ranking
            </Link>
            {puedeCrear && (
              <Link href="/comites/nuevo" className="btn btn--primary btn--sm">
                <Icono nombre="plus" className="icon icon--sm" /> Nuevo comité
              </Link>
            )}
          </div>
        </div>

        {/* Tablero de resultados — siempre visible */}
        <TableroGestiones sesion={sesion} />

        <div className="section-header" style={{ marginBottom: 12 }}>
          <div className="page__eyebrow" style={{ margin: 0 }}>Actas semanales</div>
        </div>

        {(!comites || comites.length === 0) ? (
          <section className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div className="icon-circle" style={{ margin: '0 auto 10px' }}>
              <Icono nombre="calendar" className="icon" />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>
              Aún no hay comités registrados{esAdmin ? '' : ' en tu gestión'}.
            </p>
            {puedeCrear && (
              <div style={{ marginTop: 14 }}>
                <Link href="/comites/nuevo" className="btn btn--primary btn--sm">Crear el primero</Link>
              </div>
            )}
          </section>
        ) : (
          <ClienteActas actas={actas} gestiones={nombresGestion} />
        )}
      </main>
    </>
  )
}
