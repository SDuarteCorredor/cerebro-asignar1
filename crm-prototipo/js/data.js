// Datos de DEMOSTRACIÓN. Los clientes son ficticios; la estructura (áreas, ítems, SLA)
// sale de la reunión "Check list y CRM" del 13-oct y del Excel "Formato Registro Clientes_Check list".
// Los ítems marcados con `supuesto: true` son una interpretación a validar con Silvia/Jorge.

window.AREAS = {
  comercial:    { nombre: 'Comercial',              resp: 'Paula',            color: 'var(--area-comercial)' },
  cumplimiento: { nombre: 'Validación / Cumplimiento', resp: 'Laura y Nataly', color: 'var(--area-cumplimiento)' },
  apertura:     { nombre: 'Apertura',               resp: 'Operaciones',      color: 'var(--area-apertura)' },
  compensacion: { nombre: 'Compensación',           resp: 'Compensación',     color: 'var(--area-compensacion)' },
  ti:           { nombre: 'TI',                     resp: 'Tecnología',       color: 'var(--area-ti)' },
  sst:          { nombre: 'SST',                    resp: 'SST',              color: 'var(--area-sst)' },
};

window.ROLES = {
  comercial: 'Comercial (Paula)',
  cumplimiento: 'Cumplimiento (Laura)',
  apertura: 'Apertura',
  compensacion: 'Compensación',
  ti: 'TI',
  sst: 'SST',
  gerencia: 'Gerencia / Crédito',
};

// sla = días hábiles (la mayoría es 1). dep = ítems que deben estar hechos antes.
// post = ocurre tras la aprobación y NO bloquea habilitar pedidos (SST: hasta 2 meses después).
window.PLANTILLA = [
  { id: 'c1', area: 'comercial', t: 'Reunión comercial', sla: 1 },
  { id: 'c2', area: 'comercial', t: 'Propuesta y cotización', sla: 1, dep: ['c1'] },
  { id: 'c3', area: 'comercial', t: 'Aprobación del cliente', sla: 1, dep: ['c2'] },
  { id: 'c4', area: 'comercial', t: 'Documentación Sagrilaft', sla: 1, dep: ['c3'] },
  { id: 'c5', area: 'comercial', t: 'Identificación de centros de costos y perfiles', sla: 1, dep: ['c3'] },

  { id: 'v1', area: 'cumplimiento', t: 'Estados financieros', sla: 1, dep: ['c4'] },
  { id: 'v2', area: 'cumplimiento', t: 'Datacrédito', sla: 1, dep: ['c4'] },
  { id: 'v3', area: 'cumplimiento', t: 'Listas restrictivas y PEP', sla: 1, dep: ['c4'] },
  { id: 'v4', area: 'cumplimiento', t: 'Procesos jurídicos', sla: 1, dep: ['c4'] },
  { id: 'v5', area: 'cumplimiento', t: 'Expediente digital', sla: 1, dep: ['v1', 'v2', 'v3', 'v4'] },
  { id: 'v6', area: 'cumplimiento', t: 'Codificación y parametrización en software', sla: 1, dep: ['v5'] },

  { id: 't1', area: 'ti', t: 'Usuarios y sedes', sla: 1, dep: ['v6'] },
  { id: 't2', area: 'ti', t: 'Cargos y salarios en el sistema', sla: 1, dep: ['c5', 'v6'] },
  { id: 't3', area: 'ti', t: 'Locaciones (centros de costos)', sla: 1, dep: ['c5', 'v6'] },
  { id: 't4', area: 'ti', t: 'Parametrización de facturación', sla: 1, dep: ['v6'] },

  { id: 'p1', area: 'compensacion', t: 'Fecha de corte', sla: 1, dep: ['v6'] },
  { id: 'p2', area: 'compensacion', t: 'Fecha de facturación', sla: 1, dep: ['v6'] },
  { id: 'p3', area: 'compensacion', t: 'Tabla de turnos', sla: 1, dep: ['c5'], nota: 'Hoy vive en un Drive de Compensación; debe migrar al CRM' },

  { id: 'a1', area: 'apertura', t: 'Carta de bienvenida', sla: 1, dep: ['v6'] },
  { id: 'a2', area: 'apertura', t: 'Reunión operativa', sla: 1, dep: ['a1'] },
  { id: 'a3', area: 'apertura', t: 'Directorio de personal del cliente', sla: 1, dep: ['a2'], nota: 'Quién gestiona al cliente se define aquí, no antes' },
  { id: 'a4', area: 'apertura', t: 'Reunión compensación–nómina', sla: 1, dep: ['a2'] },
  { id: 'a5', area: 'apertura', t: 'Socialización interna', sla: 1, dep: ['a3'] },

  { id: 's1', area: 'sst', t: 'Profesiograma', sla: 1, dep: ['a2'], post: true },
  { id: 's2', area: 'sst', t: 'ARL', sla: 1, dep: ['a2'], post: true },
  { id: 's3', area: 'sst', t: 'Exámenes médicos', sla: 1, dep: ['s1'], post: true, nota: 'Ocurre post-aprobación, a veces hasta 2 meses después' },
];

