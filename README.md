# 🧠 Cerebro Asignar

> Plataforma interna de Talento Humano para **Asignar SAS**

La herramienta total de TH: repositorio de procesos, gestión de personas, evaluaciones, encuestas, onboarding y más — construida exactamente para Asignar, sin costos de licencias.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend + API | Next.js 15 · TypeScript |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Archivos | Supabase Storage |
| Deploy | Vercel *(pendiente)* |

---

## Módulos — Hoja de ruta

### ✅ Etapa 1 — Repositorio de Procesos *(completada)*
Base de la plataforma: autenticación, roles y el núcleo del repositorio de conocimiento.

- [x] Login con roles (colaborador / líder / admin)
- [x] Dashboard principal
- [x] 9 gestiones con colores e íconos propios
- [x] Procesos con pasos expandibles (nombre, procedimiento, entradas, salidas, periodicidad, tiempos)
- [x] 150 actividades importadas — 7 gestiones misionales
- [x] Búsqueda global de procesos
- [x] Panel admin: gestiones, usuarios, aprobaciones
- [x] Schema completo con historial de versiones y RLS por rol

---

### 🔵 Etapa 2 — Editor completo de procesos
*Objetivo: los líderes pueden documentar procesos nuevos con todos los campos.*

- [ ] Campo `nombre` de actividad en el formulario de pasos
- [ ] Campos `entradas`, `salidas`, `periodicidad`, `tiempos` en el editor
- [ ] Limpieza de código: extraer estilos inline a clases CSS

---

### 🔵 Etapa 3 — Documentos adjuntos
*Objetivo: adjuntar PDFs, Word y Excel a cada proceso.*

- [ ] Carga de archivos a Supabase Storage
- [ ] Descarga de documentos desde la página del proceso
- [ ] Límite de tamaño y validación de tipos

---

### 🔵 Etapa 4 — Gestión de usuarios y líderes
*Objetivo: el admin gestiona el equipo directamente desde la plataforma.*

- [ ] Asignar líder a cada gestión
- [ ] Crear / desactivar colaboradores
- [ ] Invitar por email
- [ ] Vista del perfil de cada usuario

---

### 🔵 Etapa 5 — Deploy en Vercel
*Objetivo: la app disponible en una URL de Asignar SAS.*

- [ ] Proyecto en Vercel conectado al repo
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado (`cerebro.asignar.com.co`)

---

### 🔵 Etapa 6 — Políticas y Reglamentos
*Objetivo: repositorio de documentos normativos siempre accesibles.*

- [ ] Categorías: reglamento interno, políticas, manuales, circulares
- [ ] Descarga directa de PDFs
- [ ] Control de versiones de documentos

---

### 🔵 Etapa 7 — Onboarding / Acogida Laboral
*Objetivo: ruta de inducción estructurada para nuevos colaboradores.*

- [ ] Checklist de onboarding por cargo
- [ ] Progreso guardado por usuario
- [ ] Firma digital de recibido
- [ ] Vista del líder para seguimiento

---

### 🔵 Etapa 8 — Entrenamientos y Capacitaciones
*Objetivo: registrar y hacer seguimiento de toda la formación del equipo.*

- [ ] Registro de capacitaciones por colaborador
- [ ] Certificaciones con fecha de vencimiento
- [ ] Alertas de renovación
- [ ] Reporte por gestión

---

### 🔵 Etapa 9 — Periodos de Prueba
*Objetivo: seguimiento estructurado del período de prueba de cada colaborador.*

- [ ] Checklist de evaluación por etapas
- [ ] Comentarios del líder por período
- [ ] Resultado final con firma
- [ ] Historial por colaborador

---

### 🔵 Etapa 10 — Encuestas
*Objetivo: medir clima laboral, satisfacción y pulso del equipo.*

- [ ] Constructor de encuestas (preguntas abiertas, escala, opción múltiple)
- [ ] Envío a gestiones o colaboradores específicos
- [ ] Dashboard de resultados en tiempo real
- [ ] Histórico de encuestas

---

### 🔵 Etapa 11 — Evaluaciones de Desempeño
*Objetivo: evaluaciones 360° con histórico y seguimiento.*

- [ ] Plantillas de evaluación por cargo
- [ ] Evaluación del líder al colaborador
- [ ] Autoevaluación
- [ ] Resultados con histórico y tendencias
- [ ] Planes de mejora

---

### 🔵 Etapa 12 — Expediente Digital del Colaborador
*Objetivo: toda la información de cada persona en un solo lugar.*

- [ ] Datos personales y contractuales
- [ ] Documentos de vinculación
- [ ] Historial de evaluaciones y capacitaciones
- [ ] Novedades y observaciones

---

## Desarrollado con Claude Code

Cada etapa se desarrolla en sesiones específicas de Claude Code para maximizar calidad y minimizar tokens. Al finalizar cada etapa se hace una limpieza de código para mantener el repositorio eficiente.

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
