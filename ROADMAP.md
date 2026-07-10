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
| 5 | Gestión de usuarios y líderes | Completada |
| 6 | Documentos adjuntos en procesos | Completada |
| 7 | Políticas y Reglamentos | Completada |
| 8 | Onboarding / Acogida Laboral | Pendiente |
| 9 | Entrenamientos y Capacitaciones | Pendiente |
| 10 | Periodos de Prueba | Pendiente |
| 11 | Encuestas | Pendiente |
| 12 | Expediente Digital del Colaborador | Pendiente |
| 13 | Comités y Compromisos (4DX) | Completada (MVP) |
| 14 | Mi perfil personalizable | Completada |
| 15 | Ausencias y permisos laborales | En curso (Sub-etapa A lista) |
| **16** | **Gestión Documental por Calidad** | **Planificada — meta ~2 semanas (A+B)** |
| 17 | Autoservicio: activar mi cuenta | Completada |

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

## Etapa 5 — Gestión de usuarios y líderes (completada) | Claude-Simon

- [x] Importador semanal desde Excel del software HR (hecho en Etapa 3)
- [x] UI para editar usuario individual (hecho en Sub-etapa 3.A.6)
- [x] Invitar al sistema (magic link — el trigger conecta con el registro existente)
- [x] Asignar líder a cada gestión
- [x] Vista del perfil completo de cada usuario

---

## Etapa 6 — Documentos adjuntos en procesos (completada) | Claude-Simon

- [x] Carga de archivos a Supabase Storage (bucket privado `documentos-procesos`)
- [x] Descarga desde la página del proceso vía URL firmada (10 min)
- [x] Límite de 20 MB y validación de tipos (PDF, Word, Excel, imágenes)
- [x] Solo el líder de la gestión del proceso (o admin) sube/elimina — RLS `es_lider_gestion`

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

## Etapa 13 — Comités y Compromisos (4DX) | Claude-Simon

Sistema de ejecución semanal inspirado en las 4 Disciplinas de la Ejecución. Actas semanales por gestión, compromisos con responsable + fecha límite, revisión chuleada en el comité siguiente, cálculo de % de cumplimiento.

### MVP (completado)
- [x] Schema: `comites`, `comite_asistentes`, `compromisos` + RLS por líder de gestión
- [x] Lista `/comites` con filtro por gestión y % de cumplimiento por comité
- [x] Crear comité que auto-siembra a los miembros activos de la gestión
- [x] Detalle del comité con revisión del anterior y compromisos nuevos
- [x] Marcar compromisos como cumplido / no cumplido / arrastrado
- [x] Cerrar comité cuando todos están evaluados

### Fase 1 (completada)
- [x] Ponderación por impacto (bajo/medio/alto) — peso 1/2/3, resuelve anti-sandbagging
- [x] % de cumplimiento ponderado en lista, detalle y tablero
- [x] Autorreporte del responsable (estado `reportado`) + confirmación del líder (2 pasos)
- [x] RLS: el responsable solo puede dejar su compromiso en pendiente/reportado, no auto-confirmarse
- [x] Tablero de resultados `/comites/tablero` por gestión con % ponderado acumulado y de la semana reciente

### Fase 2 (completada)
- [x] Ranking individual dentro de la gestión — puntos (peso cumplido) + % personal, `/comites/ranking`
- [x] Tabla comparativa normalizada en % entre gestiones, con posiciones
- [x] Filtro por año (acumulado anual, default año en curso)

### Fase 3 — gamificación (completada)
- [x] Heatmap de constancia semanal por persona (celdas coloreadas por % ponderado)
- [x] Ventanas de tiempo en el ranking (semana / mes / año)
- [x] Delta de puntos ganados en la semana en curso (+X)

### Fase 4 (pendiente, depende de Etapa 8)
- [ ] Cadena con onboarding (arrancar puntos desde período de prueba)

---

## Etapa 14 — Mi perfil personalizable (completada) | Claude-Simon

