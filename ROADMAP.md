# Roadmap — Cerebro Asignar

> Fuente de verdad para tareas, fases y asignaciones del proyecto.
> Antes de empezar cualquier tarea, revisa este archivo. Al terminar, actualiza el estado y haz commit junto con tu código.

## Convenciones

- **Asignado**: dejar vacío = libre. Poner nombre o iniciales al tomarlo (ej. `Simon`, `Claude-MK`, `Claude-SP`).
- **Estado**: `[ ]` pendiente · `[x]` completado · `[~]` en progreso.
- Al tomar una tarea: marcar `[~]`, poner asignado, commit del ROADMAP junto con el código.
- Al terminar: marcar `[x]`, commit final.

---

## Resumen de etapas

| # | Etapa | Estado |
|---|---|---|
| 1 | Repositorio de Procesos | Completada |
| 2 | Editor completo de procesos | Completada |
| **3** | **Desempeño - ECO-Asignar** | **Completada** |
| 4 | Deploy en Vercel | Completada (parcial) |
| 5 | Gestión de usuarios y líderes | Pendiente |
| 6 | Documentos adjuntos en procesos | Pendiente |
| 7 | Políticas y Reglamentos | Completada |
| 8 | Onboarding / Acogida Laboral | Pendiente |
| 9 | Entrenamientos y Capacitaciones | Pendiente |
| 10 | Periodos de Prueba | Pendiente |
| 11 | Encuestas | Pendiente |
| 12 | Expediente Digital del Colaborador | Pendiente |

---

## Etapa 1 — Repositorio de Procesos (completada)

Base de la plataforma: autenticación, roles y el núcleo del repositorio de conocimiento.

- [x] Login con roles (colaborador / líder / admin)
- [x] Dashboard principal con KPIs
- [x] 9 gestiones con colores e íconos propios
- [x] 150 actividades importadas — 7 gestiones misionales
- [x] Búsqueda global de procesos
- [x] Panel admin: gestiones, usuarios, aprobaciones
- [x] Schema completo con historial de versiones y RLS por rol

---

## Etapa 2 — Editor completo de procesos (completada)

- [x] Campos completos en el editor de pasos (`nombre`, `entradas`, `salidas`, `periodicidad`, `tiempos`, `acuerdo_servicio`)
- [x] Limpieza de código: clases CSS reutilizables en vez de estilos inline
- [x] Procesos por cliente en Servicio y Programación: ficha de cliente con varios contactos + acuerdo de servicio

---

## Etapa 3 — Desempeño - ECO-Asignar (prioridad actual)

> Pivote organizacional: este módulo pasó a ser prioridad. Reemplaza al proveedor externo de evaluación de competencias.

Mide las competencias organizacionales de cada colaborador, compara contra el nivel esperado del cargo, identifica brechas y genera un Plan de Desarrollo Individual (PDI). 360° para cargos con personal a cargo, 270° para los demás.

**Modelo:** 8 competencias (5 corporativas + 3 gerenciales) x 5 bandas (B1 Operativo - B5 Gerente) - 48 ítems - 39 acciones de desarrollo.

### Sub-etapa A — Catálogos y datos base (completada)

- [x] 13 tablas nuevas en Supabase (catálogos + operativas)
- [x] Extensión de `usuarios` con `cargo_id`, `sede`, `fecha_ingreso`, `jefe_id`
- [x] Seed completo importado del piloto (Excel): 5 bandas, 8 competencias, 34 niveles esperados, 7 ponderaciones, 48 ítems del cuestionario, 39 acciones de desarrollo
- [x] Vista del modelo de competencias con matriz coloreada
- [x] Vista del cuestionario completo
- [x] Vista del catálogo de acciones
- [x] Entrada en sidebar "Desempeño" con badge "Nuevo"

### Sub-etapa A.5 — Importador semanal de colaboradores (completada)

- [x] Lee Excel del software HR de Asignar
- [x] Identifica personas por código de contrato
- [x] Inferencia automática de sede por CCF + excepciones
- [x] Preview con conteos (nuevos / actualizar / inactivar)
- [x] 137 colaboradores activos importados

### Sub-etapa A.6 — Editor de usuario individual (completada)

- [x] Pantalla `/admin/usuarios/[id]` con form completo
- [x] Asignar cargo (con bandas agrupadas) y jefe directo
- [x] Editar correo, celular, sede, rol, gestión, activo
- [x] Vista de datos contractuales (solo lectura desde el Excel)
- [x] Botón de editar en la tabla de usuarios

### Sub-etapa A.7 — Asignación masiva desde Excel (completada)

- [x] 128 jefes asignados por matching de nombre desde el Excel
- [x] 132 gestiones asignadas (creadas 12 nuevas)
- [x] 27 líderes promovidos automáticamente

### Sub-etapa A.8 — Unificación de identidades + trigger anti-duplicados (completada)

- [x] Simon admin unificado con su registro del Excel (ASI473)
- [x] Trigger `manejar_nuevo_usuario` mejorado: busca por correo y reusa el registro existente
- [x] Evita duplicados al loguearse por primera vez

### Sub-etapa B — Ciclos y plan de evaluación (completada)

