#!/usr/bin/env bash
# Crear todos los issues iniciales del proyecto Cerebro Asignar
# Uso: bash scripts/github/02-issues.sh
# Pre-requisito: correr antes 01-labels-y-milestones.sh
set -e

REPO_FULL=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "==> Trabajando sobre repo: $REPO_FULL"

# Helper para extraer el numero del issue creado
extract_num() {
  echo "$1" | grep -oE '/issues/[0-9]+' | grep -oE '[0-9]+' | head -1
}

# ============================================================
# EPIC: Etapa 3 — Desempeño · ECO-Asignar
# ============================================================
echo "==> Creando Epic Etapa 3..."
URL_E3=$(gh issue create \
  --title "[Epic] Etapa 3 — Desempeño · ECO-Asignar" \
  --label "epic,etapa-3-desempeno,prioridad-alta" \
  --milestone "Etapa 3 — Desempeño · ECO-Asignar" \
  --body "$(cat <<'EOF'
## Objetivo
Construir el módulo completo de **Evaluación de Competencias Organizacionales (ECO-Asignar)** dentro de Cerebro Asignar. Reemplaza al proveedor externo "Inteligencia e Innovación" para la evaluación de competencias.

## Modelo
- **8 competencias** (5 corporativas + 3 gerenciales)
- **5 bandas** de cargo (B1 Operativo → B5 Gerente)
- **48 ítems** de cuestionario con doble redacción (tercera persona + autoevaluación)
- **39 acciones** de desarrollo curadas
- **360°** para cargos con personal a cargo, **270°** para los demás

## Sub-etapas
- [x] **Sub-etapa A** — Catálogos y datos base *(completada)*
- [x] **Sub-etapa A.5** — Importador semanal de colaboradores desde Excel *(completada)*
- [ ] **Sub-etapa B** — Ciclos y plan de evaluación → ver issue
- [ ] **Sub-etapa C** — Captura de cuestionarios → ver issue
- [ ] **Sub-etapa D** — Cálculo y reporte individual con radar chart → ver issue
- [ ] **Sub-etapa E** — PDI y seguimiento → ver issue

## Referencias
- Especificación técnica completa: \`TALENTO HUMANO/DESARROLLO/EVALUACIÓN POR COMPETENCIAS/07_ESPECIFICACION_CEREBRO_ASIGNAR.md\`
- Política TH-PL-02 + Guía A2-GU-06 (marco normativo)
- 13 tablas ya creadas en Supabase

## Definition of Done
- TH puede correr un ciclo completo de evaluación de punta a punta
- Sistema genera el PDI con TOP 3 de acciones recomendadas
- Firmas digitales del colaborador, jefe y TH
- Seguimiento mensual del PDI
EOF
)")
NUM_E3=$(extract_num "$URL_E3")
echo "  Epic Etapa 3 creado: #$NUM_E3"

# Sub-etapa 3.B
echo "==> Creando Sub-etapa 3.B..."
gh issue create \
  --title "[Sub-etapa 3.B] Ciclos de evaluación y plan de evaluadores" \
  --label "sub-etapa,etapa-3-desempeno" \
  --milestone "Etapa 3 — Desempeño · ECO-Asignar" \
  --body "$(cat <<EOF
Forma parte de #$NUM_E3.

## Objetivo
Permitir a Talento Humano crear ciclos de evaluación, instanciar evaluaciones automáticamente para los colaboradores aplicables, y asignar evaluadores (pares y reportes) por cada evaluado.

## Tareas
- [ ] CRUD de \`ciclos_evaluacion\` (nombre, fechas, bandas que aplican)
- [ ] Al crear ciclo: instanciar automáticamente \`evaluaciones\` por colaborador activo
- [ ] Pantalla del ciclo con lista de evaluaciones y su estado
- [ ] Asignar pares (mínimo 1-2) por cada evaluado
- [ ] Asignar reportes directos (solo modalidad 360°)
- [ ] Auto-asignar jefe inmediato + autoevaluación
- [ ] Validar mínimos según modalidad (360°/270°)
- [ ] Dashboard de cobertura: KPIs globales (planificadas / respondidas / cobertura %)
- [ ] Recordatorios automáticos a evaluadores pendientes (manual por ahora)

## Tablas involucradas
\`ciclos_evaluacion\`, \`evaluaciones\`, \`plan_evaluacion\`, \`usuarios\`

## Pantallas
- \`/desempeno/ciclos\` — lista de ciclos
- \`/desempeno/ciclos/[id]\` — detalle + asignar evaluadores
- \`/desempeno/ciclos/[id]/cobertura\` — dashboard

## Bloqueado por
Nada. Catálogos ya están sembrados.
EOF
)"

# Sub-etapa 3.C
echo "==> Creando Sub-etapa 3.C..."
gh issue create \
  --title "[Sub-etapa 3.C] Captura de cuestionarios (360°/270°)" \
  --label "sub-etapa,etapa-3-desempeno" \
  --milestone "Etapa 3 — Desempeño · ECO-Asignar" \
  --body "$(cat <<EOF
Forma parte de #$NUM_E3.

## Objetivo
Pantallas para que cada evaluador (jefe, par, reporte, autoevaluación) responda los cuestionarios que se le asignaron.

## Tareas
- [ ] Lista de \"Cuestionarios pendientes\" por evaluador en \`/desempeno/mis-pendientes\`
- [ ] Pantalla de respuesta: 6 ítems por competencia, escala 1-5
- [ ] Texto en **tercera persona** para jefes/pares/reportes
- [ ] Texto en **primera persona** para autoevaluación
- [ ] Opción \"No he observado\" (calificación NULL)
- [ ] Guardado parcial (puede dejar a medias y volver)
- [ ] Al guardar todo: marcar \`plan_evaluacion.estado = 'Respondida'\`
- [ ] Confidencialidad: el evaluado NO ve quién le calificó qué

## Tablas involucradas
\`plan_evaluacion\`, \`respuestas\`, \`items_cuestionario\`

## Bloqueado por
Sub-etapa 3.B (necesita planes de evaluación creados).
EOF
)"

# Sub-etapa 3.D
echo "==> Creando Sub-etapa 3.D..."
gh issue create \
  --title "[Sub-etapa 3.D] Cálculo y reporte individual con radar chart" \
  --label "sub-etapa,etapa-3-desempeno" \
  --milestone "Etapa 3 — Desempeño · ECO-Asignar" \
  --body "$(cat <<EOF
Forma parte de #$NUM_E3.

## Objetivo
Motor de cálculo de brechas + reporte individual con visualización radar.

## Tareas
- [ ] Promedio simple por (competencia, tipo_evaluador) — desde respuestas
- [ ] Promedio ponderado por competencia aplicando ponderaciones por modalidad
- [ ] **Importante:** redistribuir pesos si un tipo de evaluador no tiene respuestas
- [ ] Calcular brecha = nivel_esperado - promedio_ponderado
- [ ] Clasificar prioridad por brecha (Cumple / Monitorear / Desarrollar / Prioridad alta)
- [ ] Promedio general
- [ ] Flag \`requiere_revision\` si líder con promedio general < 4.0
- [ ] Pantalla de reporte individual con tabla actual/esperado/brecha
- [ ] **Radar chart** comparativo actual vs esperado (recharts o similar)
- [ ] Mostrar TOP 3 de acciones recomendadas (algoritmo del spec §5.5)
- [ ] Persistir resultados en tabla derivada para histórico

## Algoritmo TOP 3
- Score = (prioridad_detectada × 100) + peso_tipo
- Pesos: Lectura=9, Feedback=8, ..., Programa=1 (favorece acciones livianas)
- Regla de diversidad: máximo 2 acciones por competencia en el TOP 3

## Bloqueado por
Sub-etapa 3.C (necesita respuestas capturadas).
EOF
)"

# Sub-etapa 3.E
echo "==> Creando Sub-etapa 3.E..."
gh issue create \
  --title "[Sub-etapa 3.E] PDI con firmas y seguimiento mensual" \
  --label "sub-etapa,etapa-3-desempeno" \
  --milestone "Etapa 3 — Desempeño · ECO-Asignar" \
  --body "$(cat <<EOF
Forma parte de #$NUM_E3.

## Objetivo
Generar el Plan de Desarrollo Individual desde el TOP 3, recoger firmas y hacer seguimiento mensual.

## Tareas
- [ ] Borrador automático de PDI desde TOP 3 de la sub-etapa D
- [ ] Selección manual de 1-3 acciones del catálogo
- [ ] Por cada acción: fecha_inicio, fecha_fin, responsable_seguimiento
- [ ] Pantalla de firma digital del colaborador
- [ ] Pantalla de firma del jefe directo
- [ ] Pantalla de firma de TH
- [ ] Estado pasa a \"Cerrada\" cuando las 3 firmas están
- [ ] Seguimiento mensual: jefe marca avance (\"Pendiente\", \"En curso\", \"Cumplida\", \"No cumplida\")
- [ ] Dashboard de PDIs vigentes con cumplimiento

## Reglas
- Máximo 3 acciones por PDI (validar en backend)
- Las 3 firmas son requeridas para cerrar

## Tablas involucradas
\`pdi\`, \`pdi_acciones\`, \`acciones_desarrollo\`

## Bloqueado por
Sub-etapa 3.D (necesita reporte y TOP 3).
EOF
)"

# ============================================================
# EPIC: Etapa 5 — Gestión de usuarios y líderes
# ============================================================
echo "==> Creando Epic Etapa 5..."
gh issue create \
  --title "[Epic] Etapa 5 — Gestión de usuarios y líderes" \
  --label "epic,etapa-5-usuarios" \
  --milestone "Etapa 5 — Gestión de usuarios y líderes" \
  --body "$(cat <<'EOF'
## Objetivo
El admin tiene control completo sobre los 139 colaboradores que ya están en el sistema (importados del Excel) y puede invitarlos al sistema, asignarles cargo, jefe, sede y rol.

## Tareas
- [x] Importador semanal desde Excel del software HR (hecho en Etapa 3b)
- [ ] **Editar usuario individual** desde `/admin/usuarios/[id]`
  - [ ] Asignar cargo (dropdown del catálogo de 55)
  - [ ] Asignar jefe directo
  - [ ] Editar sede (sobreescribir inferencia automática)
  - [ ] Asignar correo corporativo
  - [ ] Cambiar rol (colaborador / lider / admin)
- [ ] **Invitar al sistema** — crear `auth.users` para que pueda loguearse
  - [ ] Botón "Invitar" en la lista de usuarios
  - [ ] Email automático con link de password reset
  - [ ] Marcar `tiene_login = true`
- [ ] **Asignar líder a gestión** desde `/admin/gestiones/[id]`
  - [ ] Dropdown filtrado por rol = 'lider'
  - [ ] Cambia `gestiones.lider_id`
- [ ] **Filtros y búsqueda** en lista de usuarios
  - [ ] Por sede, cargo, rol, activo/inactivo, con login/sin login

## Pre-requisito
Importador semanal ya creado (Etapa 3b).

## Definition of Done
TH puede tener al 100% del personal con cargo, jefe y sede correctos. Los líderes y admins tienen login activo.
EOF
)"

# ============================================================
# EPIC: Etapa 6 — Documentos adjuntos en procesos
# ============================================================
echo "==> Creando Epic Etapa 6..."
gh issue create \
  --title "[Epic] Etapa 6 — Documentos adjuntos en procesos" \
  --label "epic,etapa-6-documentos" \
  --milestone "Etapa 6 — Documentos adjuntos" \
  --body "$(cat <<'EOF'
## Objetivo
Cada proceso puede tener PDFs, Word, Excel, PowerPoint y otros archivos adjuntos como recursos. La UI ya tiene la sección visual ("Documentos relacionados") en el formulario y en la página del proceso, falta conectarla a Supabase Storage.

## Tareas
- [ ] Bucket `documentos-procesos` en Supabase Storage (ya existe en schema)
- [ ] Subida real de archivos desde el formulario de proceso
- [ ] Validación de tamaño (máx 20 MB por archivo)
- [ ] Validación de tipos (.pdf, .docx, .xlsx, .pptx)
- [ ] Generar URL firmada para descarga (no pública)
- [ ] Mostrar miniatura/preview del PDF si es posible
- [ ] Eliminar archivo desde el editor
- [ ] Permisos RLS por gestión (solo lider de esa gestión sube/borra)

## Tablas involucradas
`documentos` (ya creada), Supabase Storage bucket `documentos-procesos`
EOF
)"

# ============================================================
# EPIC: Etapa 7 — Políticas y Reglamentos
# ============================================================
echo "==> Creando Epic Etapa 7..."
gh issue create \
  --title "[Epic] Etapa 7 — Políticas y Reglamentos" \
  --label "epic,etapa-7-politicas" \
  --milestone "Etapa 7 — Políticas y Reglamentos" \
  --body "$(cat <<'EOF'
## Objetivo
Repositorio centralizado de documentos normativos: reglamento interno, políticas, manuales, circulares. Acceso para todos los colaboradores con login.

## Tareas
- [ ] Diseño schema: tabla `politicas` con categoría, versión, fecha de vigencia
- [ ] Categorías iniciales: Reglamento Interno, Políticas, Manuales, Circulares
- [ ] Sección `/politicas` en sidebar (reemplazar el actual "PRONTO")
- [ ] Lista con filtros por categoría
- [ ] Subida/descarga de PDFs
- [ ] Control de versiones: cuando se sube una nueva versión, la anterior queda en histórico
- [ ] Notificación al equipo cuando hay una nueva política publicada (manual por ahora)

## Permisos
- Lectura: todos los usuarios autenticados
- Subida/edición: solo admins
EOF
)"

# ============================================================
# EPIC: Etapa 8 — Onboarding / Acogida Laboral
# ============================================================
echo "==> Creando Epic Etapa 8..."
gh issue create \
  --title "[Epic] Etapa 8 — Onboarding / Acogida Laboral" \
  --label "epic,etapa-8-onboarding" \
  --milestone "Etapa 8 — Onboarding" \
  --body "$(cat <<'EOF'
## Objetivo
Ruta de inducción estructurada para nuevos colaboradores. Cada cargo tiene su checklist propio. El nuevo colaborador puede marcar su progreso y firmar al final.

## Tareas
- [ ] Diseño schema: `plantillas_onboarding` (por cargo o por banda), `items_onboarding`, `onboarding_colaborador`
- [ ] Editor de plantillas (admin/líder)
- [ ] Vista del nuevo colaborador con su checklist activo
- [ ] Progreso guardado por usuario
- [ ] Firma digital de "Recibido" al completar
- [ ] Vista del líder para seguimiento de los onboardings de su equipo
- [ ] Plazo: 15 días + evaluación a 2 meses (según política TH-PL-02 §3)

## Sección del sidebar
Reemplazar el actual "PRONTO" de "Acogida Laboral".
EOF
)"

# ============================================================
# EPIC: Etapa 9 — Entrenamientos y Capacitaciones
# ============================================================
echo "==> Creando Epic Etapa 9..."
gh issue create \
  --title "[Epic] Etapa 9 — Entrenamientos y Capacitaciones" \
  --label "epic,etapa-9-entrenamientos" \
  --milestone "Etapa 9 — Entrenamientos" \
  --body "$(cat <<'EOF'
## Objetivo
Registrar y dar seguimiento a toda la formación que reciben los colaboradores (Asignar+, capacitaciones internas, externas, certificaciones).

## Tareas
- [ ] Diseño schema: `capacitaciones`, `certificaciones`, `capacitacion_colaborador`
- [ ] Catálogo de capacitaciones (admin)
- [ ] Registrar asistencia: por capacitación, qué colaboradores la tomaron
- [ ] Certificaciones con fecha de vencimiento
- [ ] Alertas de renovación (90 días antes del vencimiento)
- [ ] Reporte por gestión: % de capacitación
- [ ] Conexión con catálogo de acciones de desarrollo (ECO-Asignar)
  - Las acciones tipo "Curso (Asignar+)" deberían vincularse aquí

## Integración con ECO-Asignar
Cuando se cumple una acción del PDI tipo "Curso", se marca aquí también.
EOF
)"

# ============================================================
# EPIC: Etapa 10 — Periodos de Prueba
# ============================================================
echo "==> Creando Epic Etapa 10..."
gh issue create \
  --title "[Epic] Etapa 10 — Periodos de Prueba" \
  --label "epic,etapa-10-prueba" \
  --milestone "Etapa 10 — Periodos de Prueba" \
  --body "$(cat <<'EOF'
## Objetivo
Seguimiento estructurado del periodo de prueba de cada colaborador con checklists por etapas, comentarios del líder y firma al final.

## Tareas
- [ ] Diseño schema: `periodos_prueba`, `etapas_prueba`, `evaluaciones_prueba`
- [ ] Etapas estándar (15 días, 1 mes, 2 meses) según política
- [ ] Checklist por etapa con criterios de evaluación
- [ ] Comentarios del líder por cada etapa
- [ ] Resultado final: aprobado / no aprobado / extender
- [ ] Firma del líder y de TH
- [ ] Historial por colaborador
- [ ] Activación automática al ingreso de un nuevo colaborador del Excel

## Política
TH-PL-02 §3 Paso 1: seguimiento a 15 días + evaluación a 2 meses.
EOF
)"

# ============================================================
# EPIC: Etapa 11 — Encuestas
# ============================================================
echo "==> Creando Epic Etapa 11..."
gh issue create \
  --title "[Epic] Etapa 11 — Encuestas de clima y satisfacción" \
  --label "epic,etapa-11-encuestas" \
  --milestone "Etapa 11 — Encuestas" \
  --body "$(cat <<'EOF'
## Objetivo
Constructor de encuestas para medir clima laboral, satisfacción y pulso del equipo. Resultados en dashboard.

## Tareas
- [ ] Diseño schema: `encuestas`, `preguntas`, `respuestas_encuesta`
- [ ] Constructor de encuestas (admin)
  - [ ] Pregunta abierta (texto)
  - [ ] Escala numérica (1-5, 1-10, NPS)
  - [ ] Opción múltiple (radio / checkbox)
  - [ ] Página de bienvenida
- [ ] Envío a gestiones específicas o a todos
- [ ] Anónima o nominal (configurable)
- [ ] Pantalla de respuesta para el colaborador
- [ ] Dashboard de resultados en tiempo real
  - [ ] Promedios por pregunta
  - [ ] Distribución de respuestas
  - [ ] Comparativo entre gestiones
- [ ] Histórico de encuestas

## Tipos sugeridos
- Pulso semanal (NPS, escala)
- Clima laboral semestral
- Satisfacción con líder (anónima)
EOF
)"

# ============================================================
# EPIC: Etapa 12 — Expediente Digital
# ============================================================
echo "==> Creando Epic Etapa 12..."
gh issue create \
  --title "[Epic] Etapa 12 — Expediente Digital del Colaborador" \
  --label "epic,etapa-12-expediente" \
  --milestone "Etapa 12 — Expediente Digital" \
  --body "$(cat <<'EOF'
## Objetivo
Toda la información de cada colaborador centralizada en una vista de perfil completa.

## Tareas
- [ ] Diseño schema: agregar campos a `usuarios` o tabla separada `expediente`
- [ ] Pantalla `/usuarios/[id]/expediente` (solo TH y jefe directo)
- [ ] Sección: Datos personales y contractuales
- [ ] Sección: Documentos de vinculación (PDFs)
- [ ] Sección: Historial de evaluaciones (de Etapa 3)
- [ ] Sección: Historial de capacitaciones (de Etapa 9)
- [ ] Sección: Periodo de prueba (de Etapa 10)
- [ ] Sección: PDIs anteriores (de Etapa 3.E)
- [ ] Sección: Novedades y observaciones
- [ ] Permisos: solo TH ve todo; jefe directo ve lo de su equipo

## Bloqueado por
Buena parte: necesita que las etapas 3, 9 y 10 ya estén funcionando.
EOF
)"

# ============================================================
# BUGS Y MEJORAS PENDIENTES
# ============================================================
echo "==> Creando bugs y mejoras..."

gh issue create \
  --title "[Bug] Dashboard timeout con conexión lenta (saturación del connection pool)" \
  --label "bug,etapa-5-usuarios" \
  --body "$(cat <<'EOF'
## Síntoma
Con conexión a internet lenta, el dashboard muestra todo en 0 (gestiones, procesos, usuarios). En logs aparece:
```
PGRST003: Timed out acquiring connection from connection pool
57014: canceling statement due to statement timeout
```

## Causa
Las queries paralelas saturan el connection pool cuando la latencia con Supabase es alta.

## Mitigación actual (parcial)
- Volvimos a usar joins nested (2 queries en lugar de 5)
- Mensaje visible al usuario cuando hay error de BD
- Console.error con detalle

## Pendiente
- [ ] Verificar otras páginas con problema similar
- [ ] Quizás usar Server Components con Suspense y streaming
- [ ] Considerar cachear con `revalidate` ciertas queries
- [ ] Configurar pooling de Supabase (revisar plan)
EOF
)"

gh issue create \
  --title "[Mejora] UI para editar usuario individual (cargo, jefe, sede, correo)" \
  --label "mejora,etapa-5-usuarios,prioridad-alta,buena-primera-tarea" \
  --milestone "Etapa 5 — Gestión de usuarios y líderes" \
  --body "$(cat <<'EOF'
## Contexto
Los 139 colaboradores importados del Excel no tienen cargo asignado en BD (ni correo ni jefe). El admin necesita poder asignarles esos campos uno por uno o en masa.

## Tareas
- [ ] Nueva ruta `/admin/usuarios/[id]`
- [ ] Form con todos los campos editables:
  - [ ] cargo_id (dropdown de 55 cargos)
  - [ ] jefe_id (dropdown filtrado de usuarios con rol líder/admin)
  - [ ] sede (texto editable, sobreescribe inferencia)
  - [ ] correo (con validación de unicidad)
  - [ ] rol (colaborador/lider/admin — solo admin puede cambiar)
- [ ] Botón "Editar" en la fila de la tabla de usuarios
- [ ] Bonus: Edición rápida inline para cargo y jefe (sin entrar al perfil)

## Tipos
Es buena primera tarea — todos los componentes ya existen, solo es CRUD.
EOF
)"

gh issue create \
  --title "[Mejora] Implementar botón \"Invitar usuario\" en admin/usuarios" \
  --label "mejora,etapa-5-usuarios" \
  --milestone "Etapa 5 — Gestión de usuarios y líderes" \
  --body "$(cat <<'EOF'
## Contexto
El botón "Invitar usuario" existe en la UI pero no hace nada todavía. Debería crear un `auth.users` para que esa persona pueda loguearse.

## Tareas
- [ ] Modal con email y rol al hacer clic en "Invitar"
- [ ] Llamar a `supabase.auth.admin.inviteUserByEmail()` desde server action
- [ ] El usuario recibe email con link de set-password
- [ ] Una vez registrado, vincular `usuarios.codigo_contrato` existente con el nuevo `auth.users.id`
- [ ] Marcar `tiene_login = true`
- [ ] Lista actualiza el contador "con login"

## Nota
La invitación por email requiere configurar SMTP en Supabase o usar un servicio como Resend.
EOF
)"

gh issue create \
  --title "[Mejora] Mover excepciones de sede CCF ANTIOQUIA → tabla \`sede_overrides\`" \
  --label "mejora,etapa-5-usuarios" \
  --body "$(cat <<'EOF'
## Contexto
Hoy en el importador hay 3 códigos hardcoded para mapear CCF COMFENALCO ANTIOQUIA → Rionegro:
- ASI768 (María Alejandra Hernandez)
- ASI1165 (Daily Gabriela Castro)
- ASI1104 (Abraham Sahid Suárez)

Si en el futuro entran más personas en Rionegro, hay que tocar código. No escala.

## Propuesta
- [ ] Tabla nueva `sede_overrides` (codigo_contrato unique, sede)
- [ ] El importador consulta esta tabla antes de aplicar el default de CCF
- [ ] UI para que el admin agregue/quite excepciones desde `/admin/usuarios/configuracion-sedes`
- [ ] Migrar los 3 códigos actuales a la tabla

## Beneficio
Configurable desde la UI, no requiere deploy para cambiarlo.
EOF
)"

echo ""
echo "==> ✅ Listo. Issues creados."
echo "==> Revísalos en: https://github.com/$REPO_FULL/issues"
