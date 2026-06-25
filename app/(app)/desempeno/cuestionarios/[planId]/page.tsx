import { notFound, redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import Topbar from '@/components/app/Topbar'
import ClienteCuestionario from './ClienteCuestionario'
import type { SesionUsuario, Rol } from '@/types'

function obtenerIniciales(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export default async function PaginaCuestionario({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios').select('id, nombre, correo, rol, gestion_id').eq('id', user.id).single()
  if (!perfil) redirect('/login')

  const sesion: SesionUsuario = {
    id: perfil.id, nombre: perfil.nombre, correo: perfil.correo,
    rol: perfil.rol as Rol, gestion_id: perfil.gestion_id,
    iniciales: obtenerIniciales(perfil.nombre),
  }

  // Plan + verificar que el usuario actual es el evaluador
  const { data: plan } = await supabase
    .from('plan_evaluacion')
    .select('id, evaluacion_id, evaluador_id, tipo_evaluador, estado')
    .eq('id', planId)
    .single()
  if (!plan) notFound()
  if (plan.evaluador_id !== user.id && perfil.rol !== 'admin') redirect('/desempeno/mis-pendientes')

  const esAutoeval = plan.tipo_evaluador === 'Autoevaluación'

  // Evaluación + colaborador + ciclo
  const { data: evaluacion } = await supabase
    .from('evaluaciones')
    .select('id, ciclo_id, colaborador_id')
    .eq('id', plan.evaluacion_id)
    .single()

  const [{ data: colaborador }, { data: ciclo }] = await Promise.all([
    supabase.from('usuarios').select('id, nombre, codigo_contrato, cargo_id').eq('id', evaluacion?.colaborador_id ?? '').single(),
    supabase.from('ciclos_evaluacion').select('id, nombre, fecha_fin_captura').eq('id', evaluacion?.ciclo_id ?? '').single(),
  ])

  // Obtener banda del colaborador para saber qué competencias aplican
  const { data: cargo } = colaborador?.cargo_id
    ? await supabase.from('cargos').select('nombre, banda').eq('id', colaborador.cargo_id).single()
    : { data: null }
  const banda = cargo?.banda ?? null

  // Items aplicables: si banda B1-B2, solo competencias corporativas (C1-C5); si B3-B5, todas (C1-C8)
  const competenciasAplicables = banda && ['B1', 'B2'].includes(banda)
    ? ['C1','C2','C3','C4','C5']
    : ['C1','C2','C3','C4','C5','C6','C7','C8']

  const [{ data: items }, { data: competencias }, { data: respuestasExistentes }] = await Promise.all([
    supabase.from('items_cuestionario')
      .select('id, competencia, numero, texto_tercero, texto_primera')
      .in('competencia', competenciasAplicables)
      .eq('activo', true)
      .order('competencia').order('numero'),
    supabase.from('competencias').select('codigo, nombre, tipo, orden').in('codigo', competenciasAplicables).order('orden'),
    supabase.from('respuestas').select('item_id, calificacion').eq('plan_evaluacion_id', planId),
  ])

  const mapRespuestas = new Map((respuestasExistentes ?? []).map(r => [r.item_id, r.calificacion]))

  return (
    <>
      <Topbar usuario={sesion} migas={[
        { etiqueta: 'Desempeño', href: '/desempeno' },
        { etiqueta: 'Mis pendientes', href: '/desempeno/mis-pendientes' },
        { etiqueta: 'Cuestionario' },
      ]} />
      <main className="page page--narrow fade-up">
        <ClienteCuestionario
          planId={planId}
          tipoEvaluador={plan.tipo_evaluador}
          estado={plan.estado}
          esAutoeval={esAutoeval}
          colaborador={{
            nombre: colaborador?.nombre ?? '?',
            codigo: colaborador?.codigo_contrato ?? null,
            cargo: cargo?.nombre ?? null,
            banda,
          }}
          ciclo={{
            nombre: ciclo?.nombre ?? '?',
            fecha_fin_captura: ciclo?.fecha_fin_captura ?? null,
          }}
          items={(items ?? []).map(i => ({
            id: i.id,
            competencia: i.competencia,
            numero: i.numero,
            texto: esAutoeval ? i.texto_primera : i.texto_tercero,
            respuestaInicial: mapRespuestas.get(i.id) ?? null,
          }))}
          competencias={(competencias ?? []).map(c => ({ codigo: c.codigo, nombre: c.nombre, tipo: c.tipo }))}
        />
      </main>
    </>
  )
}
