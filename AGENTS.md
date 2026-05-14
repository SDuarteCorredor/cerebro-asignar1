<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Cerebro Asignar — Contexto del proyecto (leer siempre primero)

## ¿Qué es este proyecto?
Aplicación web interna de **Asignar SAS** (empresa de servicios de personal temporal) para documentar y consultar los procesos y procedimientos de cada área. Funciona como repositorio oficial de conocimiento para todos los colaboradores.

## Stack técnico
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Auth + DB**: Supabase (PostgreSQL + RLS + Storage)
- **Estilos**: CSS Variables custom (`app/globals.css`) + clases utilitarias propias. NO Tailwind en JSX
- **Deploy**: Vercel

## Reglas críticas

### Next.js 15
- Middleware → `proxy.ts` en raíz, función exportada `proxy` (NO `middleware`)
- `params` en page/layout es `Promise` → `const { id } = await params`
- Alias `@/` para imports

### Supabase — joins siempre retornan arrays
```typescript
const raw = data.relacion as unknown as Tipo[] | Tipo | null
const valor = Array.isArray(raw) ? (raw[0] ?? null) : raw
```

### CSS
- `@import url(Google Fonts)` ANTES de `@import "tailwindcss"` en globals.css
- Variables: `--text`, `--text-2`, `--text-3`, `--surface`, `--primary`, `--border`, `--divider`
- Clases: `.card`, `.btn`, `.btn--primary`, `.btn--sm`, `.badge`, `.page`, `.hstack`, `.vstack`, `.avatar`, `.fade-up`

### Iconos
Siempre `<Icono nombre="..." />` de `components/app/Icono.tsx`. NUNCA importar lucide-react.

## Estructura de rutas

```
app/(app)/
  dashboard/        # Inicio post-login
  gestiones/        # Lista + [id] detalle
  procesos/         # [id] ver + [id]/editar + nuevo
  buscar/           # Búsqueda global
  admin/            # gestiones | usuarios | aprobaciones
app/login/          # Pública
```

## Base de datos

### Tablas y columnas clave

**usuarios**: `id` | `nombre` | `correo` | `rol` (colaborador/lider/admin) | `gestion_id` | `activo`

**gestiones** (9): Comercial, Selección, Servicio y Programación, Vinculación, Compensación, Seguridad Social, SST, Jurídica, Tecnología

**procesos**: `id` | `nombre` | `gestion_id` | `objetivo` | `version` | `estado` (activo/borrador/desactualizado/en_revision) | `macroproceso`

**pasos**: `id` | `proceso_id` | `numero_orden` | `nombre` | `descripcion` | `cargo_responsable` | `entradas` | `periodicidad` | `salidas` | `acuerdo_servicio` | `tiempos`

**documentos**: `id` | `proceso_id` | `nombre` | `tipo_archivo` | `url_descarga` | `tamano_bytes`

**historial_versiones**: `id` | `proceso_id` | `version_anterior` | `version_nueva` | `usuario_id` | `resumen_cambio`

### Datos importados (150 actividades en 7 gestiones)
Comercial(18), Selección(23), Vinculación(20), Servicio y Programación(21), Compensación(22), Seguridad Social(24), SST(22)

## Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=https://wakzmlxivteacizzzgdx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ver .env.local>
```

## Admin principal
- Correo: liderth@asignar.com.co | Nombre: Simon Puerta | Rol: admin

## Comandos
```bash
npm run dev       # puerto 3000
npm run build     # verificar compilación
npx tsc --noEmit  # solo TypeScript
```
