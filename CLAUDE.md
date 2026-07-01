@AGENTS.md
@ROADMAP.md

## Protocolo de colaboración

Este proyecto tiene múltiples sesiones de Claude Code trabajando en paralelo (una por cada colaborador). Para evitar colisiones:

1. **Antes de empezar**: lee `ROADMAP.md` y verifica que la tarea no esté asignada a otro.
2. **Al tomar una tarea**: marca `[~]` y pon tu identificador en `Asignado:`. Haz commit del ROADMAP junto con tu código.
3. **Al terminar**: marca `[x]`. Haz commit final.
4. **Antes de pushear**: haz `git pull origin main` para traer cambios del otro Claude.
5. **Nunca modifiques** tareas asignadas a otro sin coordinación explícita del usuario.