- [x] TH crea un ciclo con nombre, fechas y bandas que aplican
- [x] Instanciación automática de evaluaciones por colaborador
- [x] Auto-asignación de jefe inmediato y autoevaluación
- [x] Pantalla de detalle con tabla, filtros y modal de asignación de pares/reportes
- [x] Validación de modalidad según banda (360° / 270°)
- [x] KPIs de cobertura del ciclo

### Sub-etapa C — Captura de cuestionarios (completada)

- [x] Lista de pendientes por evaluador con KPIs y badges por tipo
- [x] Cuestionario en tercera persona (jefe/par/reporte)
- [x] Cuestionario en primera persona (autoevaluación)
- [x] Persistencia de respuestas con escala 1-5 (o "no observado")
- [x] Confidencialidad: RLS + mensaje al evaluador
- [x] Guardado parcial + barra de progreso sticky

### Sub-etapa D — Cálculo y reporte individual (completada) | Claude-Simon

- [x] Motor de cálculo con promedios simples y ponderados por fuente
- [x] Redistribución de pesos cuando una fuente no tiene respuestas
- [x] Cálculo de brechas vs matriz de niveles esperados
- [x] Reporte individual con radar chart actual vs esperado
- [x] TOP 3 de acciones recomendadas con diversidad por competencia
- [x] Alerta automática si líder con promedio general < 4.0

### Sub-etapa E — PDI y seguimiento (completada) | Claude-Simon

- [x] Generación del borrador de PDI desde TOP 3
- [x] Selección manual de hasta 3 acciones del catálogo
- [x] Firma digital del colaborador, jefe y TH
- [x] Seguimiento mensual del avance de cada acción
- [x] Dashboard de cumplimiento de PDIs vigentes

---

## Etapa 4 — Deploy en Vercel (parcialmente completada)

- [x] Proyecto en Vercel conectado al repo
- [x] Variables de entorno configuradas
- [ ] Dominio personalizado (`cerebro.asignar.com.co`) | Asignado: ``
- [ ] Mantener Supabase despierto con tráfico real | Asignado: ``

---

## Etapa 5 — Gestión de usuarios y líderes

- [x] Importador semanal desde Excel del software HR (hecho en Etapa 3)
- [ ] UI para editar usuario individual (cargo, jefe, sede, correo) | Asignado: ``
- [ ] Invitar al sistema (crear auth user con password reset) | Asignado: ``
- [ ] Asignar líder a cada gestión | Asignado: ``
- [ ] Vista del perfil completo de cada usuario | Asignado: ``

---

## Etapa 6 — Documentos adjuntos en procesos

- [ ] Carga de archivos a Supabase Storage | Asignado: ``
- [ ] Descarga de documentos desde la página del proceso | Asignado: ``
- [ ] Límite de tamaño y validación de tipos | Asignado: ``

---

## Etapa 7 — Políticas y Reglamentos (completada) | Claude-Simon

- [x] Categorías: reglamento interno, políticas, manuales, circulares
- [x] Descarga directa de PDFs
- [x] Control de versiones de documentos

---

## Etapa 8 — Onboarding / Acogida Laboral

- [ ] Checklist de onboarding por cargo | Asignado: ``
- [ ] Progreso guardado por usuario | Asignado: ``
- [ ] Firma digital de recibido | Asignado: ``
- [ ] Vista del líder para seguimiento | Asignado: ``

---

## Etapa 9 — Entrenamientos y Capacitaciones

- [ ] Registro de capacitaciones por colaborador | Asignado: ``
- [ ] Certificaciones con fecha de vencimiento | Asignado: ``
- [ ] Alertas de renovación | Asignado: ``
- [ ] Reporte por gestión | Asignado: ``

---

## Etapa 10 — Periodos de Prueba

- [ ] Checklist de evaluación por etapas | Asignado: ``
- [ ] Comentarios del líder por período | Asignado: ``
- [ ] Resultado final con firma | Asignado: ``
- [ ] Historial por colaborador | Asignado: ``

---

## Etapa 11 — Encuestas

- [ ] Constructor de encuestas (preguntas abiertas, escala, opción múltiple) | Asignado: ``
- [ ] Envío a gestiones o colaboradores específicos | Asignado: ``
- [ ] Dashboard de resultados en tiempo real | Asignado: ``
- [ ] Histórico de encuestas | Asignado: ``

---

## Etapa 12 — Expediente Digital del Colaborador

- [ ] Datos personales y contractuales | Asignado: ``
- [ ] Documentos de vinculación | Asignado: ``
- [ ] Historial de evaluaciones y capacitaciones (Etapa 3 + Etapa 9) | Asignado: ``
- [ ] Novedades y observaciones | Asignado: ``

---

## Mejoras transversales

- [x] Responsive/mobile first (CSS breakpoints) | Claude-MK
- [x] Clases CSS reutilizables (DRY) | Claude-MK
- [x] Loading skeletons por ruta | Claude-MK
- [x] Error boundary global | Claude-MK
- [ ] Tests E2E (Playwright) | Asignado: ``
- [ ] Auditoría de accesibilidad (a11y) | Asignado: ``
- [ ] Optimización de performance (LCP, CLS) | Asignado: ``
