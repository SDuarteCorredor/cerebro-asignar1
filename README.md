# Cerebro Asignar

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
| Deploy | Vercel |

---

## Correr localmente

```bash
cp .env.local.example .env.local   # completar valores
npm install
npm run dev                        # http://localhost:3000
```

## Variables de entorno

Copia `.env.local.example` → `.env.local` y completa los valores.

## Roadmap

El plan completo del proyecto con etapas, tareas y asignaciones está en [`ROADMAP.md`](./ROADMAP.md).

---

Desarrollado con Claude Code.