- [x] Columna `usuarios.nombre_preferido` + RPC `actualizar_mi_perfil` (SECURITY DEFINER: solo nombre preferido y celular del propio usuario)
- [x] Saludo del dashboard usa nombre preferido; fallback = última palabra del nombre en Title Case (los nombres del Excel vienen "APELLIDO APELLIDO NOMBRE")
- [x] En `/perfil/[id]`, cuando es el propio usuario: personalizar nombre preferido + celular
- [x] Mi desempeño en comités (puntos + % + compromisos) y heatmap de constancia en el propio perfil
- [x] Datos de contrato en solo lectura; jefe/cargo/gestión/rol bloqueados (solo admin)

---

## Etapa 15 — Ausencias y permisos laborales | Asignado: ``

Reemplaza el Google Forms "AUSENCIAS LABORALES ASIGNAR 2026" por un flujo interno con aprobación, doble validación y datos limpios para nómina. **Objetivo central: eliminar los errores de quincena** causados por digitación manual y procesos sueltos. **Decisión: Cerebro reemplaza el Forms de una — se deja de usar el Forms, todo se centraliza acá.**

**Fuentes originales (solo referencia, NO modificar):**
- Forms: `docs.google.com/forms/d/1QDSxAv-kYXS_K5QaVWqaeDcdPgpfSeWFiMjabY59AfM`
- Respuestas: `docs.google.com/spreadsheets/d/1OnlapgiNMiWckN2YA6oI2Td0KeMjaZ-CrVwo2vnaQSM`
- Organigrama (jerarquía para el 2º nivel): `canva.link/foaftfasyvp8m2r` → estructura mapeada en memoria `project_ausencias_permisos`.

**Tipos de ausencia:** Cita Médica EPS · Cita médico hijo/pariente · Medio día cumpleaños · Reposición del día · Diligencias personales · Licencia Maternidad/Paternidad · Permiso no remunerado · Votación Electoral · Permiso Remunerado · Calamidad Doméstica · Licencia por Luto · **Día de la Familia** (uno solo al año) · **Día de la Excelencia** (nuevo, reemplaza el 2º día de familia) · Incapacidad · Trabajo en Casa · Otras.

### Sub-etapa A — Catálogo y solicitud (completada) | Claude-Simon
- [x] Tabla `tipos_ausencia` con atributos de nómina + seed de los 16 tipos (Día de la Excelencia con doble validación)
- [x] Panel admin `/admin/tipos-ausencia`: TH edita remunerado/descuenta/soporte/doble validación/activo (guarda al instante)
- [x] Solicitud del colaborador `/ausencias/nueva`: **autocompleta** nombre, documento, cargo, gestión, jefe y ciudad desde el perfil. Elige tipo, fechas, horario, observaciones y adjunta soporte a Storage (bucket privado `soportes-ausencias`)
- [x] `/ausencias`: mis solicitudes con estado + cancelar mientras esté pendiente
- [x] Link "Permisos y Ausencias" en el sidebar

### Sub-etapa B — Aprobación y doble validación
- [ ] Bandeja del jefe directo: aprobar/denegar con comentario.
- [ ] **Doble validación** (por ahora solo el **Día de la Excelencia**): tras aprobar el jefe, pasa a un 2º aprobador. Estados: pendiente jefe → pendiente 2º nivel → aprobada / denegada. El 2º nivel se resuelve por la línea de mando del organigrama (coordinador → director/gerente) o TH — aprobador exacto a afinar.
- [ ] Notificar al colaborador el resultado (fase 2: correo).

### Sub-etapa C — Vista de nómina
- [ ] Vista para TH y contabilidad con TODAS las ausencias aprobadas, filtrable por quincena, con detalle de nómina (tipo, días, remunerado/descuenta, soporte). Exportable.
- [ ] **Visibilidad global permanente** para: Simón (líder TH), Gabriel (auxiliar TH), Diana Cano (directora control interno), José Fernández (auxiliar contable — consolida la nómina). Definir cómo se otorga (rol o flag `ve_ausencias`).