// Las 3 aprobaciones que activan al cliente
window.APROBACIONES = [
  { id: 'cumplimiento', t: 'Cumplimiento', rol: 'cumplimiento' },
  { id: 'credito', t: 'Comité de crédito', rol: 'gerencia' },
  { id: 'gerencia', t: 'Gerencia', rol: 'gerencia' },
];

window.ETAPAS = [
  { id: 'prospecto', t: 'Prospecto', c: 'var(--text-muted)' },
  { id: 'reunion', t: 'Reunión comercial', c: 'var(--area-apertura)' },
  { id: 'propuesta', t: 'Propuesta', c: 'var(--primary)' },
  { id: 'negociacion', t: 'Negociación', c: 'var(--area-cumplimiento)' },
  { id: 'apertura', t: 'En apertura', c: 'var(--warning)' },
  { id: 'activo', t: 'Activo', c: 'var(--success)' },
];

// ---- Clientes de ejemplo ----
// `hechos`: ítems completados con hace cuántos días hábiles (aprox.) para que el demo tenga alertas reales.
function demo(codigo, nombre, nit, ciudad, etapa, valor, resp, extra) {
  return Object.assign({
    codigo, nombre, nit, ciudad, etapa, valor, resp,
    contacto: { nombre: 'Por definir', correo: '', tel: '' },
    ss: { arl: 'Positiva', ccf: 'Compensar', riesgo: 'I' },
    nomina: { iu: 8, corte: 'Quincenal (15 y 30)', pago: '30 días', formaPago: 'Transferencia' },
    centros: [{ nombre: 'Principal', nit, ciudad }],
    tarifas: { admin: 8, margen: 'Por negociar' },
    contratacion: { tipos: ['temporal'], validacion: 'Asignar', dotacion: false },
    turnos: [], contratos: [], aprob: {}, hechos: {}, inicio: 0,
  }, extra);
}

window.CLIENTES_DEMO = [
  demo('VLX', 'Velux Colombia', '900.123.456-1', 'Bogotá', 'apertura', 180, 'Paula', {
    contacto: { nombre: 'Andrea Molina', correo: 'amolina@velux.example', tel: '300 000 0001' },
    nomina: { iu: 9, corte: 'Quincenal (15 y 30)', pago: '15 días', formaPago: 'Transferencia' },
    centros: [{ nombre: 'Planta Sopó', nit: '900.123.456-1', ciudad: 'Sopó' }],
    tarifas: { admin: 9, margen: 'Aprobado' },
    contratacion: { tipos: ['temporal', 'requerimiento'], validacion: 'Empresa', dotacion: true },
    inicio: 6,
    hechos: { c1: 8, c2: 7, c3: 6, c4: 6, c5: 6, v1: 5, v2: 5, v3: 5, v4: 5, v5: 4 },
  }),
  demo('EST', 'Hoteles Estelar (ejemplo)', '800.555.777-2', 'Cali', 'activo', 420, 'Paula', {
    contacto: { nombre: 'Julián Rojas', correo: 'jrojas@estelar.example', tel: '300 000 0002' },
    centros: [
      { nombre: 'Estelar Cali', nit: '800.555.777-2', ciudad: 'Cali' },
      { nombre: 'Estelar Blue', nit: '800.555.777-2', ciudad: 'Cali' },
    ],
    tarifas: { admin: 7.5, margen: 'Aprobado' },
    contratacion: { tipos: ['temporal', 'flexible'], validacion: 'Asignar', dotacion: true },
    turnos: [
      { cargo: 'Auxiliar de servicio', turno: 'Mañana 6:00–14:00', personas: 12 },
      { cargo: 'Auxiliar de servicio', turno: 'Tarde 14:00–22:00', personas: 10 },
      { cargo: 'Mesero', turno: 'Rotativo', personas: 8 },
    ],
    contratos: [
      { nombre: 'Contrato marco 2024', fecha: '2024-03-12' },
      { nombre: 'Otrosí tarifas 2025', fecha: '2025-02-01' },
    ],
    aprob: { cumplimiento: '2026-01-10', credito: '2026-01-12', gerencia: '2026-01-13' },
    inicio: 200, hechos: 'TODOS',
  }),
  demo('LGX', 'Logística Andina (ejemplo)', '901.222.333-4', 'Medellín', 'negociacion', 95, 'Paula', {
    contacto: { nombre: 'Marcela Torres', correo: 'mtorres@logandina.example', tel: '300 000 0003' },
    inicio: 3, hechos: { c1: 3, c2: 2 },
  }),
  demo('FRB', 'Frutas del Bajo Cauca (ejemplo)', '900.777.888-5', 'Barranquilla', 'propuesta', 60, 'Paula', { inicio: 2, hechos: { c1: 2 } }),
  demo('TXL', 'Textiles del Valle (ejemplo)', '890.111.222-6', 'Cali', 'reunion', 40, 'Paula', {}),
  demo('PRM', 'Promotora Médica (ejemplo)', '901.999.000-7', 'Pereira', 'prospecto', 30, 'Paula', {}),
];
