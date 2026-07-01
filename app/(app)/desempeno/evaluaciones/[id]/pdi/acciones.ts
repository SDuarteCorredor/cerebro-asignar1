'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/server'
import {
  calcularReporte, calcularTop3Acciones,
  type Plan, type Item, type Respuesta, type Ponderacion,
  type NivelEsperado, type Accion, type Modalidad,
} from '@/lib/desempeno/calculo'

export async function generarPdiDesdeReporte(evaluacionId: string) {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. No duplicar
  const { data: existente } = await supabase
    .from('pdi').select('id').eq('evaluacion_id', evaluacionId).maybeSingle()
  if (existente) return { pdi_id: existente.id }

  // 2. Recalcular TOP 3
  const { data: evaluacion } = await supabase
    .from('evaluaciones').select('colaborador_id').eq('id', evaluacionId).single()
  if (!evaluacion) return { error: 'Evaluación no encontrada' }

  const { data: colab } = await supabase
    .from('usuarios').select('cargo_id').eq('id', evaluacion.colaborador_id).single()
  const { data: cargo } = colab?.cargo_id
    ? await supabase.from('cargos').select('banda').eq('id', colab.cargo_id).single()
    : { data: null }
  const banda = cargo?.banda ?? 'B1'
  const modalidad: Modalidad = ['B3', 'B4', 'B5'].includes(banda) ? '360°' : '270°'

  const [
    { data: planes },
    { data: ponderaciones },
    { data: nivelesEsperados },
    { data: items },
    { data: acciones },
  ] = await Promise.all([
    supabase.from('plan_evaluacion').select('id, tipo_evaluador').eq('evaluacion_id', evaluacionId),
    supabase.from('ponderaciones_desempeno').select('modalidad, tipo_evaluador, peso'),
    supabase.from('matriz_niveles_esperados').select('banda, competencia, nivel'),
    supabase.from('items_cuestionario').select('id, competencia').eq('activo', true),
    supabase.from('acciones_desarrollo')
      .select('id, competencia, tipo, nombre, banda_min, banda_max, prioridad_min, esfuerzo_th, duracion')
      .eq('activo', true),
  ])

  const planIds = (planes ?? []).map(p => p.id)
  const { data: respuestas } = planIds.length > 0
    ? await supabase.from('respuestas').select('plan_evaluacion_id, item_id, calificacion').in('plan_evaluacion_id', planIds)
    : { data: [] }

  const reporte = calcularReporte({
    banda, modalidad,
    planes: (planes ?? []) as Plan[],
    items: (items ?? []) as Item[],
    respuestas: (respuestas ?? []) as Respuesta[],
    ponderaciones: (ponderaciones ?? []) as Ponderacion[],
    nivelesEsperados: (nivelesEsperados ?? []) as NivelEsperado[],
  })
  const top3 = calcularTop3Acciones({
    banda, resultados: reporte.porCompetencia, acciones: (acciones ?? []) as Accion[],
  })

  if (top3.length === 0) return { error: 'No hay acciones recomendadas (sin brechas o sin respuestas).' }

  // 3. Crear PDI
  const hoy = new Date().toISOString().slice(0, 10)
  const proximaRevision = new Date(); proximaRevision.setMonth(proximaRevision.getMonth() + 3)
  const proxStr = proximaRevision.toISOString().slice(0, 10)

  const { data: pdi, error: errPdi } = await supabase
    .from('pdi')
    .insert({
      evaluacion_id: evaluacionId,
      fecha_acuerdo: hoy,
      proxima_revision: proxStr,
      estado: 'borrador',
      creado_por: user.id,
    })
    .select('id').single()
  if (errPdi || !pdi) return { error: errPdi?.message ?? 'No se pudo crear el PDI' }

  // 4. Crear pdi_acciones desde el TOP 3
  const filas = top3.map(t => ({
    pdi_id: pdi.id,
    accion_id: t.accion.id,
    fecha_inicio: hoy,
    fecha_fin: proxStr,
    responsable_seguimiento: 'Jefe directo',
    estado: 'Pendiente',
  }))
  const { error: errAcc } = await supabase.from('pdi_acciones').insert(filas)
  if (errAcc) return { error: errAcc.message }

  revalidatePath(`/desempeno/evaluaciones/${evaluacionId}/pdi`)
  return { pdi_id: pdi.id }
}

export async function reemplazarAccionPdi(args: {
  pdi_id: string
  pdi_accion_id: string
  nueva_accion_id: string
  evaluacion_id: string
}) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase
    .from('pdi_acciones')
    .update({ accion_id: args.nueva_accion_id })
    .eq('id', args.pdi_accion_id)
  if (error) return { error: error.message }
  revalidatePath(`/desempeno/evaluaciones/${args.evaluacion_id}/pdi`)
  return { ok: true }
}

export async function enviarPdiAFirma(pdiId: string, evaluacionId: string) {
  const supabase = await crearClienteServidor()
  const { error } = await supabase
    .from('pdi')
    .update({ estado: 'en_firma', updated_at: new Date().toISOString() })
    .eq('id', pdiId)
  if (error) return { error: error.message }
  revalidatePath(`/desempeno/evaluaciones/${evaluacionId}/pdi`)
  return { ok: true }
}
