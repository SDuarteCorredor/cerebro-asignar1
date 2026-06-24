# 🧠 Cerebro Asignar

> Plataforma interna de Talento Humano para **Asignar SAS**

La herramienta total de TH: repositorio de procesos, evaluación de competencias, encuestas, onboarding, desempeño y más — construida exactamente para Asignar, sin costos de licencias.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend + API | Next.js 16 · TypeScript |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Archivos | Supabase Storage |
| Deploy | Vercel *(pendiente)* |

---

## Estado del proyecto

| # | Etapa | Estado |
|---|---|---|
| 1 | Repositorio de Procesos | ✅ Completada |
| 2 | Editor completo de procesos | ✅ Completada |
| **3** | **Desempeño · ECO-Asignar** | 🔄 **En curso (Sub-etapa A completa)** |
| 4 | Deploy en Vercel | ✅ Completada |
| 5 | Gestión de usuarios y líderes | ⏳ Pendiente |
| 6 | Documentos adjuntos en procesos | ⏳ Pendiente |
| 7 | Políticas y Reglamentos | ⏳ Pendiente |
| 8 | Onboarding / Acogida Laboral | ⏳ Pendiente |
| 9 | Entrenamientos y Capacitaciones | ⏳ Pendiente |
| 10 | Periodos de Prueba | ⏳ Pendiente |
| 11 | Encuestas | ⏳ Pendiente |
| 12 | Expediente Digital del Colaborador | ⏳ Pendiente |

---

## ✅ Etapa 1 — Repositorio de Procesos *(completada)*
Base de la plataforma: autenticación, roles y el núcleo del repositorio de conocimiento.

- [x] Login con roles (colaborador / líder / admin)
- [x] Dashboard principal con KPIs
- [x] 9 gestiones con colores e íconos propios
- [x] 150 actividades importadas — 7 gestiones misionales
- [x] Búsqueda global de procesos
- [x] Panel admin: gestiones, usuarios, aprobaciones
- [x] Schema completo con historial de versiones y RLS por rol

---

## ✅ Etapa 2 — Editor completo de procesos *(completada)*
*Objetivo: los líderes pueden documentar procesos nuevos con todos los campos.*

- [x] Campos completos en el editor de pasos (`nombre`, `entradas`, `salidas`, `periodicidad`, `tiempos`, `acuerdo_servicio`)
- [x] Limpieza de código: clases CSS reutilizables en vez de estilos inline
- [x] **Procesos por cliente** en Servicio y Programación: ficha de cliente con varios contactos + acuerdo de servicio (tarifa, tipo de servicio, uniforme, detalles)

---

## 🔄 Etapa 3 — Desempeño · ECO-Asignar *(prioridad actual)*

> **Pivote organizacional:** este módulo pasó a ser prioridad para terminar antes que el resto del backlog. Reemplaza al proveedor externo de evaluación de competencias.

Mide las competencias organizacionales de cada colaborador, compara contra el nivel esperado del cargo, identifica brechas y genera un Plan de Desarrollo Individual (PDI). 360° para cargos con personal a cargo, 270° para los demás.

**Modelo:** 8 competencias (5 corporativas + 3 gerenciales) × 5 bandas (B1 Operativo → B5 Gerente) · 48 ítems · 39 acciones de desarrollo.

### Sub-etapas

#### ✅ Sub-etapa A — Catálogos y datos base *(completada)*
- [x] 13 tablas nuevas en Supabase (catálogos + operativas)
- [x] Extensión de `usuarios` con `cargo_id`, `sede`, `fecha_ingreso`, `jefe_id`
- [x] Seed completo importado del piloto (Excel):
  - 5 bandas · 8 competencias · 34 niveles esperados · 7 ponderaciones
  - 48 ítems del cuestionario (tercera persona + autoevaluación)
  - 39 acciones de desarrollo (A001–A039)
- [x] Vista del modelo de competencias con matriz coloreada
- [x] Vista del cuestionario completo
- [x] Vista del catálogo de acciones
- [x] Entrada en sidebar "Desempeño" con badge "Nuevo"

#### ✅ Sub-etapa A.5 — Importador semanal de colaboradores *(completada)*
- [x] Lee Excel del software HR de Asignar (Código, Cargo, Email, Celular, CCF, etc.)
- [x] Identifica personas por código de contrato (columna A)
- [x] Inferencia automática de sede por CCF + excepciones por código
- [x] Preview con conteos (nuevos / actualizar / inactivar) antes de aplicar
- [x] 137 colaboradores activos importados

#### ✅ Sub-etapa A.6 — Editor de usuario individual *(completada)*
- [x] Pantalla `/admin/usuarios/[id]` con form completo
- [x] Asignar cargo (con bandas agrupadas) y jefe directo
- [x] Editar correo, celular, sede, rol, gestión, activo
- [x] Vista de datos contractuales (solo lectura desde el Excel)
- [x] Botón de editar en la tabla de usuarios

#### 🔵 Sub-etapa B — Ciclos y plan de evaluación
- [ ] TH crea un ciclo ("Semestre I 2026", "Anual 2026")
- [ ] Instanciación automática de `evaluaciones` por colaborador
- [ ] Pantalla para asignar pares/reportes específicos por evaluado
- [ ] Validación de modalidad según banda
- [ ] Dashboard de cobertura del ciclo (planificadas / respondidas)

