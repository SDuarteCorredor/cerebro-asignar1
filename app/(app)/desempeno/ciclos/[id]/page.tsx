import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import ClienteDetalleCiclo from './ClienteDetalleCiclo'
import { obtenerIniciales } from '@/lib/sesion'
import type { SesionUsuario, Rol } from '@/types'

export default async function PaginaDetalleCiclo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') redirect('/desempeno')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  const { data: ciclo } = await supabase
    .from('ciclos_evaluacion')
    .select('*')
    .eq('id', id)
    .single()
  if (!ciclo) notFound()

  // Datos para mostrar las evaluaciones del ciclo
  const [
    { data: evaluaciones },
    { data: planes },
    { data: usuariosBd },
    { data: cargos },
  ] = await Promise.all([
    supabase.from('evaluaciones').select('id, colaborador_id, estado, requiere_revision').eq('ciclo_id', id),
    supabase.from('plan_evaluacion').select('id, evaluacion_id, evaluador_id, tipo_evaluador, estado'),
    supabase.from('usuarios').select('id, nombre, codigo_contrato, cargo_id, jefe_id, sede, activo'),
    supabase.from('cargos').select('id, nombre, banda'),
  ])

  const mapUsuarios = new Map((usuariosBd ?? []).map(u => [u.id, u]))
  const mapCargos = new Map((cargos ?? []).map(c => [c.id, c]))

  // Filtrar planes solo del ciclo
  const evalIds = new Set((evaluaciones ?? []).map(e => e.id))
  const planesDelCiclo = (planes ?? []).filter(p => evalIds.has(p.evaluacion_id))

  // Armar estructura para el cliente
  const evaluacionesEnriquecidas = (evaluaciones ?? []).map(ev => {
    const colab = mapUsuarios.get(ev.colaborador_id)
    const cargo = colab?.cargo_id ? mapCargos.get(colab.cargo_id) : null
    const banda = cargo?.banda ?? null
    const modalidad: '360°' | '270°' = (banda && ['B3','B4','B5'].includes(banda)) ? '360°' : '270°'
    const planes = planesDelCiclo
      .filter(p => p.evaluacion_id === ev.id)
      .map(p => ({
        id: p.id,
        evaluador_id: p.evaluador_id,
        evaluador_nombre: mapUsuarios.get(p.evaluador_id)?.nombre ?? '?',
        evaluador_codigo: mapUsuarios.get(p.evaluador_id)?.codigo_contrato ?? null,
        tipo_evaluador: p.tipo_evaluador,
        estado: p.estado,
      }))
    return {
      id: ev.id,
      estado: ev.estado,
      requiere_revision: ev.requiere_revision,
      colaborador: {
        id: colab?.id ?? ev.colaborador_id,
        nombre: colab?.nombre ?? '?',
        codigo: colab?.codigo_contrato ?? null,
        sede: colab?.sede ?? null,
        cargo_nombre: cargo?.nombre ?? null,
        banda,
        modalidad,
      },
      planes,
    }
  }).sort((a, b) => a.colaborador.nombre.localeCompare(b.colaborador.nombre))

  // Posibles evaluadores (activos)
  const posiblesEvaluadores = (usuariosBd ?? [])
    .filter(u => u.activo)
    .map(u => ({ id: u.id, nombre: u.nombre, codigo: u.codigo_contrato, sede: u.sede }))

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'Ciclos', href: '/desempeno/ciclos' },
        { etiqueta: ciclo.nombre },
      ]} />
      <main className="page fade-up">
        <ClienteDetalleCiclo
          ciclo={ciclo}
          evaluaciones={evaluacionesEnriquecidas}
          posiblesEvaluadores={posiblesEvaluadores}
        />
      </main>
    </>
  )
}
