/**
 * Esqueletos de contenido sugeridos por tipo de documento.
 *
 * NO son obligatorios ni rígidos: el editor los ofrece con un botón y el líder puede
 * añadir, quitar, renombrar y reordenar secciones. La idea es que empezar un documento
 * no sea una hoja en blanco, no encorsetar a Calidad.
 */

export interface SeccionDoc {
  titulo: string
  contenido: string
}

/** Tipos que se documentan con actividades paso a paso (además de secciones). */
export const TIPOS_CON_PASOS = ['Procedimiento', 'Instructivo']

/** Plantillas por nombre de tipo (coincide con `tipos_documento.nombre`). */
export const plantillasPorTipo: Record<string, string[]> = {
  Procedimiento: [
    'Definiciones',
    'Condiciones generales',
    'Responsables',
  ],
  Instructivo: [
    'Materiales y equipos',
    'Condiciones de seguridad',
    'Recomendaciones',
  ],
  Programa: [
    'Marco legal',
    'Metas e indicadores',
    'Recursos',
    'Cronograma',
    'Seguimiento y medición',
  ],
  Manual: [
    'Presentación',
    'Estructura organizacional',
    'Políticas',
    'Responsabilidades',
  ],
  Guía: [
    'Introducción',
    'Desarrollo',
    'Recomendaciones',
    'Preguntas frecuentes',
  ],
  Plan: [
    'Objetivos específicos',
    'Metas e indicadores',
    'Cronograma',
    'Recursos',
    'Seguimiento',
  ],
  Reglamento: [
    'Capítulo I — Disposiciones generales',
    'Capítulo II — Obligaciones',
    'Capítulo III — Prohibiciones',
    'Capítulo IV — Sanciones',
    'Vigencia',
  ],
  Formato: [
    'Instrucciones de diligenciamiento',
  ],
}

/** Secciones sugeridas (vacías de contenido) para un tipo. */
export function plantillaDeTipo(nombreTipo?: string | null): SeccionDoc[] {
  if (!nombreTipo) return []
  return (plantillasPorTipo[nombreTipo] ?? []).map(titulo => ({ titulo, contenido: '' }))
}

export function tipoUsaPasos(nombreTipo?: string | null): boolean {
  // Si no hay tipo definido se asume que sí, para no esconderle el bloque a lo ya existente.
  if (!nombreTipo) return true
  // Tipo no registrado aquí (p. ej. uno nuevo creado en `tipos_documento`, que es editable
  // desde la app): tampoco se esconde el bloque, o no habría forma de añadir actividades.
  if (!(nombreTipo in plantillasPorTipo)) return true
  return TIPOS_CON_PASOS.includes(nombreTipo)
}

/** Pista corta que se muestra en el editor según el tipo elegido. */
export const pistaPorTipo: Record<string, string> = {
  Procedimiento: 'Describe el paso a paso: quién hace qué, en qué orden y con qué entradas y salidas.',
  Instructivo: 'Detalla cómo se ejecuta una tarea concreta, con el nivel de detalle que necesita quien la hace.',
  Programa: 'Define metas, indicadores, recursos y cronograma. Suele responder a una obligación legal.',
  Manual: 'Documento amplio de consulta: estructura, políticas y responsabilidades del área.',
  Guía: 'Documento orientador, no obligatorio: recomienda cómo hacer algo.',
  Plan: 'Objetivos, metas y cronograma con fecha de inicio y fin.',
  Reglamento: 'Documento normativo por capítulos y artículos, de obligatorio cumplimiento.',
  Formato: 'Plantilla que se diligencia. El archivo va como adjunto; aquí solo las instrucciones de uso.',
}