#### 🔵 Sub-etapa C — Captura de cuestionarios
- [ ] Lista de pendientes por evaluador
- [ ] Cuestionario en tercera persona (jefe/par/reporte)
- [ ] Cuestionario en primera persona (autoevaluación)
- [ ] Persistencia de respuestas con escala 1-5 (o "no observado")
- [ ] Recordatorios automáticos a evaluadores pendientes

#### 🔵 Sub-etapa D — Cálculo y reporte individual
- [ ] Motor de cálculo con promedios simples y ponderados por fuente
- [ ] Redistribución de pesos cuando una fuente no tiene respuestas
- [ ] Cálculo de brechas vs matriz de niveles esperados
- [ ] Reporte individual con radar chart actual vs esperado
- [ ] TOP 3 de acciones recomendadas con diversidad por competencia
- [ ] Alerta automática si líder con promedio general < 4.0

#### 🔵 Sub-etapa E — PDI y seguimiento
- [ ] Generación del borrador de PDI desde TOP 3
- [ ] Selección manual de hasta 3 acciones del catálogo
- [ ] Firma digital del colaborador, jefe y TH
- [ ] Seguimiento mensual del avance de cada acción
- [ ] Dashboard de cumplimiento de PDIs vigentes

---

## ✅ Etapa 4 — Deploy en Vercel *(completada)*
*Objetivo: la app disponible en una URL pública para todo el equipo.*

- [x] Proyecto en Vercel conectado al repo
- [x] Variables de entorno configuradas
- [ ] Dominio personalizado (`cerebro.asignar.com.co`)
- [ ] Mantener Supabase despierto con tráfico real

---

## 🔵 Etapa 5 — Gestión de usuarios y líderes
*Objetivo: el admin gestiona el equipo directamente desde la plataforma.*

- [x] Importador semanal desde Excel del software HR (Etapa 3b)
- [ ] UI para editar usuario individual (cargo, jefe, sede, correo)
- [ ] Invitar al sistema (crear auth user con password reset)
- [ ] Asignar líder a cada gestión
- [ ] Vista del perfil completo de cada usuario

---

## 🔵 Etapa 6 — Documentos adjuntos en procesos
*Objetivo: adjuntar PDFs, Word y Excel a cada proceso.*

- [ ] Carga de archivos a Supabase Storage
- [ ] Descarga de documentos desde la página del proceso
- [ ] Límite de tamaño y validación de tipos

---

## 🔵 Etapa 7 — Políticas y Reglamentos
*Objetivo: repositorio de documentos normativos siempre accesibles.*

- [ ] Categorías: reglamento interno, políticas, manuales, circulares
- [ ] Descarga directa de PDFs
- [ ] Control de versiones de documentos

---

## 🔵 Etapa 8 — Onboarding / Acogida Laboral
*Objetivo: ruta de inducción estructurada para nuevos colaboradores.*

- [ ] Checklist de onboarding por cargo
- [ ] Progreso guardado por usuario
- [ ] Firma digital de recibido
- [ ] Vista del líder para seguimiento

---

## 🔵 Etapa 9 — Entrenamientos y Capacitaciones
*Objetivo: registrar y hacer seguimiento de toda la formación del equipo.*

- [ ] Registro de capacitaciones por colaborador
- [ ] Certificaciones con fecha de vencimiento
- [ ] Alertas de renovación
- [ ] Reporte por gestión

---

## 🔵 Etapa 10 — Periodos de Prueba
*Objetivo: seguimiento estructurado del período de prueba de cada colaborador.*

- [ ] Checklist de evaluación por etapas
- [ ] Comentarios del líder por período
- [ ] Resultado final con firma
- [ ] Historial por colaborador

---

## 🔵 Etapa 11 — Encuestas
*Objetivo: medir clima laboral, satisfacción y pulso del equipo.*

- [ ] Constructor de encuestas (preguntas abiertas, escala, opción múltiple)
- [ ] Envío a gestiones o colaboradores específicos
- [ ] Dashboard de resultados en tiempo real
- [ ] Histórico de encuestas

---

## 🔵 Etapa 12 — Expediente Digital del Colaborador
*Objetivo: toda la información de cada persona en un solo lugar.*

- [ ] Datos personales y contractuales
- [ ] Documentos de vinculación
- [ ] Historial de evaluaciones y capacitaciones (Etapa 3 + Etapa 9)
- [ ] Novedades y observaciones

---

## Desarrollado con Claude Code

Cada etapa se desarrolla en sesiones específicas de Claude Code para maximizar calidad y minimizar tokens. Al finalizar cada etapa se hace una limpieza de código para mantener el repositorio eficiente.

**Flujo de trabajo:** cada etapa se desarrolla en una rama propia (`etapa-N-nombre`), se sube como Pull Request y se fusiona a `main` cuando está probada.

---

## Variables de entorno

Copia `.env.local.example` → `.env.local` y completa los valores:

```bash
cp .env.local.example .env.local
```

## Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)