### Sub-etapa D — Recordatorios de ausencias vigentes (clave para nómina)
- [ ] Ausencias de larga duración que cruzan varias quincenas (incapacidades, licencias, permisos largos) **se recuerdan solas** en cada quincena mientras sigan vigentes (fecha_hasta futura), para no tener retrocesos por olvido.
- [ ] Panel/alerta en la vista de nómina: "personas ausentes vigentes hasta X fecha" en la quincena en curso.

### Migración
- [ ] Importar del Sheet **solo las respuestas desde junio 2026** en adelante.

---

## Etapa 16 — Gestión Documental por Calidad | Asignado: ``

Nace de la reunión del 2026-07-10 con **John William Guzmán Forero** (coord. SST y encargado de la gestión documental por calidad). Amplía el módulo de Procesos y Procedimientos (Etapas 1, 2 y 6) para que sirva como sistema de gestión documental de la organización.

> **GIRO DE RUMBO:** el **editor web es la fuente única de verdad**. Los procedimientos, programas e instructivos NO se suben como Word/Excel: se crean en la plataforma y se **exportan a PDF con formato predeterminado**. Los **formatos** sí siguen siendo adjuntos externos (Etapa 6 cubre eso).

**Tipos de documento a soportar (8):** Manual · Procedimiento · Programa · Instructivo · Guía · Formato · Reglamento · Plan. Cada gestión tendrá solo algunos.

**Roles y aprobación (acordados):** colaborador consulta · líder de gestión edita (requiere aprobación) · aprueban Calidad/TH: **Diana Cano, John William, Andrea Ossa**. John William necesita rol **admin**.

### Sub-etapa A — Cimientos: tipos de documento y control documental ⭐ (meta 2 semanas)
- [ ] Tabla `tipos_documento` + seed con los 8 tipos; `procesos.tipo_documento_id`
- [ ] Campos de control documental: `codigo` (ej. `TH-PR-01`), `fecha_emision`, `elaborado_por`, `revisado_por`, `aprobado_por`, `fecha_proxima_revision`
- [ ] Limpieza de las 21 gestiones (hay duplicadas y de prueba)
- [ ] Rol admin a John William; identificar a los aprobadores de Calidad

### Sub-etapa B — Trazabilidad: historial y aprobación ⭐ (meta 2 semanas)
- [ ] El editor **escribe** en `historial_versiones` (quién, cuándo, versión anterior→nueva, resumen del cambio) — hoy la tabla existe pero nadie escribe
- [ ] Botones **aprobar / rechazar** en `/admin/aprobaciones`; flujo `borrador → en_revision → activo`
- [ ] Firma electrónica del documento **reutilizando la de PDI** (Etapa 3.E)
- [ ] Notificar al líder el resultado de la aprobación

### Sub-etapa C — Editor web y exportación a PDF
- [ ] Editor estructurado según el tipo de documento (procedimiento, instructivo, programa…)
- [ ] **Exportar a PDF** con formato oficial: encabezado con código, versión, fechas y firmas
- [ ] Los formatos (Excel, etc.) siguen como adjuntos

### Sub-etapa D — Revisión periódica y alertas
- [ ] `fecha_proxima_revision` + regla de **desactualización automática** por fecha
- [ ] Alerta al líder cuando un documento está por vencer / venció
- [ ] **Alertas transversales**: si cambia un cargo en el organigrama, notificar los procedimientos afectados

### Sub-etapa E — Interconexión y glosario
- [ ] **Glosario por gestión**: cada líder crea y mantiene sus términos
- [ ] **Repositorio de manuales de cargo**, enlazado con procesos y procedimientos
- [ ] Interconexión procedimientos ↔ manual de funciones: agregar un cargo a una tarea actualiza el manual; quitar una responsabilidad se refleja en los KPIs del colaborador
- [ ] Trazabilidad cruzada por cliente entre gestiones, sin que se sobreescriban

### Sub-etapa F — Futuro (IA e integraciones)
- [ ] Foto de un acta en campo → el sistema la lee y genera el acta digital
- [ ] Integración con el CRM de Asignar (próximo año, al migrar al software principal). Hoy los acuerdos de servicio por cliente funcionan como CRM interno

