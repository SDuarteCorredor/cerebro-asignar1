import { crearClienteServidor } from '@/lib/supabase/server'
import { obtenerSesionAdmin } from '@/lib/sesion'
import Topbar from '@/components/app/Topbar'
import Icono from '@/components/app/Icono'
import FilaItem, { type ItemPlantilla } from './FilaItem'
import FormAgregar from './FormAgregar'

const ETAPAS = [
  {
    clave: 'induccion',
    titulo: 'Inducción',
    aprueba: 'Talento Humano',
    detalle: 'A cargo de Paula Caballero. Igual para todos los que ingresan.',
  },
  {
    clave: 'socializacion',
    titulo: 'Socialización',
    aprueba: 'Talento Humano',
    detalle: 'Igual para todos los que ingresan.',
  },
  {
    clave: 'entrenamiento',
    titulo: 'Entrenamiento',
    aprueba: 'Jefe inmediato',
    detalle: 'Propio de cada área: cada gestión define el suyo.',
  },
] as const

export default async function AdminOnboarding() {
  const sesion = await obtenerSesionAdmin()
  const supabase = await crearClienteServidor()

  const [{ data: itemsRaw }, { data: gestiones }] = await Promise.all([
    supabase.from('onboarding_items_plantilla')
      .select('id, etapa, gestion_id, orden, titulo, descripcion, obligatorio, plazo_dias, url_recurso, activo')
      .order('orden'),
    supabase.from('gestiones').select('id, nombre').eq('activa', true).order('nombre'),
  ])

  const items = (itemsRaw ?? []) as ItemPlantilla[]
  const listaGestiones = gestiones ?? []
  const nombreGestion = new Map(listaGestiones.map(g => [g.id, g.nombre]))

  // El entrenamiento se agrupa por gestión; las otras dos etapas son comunes
  const entrenamientoPorGestion = new Map<string, ItemPlantilla[]>()
  for (const it of items) {
    if (it.etapa !== 'entrenamiento' || !it.gestion_id) continue
    const arr = entrenamientoPorGestion.get(it.gestion_id) ?? []
    arr.push(it)
    entrenamientoPorGestion.set(it.gestion_id, arr)
  }

  return (
    <>
      <Topbar usuario={sesion} migas={[{ etiqueta: 'Administración' }, { etiqueta: 'Acogida laboral' }]} />
      <main className="page fade-up">
        <div className="page__header">
          <div>
            <div className="page__eyebrow">Administración</div>
            <h1 className="page__title">Plantilla de acogida laboral</h1>
            <p className="page__subtitle">
              Define los pasos que sigue cada persona que ingresa. El colaborador los va marcando
              y se aprueban según la etapa.
            </p>
          </div>
        </div>

        <div className="vstack" style={{ gap: 26 }}>
          {ETAPAS.map(etapa => {
            const propios = items.filter(i => i.etapa === etapa.clave && !i.gestion_id)
            const esEntrenamiento = etapa.clave === 'entrenamiento'

            return (
              <section key={etapa.clave} className="card card--padded">
                <div style={{ marginBottom: 14 }}>
                  <div className="hstack" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>{etapa.titulo}</h2>
                    <span className="badge badge--primary">Aprueba: {etapa.aprueba}</span>
                  </div>
                  <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>{etapa.detalle}</p>
                </div>

                {esEntrenamiento ? (
                  <div className="vstack" style={{ gap: 18 }}>
                    {entrenamientoPorGestion.size === 0 && (
                      <div className="hstack" style={{ gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                        <Icono nombre="info" className="icon icon--sm" />
                        Todavía ninguna gestión tiene entrenamiento definido.
                      </div>
                    )}
                    {[...entrenamientoPorGestion.entries()]
                      .sort((a, b) => (nombreGestion.get(a[0]) ?? '').localeCompare(nombreGestion.get(b[0]) ?? ''))
                      .map(([gid, lista]) => (
                        <div key={gid}>
                          <div className="page__eyebrow" style={{ marginBottom: 8 }}>
                            {nombreGestion.get(gid) ?? 'Gestión'}
                          </div>
                          <div className="vstack" style={{ gap: 8 }}>
                            {lista.map((it, i) => (
                              <FilaItem key={it.id} item={it}
                                esPrimero={i === 0} esUltimo={i === lista.length - 1} />
                            ))}
                            <FormAgregar etapa="entrenamiento" gestionId={gid} gestiones={listaGestiones} />
                          </div>
                        </div>
                      ))}

                    <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
                      <div className="page__eyebrow" style={{ marginBottom: 8 }}>Añadir a otra gestión</div>
                      <FormAgregar etapa="entrenamiento" gestionId={null} gestiones={listaGestiones} />
                    </div>
                  </div>
                ) : (
                  <div className="vstack" style={{ gap: 8 }}>
                    {propios.length === 0 && (
                      <div className="hstack" style={{ gap: 8, fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
                        <Icono nombre="info" className="icon icon--sm" />
                        Esta etapa aún no tiene pasos definidos.
                      </div>
                    )}
                    {propios.map((it, i) => (
                      <FilaItem key={it.id} item={it}
                        esPrimero={i === 0} esUltimo={i === propios.length - 1} />
                    ))}
                    <FormAgregar etapa={etapa.clave} gestionId={null} gestiones={listaGestiones} />
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </>
  )
}
