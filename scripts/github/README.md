# Setup inicial del proyecto en GitHub

Scripts para crear los **labels, milestones e issues iniciales** del repositorio. Se corren **una sola vez** después de crear el proyecto.

## Pre-requisitos

1. **GitHub CLI (`gh`) instalado** — [descarga aquí](https://cli.github.com/)
2. **Autenticado:** `gh auth login` (elige GitHub.com, HTTPS, navegador)
3. **Estar dentro del repo:** `cd cerebro-asignar`

## Cómo correrlo

```bash
bash scripts/github/01-labels-y-milestones.sh
bash scripts/github/02-issues.sh
```

Tarda ~30 segundos en total. Si algo falla a mitad, el script es idempotente (puedes volver a correrlo).

## Qué crea

- **17 labels** — tipos de issue + etiqueta por etapa
- **9 milestones** — uno por etapa pendiente
- **17 issues** — 9 epics (Etapas 3, 5–12) + 4 sub-issues (Etapa 3) + 4 bugs/mejoras

## Después de correrlo

1. Ve a la pestaña **Projects** del repo
2. Crea un nuevo Project (Board view)
3. Agrega columnas: `📥 Backlog` · `🎯 To Do` · `🔄 In Progress` · `👀 Review` · `✅ Done`
4. Mueve los issues a las columnas correspondientes
5. Asigna issues a quien va a trabajar en ellos (tú o Santiago)