### Compromisos operativos
- [ ] Simón descarga el listado de documentos por gestión que compartió John William y traza la estructura
- [ ] Simón solicita acceso a la carpeta de calidad de gerencia en Dropbox Medellín (de Sandra)
- [ ] Reunión presencial la próxima semana para homologar información

---

## Etapa 17 — Autoservicio: activar mi cuenta (completada) | Claude-Simon

Permite que los 138 colaboradores creen su propio acceso sin que TH reparta contraseñas y **sin enviar correos** (el SMTP de Supabase no sirve para producción). Solo 14 de 138 tenían correo cargado; en cambio 137 tienen cédula y fecha de nacimiento — por eso la identidad se valida con esos dos datos.

- [x] Pantalla pública `/activar` con asistente de 2 pasos
- [x] Paso 1: cédula + fecha de nacimiento → muestra el nombre **enmascarado** (`PUERTA C****** S****`) para confirmar
- [x] Paso 2: la persona elige su correo `@asignar.com.co` y su contraseña; queda vinculada a su ficha existente (jefe, cargo, gestión)
- [x] RPC `completar_registro` crea el login **reusando el id del registro** → no toca ninguna FK ni requiere service-role key
- [x] Rate limit: 5 intentos fallidos por cédula por hora (`intentos_registro`, auditable por admin)
- [x] Validación de correo institucional y contraseña ≥ 8 caracteres
- [x] Enlace "Activa tu cuenta" en el login; `/activar` exenta en el middleware

**Nota de costos:** Supabase Auth no cobra por usuario a esta escala (Free = 50.000 usuarios activos/mes; hay 138). Lo que consume plan es Storage y ancho de banda, no la autenticación.

---

## Mejoras transversales

- [x] Responsive/mobile first (CSS breakpoints) | Claude-MK
  - [x] Login responsive en móvil (2 columnas → 1 columna, panel visual oculto) | Claude-Marketing (PR #2)
  - [x] Barrido de grids fijos inline en 18 archivos más (buscar, reporte desempeño, perfil, comités, PDI, admin usuarios, etc.) | Claude-Marketing (PR #3)
- [x] Clases CSS reutilizables (DRY) | Claude-MK
  - [x] Nuevas clases mobile-first: `.layout-aside-main`, `.layout-chart-table`, `.layout-main-aside-wide`, `.grid-stats-3`, `.form-row-*` | Claude-Marketing (PR #3)
- [x] Loading skeletons por ruta | Claude-MK
- [x] Error boundary global | Claude-MK
- [ ] Filtro de búsqueda por gestión y nombre en `/admin/usuarios` (pedido por John William) | Asignado: ``
- [ ] Tests E2E (Playwright) | Asignado: ``
- [ ] Auditoría de accesibilidad (a11y) | Asignado: ``
  - [x] Primera pasada: `aria-hidden` en emojis decorativos del PDI | Claude-Marketing (PR #4)
  - [ ] Pendiente: aria-labels en botones-ícono (~40 casos), audit completo
- [x] Optimización de performance (LCP, CLS) | Claude-MK
- [x] Limpieza de código (build fix + higiene) | Claude-Marketing
  - [x] Fix build Vercel: mover `dynamic ssr:false` a Client Component (Next.js 16) (PR #1)
  - [x] Fix errores `react-hooks/purity` en `FormularioCiclo.tsx` y `ClienteAprobaciones.tsx` (PR #4)
  - [x] Fix `react-hooks/set-state-in-effect` en `ClienteBusqueda.tsx` (PR #4)
  - [x] Centralizar `obtenerIniciales` (elimina duplicación en 8 archivos, ya existía en `lib/sesion.ts`) (PR #4)
  - [x] `type="button"` a botones fuera de submit (PR #4)
  - [x] Quitar imports y parámetros no usados (PR #4)
  - Estado ESLint: 0 errores, 1 warning cosmético (`_error` requerido por firma de Next)
