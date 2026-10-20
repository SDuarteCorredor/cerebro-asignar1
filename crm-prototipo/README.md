# CRM Asignar — prototipo navegable

Prototipo **sin dependencias** (HTML + CSS con variables + JavaScript plano, sin Tailwind ni build).
Abre `index.html` en el navegador. Los datos son de demostración y se guardan en `localStorage`
(botón *Restablecer datos* en el panel izquierdo).

Está en una carpeta autocontenida para moverla tal cual a un repo nuevo (`git subtree split` o copiar la carpeta).

## Origen
Reunión "Check list y CRM" (13-oct-2026) + correo de Paula García "Check list para reunión"
(adjunto `Formato Registro Clientes_Check list.xlsx`, **pendiente de contrastar**: no pude descargarlo).

## Qué incluye
| Vista | Qué resuelve de la reunión |
|---|---|
| **Pipeline** (Kanban, arrastrar) | Seguimiento de ventas; no deja pasar a *Activo* sin checklist + 3 aprobaciones |
| **Nuevo cliente** (4 pasos) | Alta única: general, seguridad social, nómina/facturación con **varios centros por NIT**, tarifas y contratación. Valida código de 3 letras. Lista lo que Laura **ya no** llena |
| **Ficha 360°** | Resumen + aprobaciones, Tarifas, Turnos (migran del Drive de Compensación), Contratos antiguos |
| **Checklist de ingreso** | 6 gestiones con color, dependencias entre actividades, SLA en días hábiles, alerta a los 2–3 días, SST como "posterior a la aprobación" |
| **Simulador de rol** | "Ver como" cada gestión: solo edita lo suyo; modo estricto = cada área solo ve lo suyo |

## Decisiones pendientes (validar con Silvia y Jorge)
1. ¿El SLA cuenta desde la firma del contrato, la reunión operativa o la creación del código? (selector en el simulador)
2. ¿Quién crea centros de costos y cargos nuevos? (Alexandra, Natalia, Javier — no está claro)
3. ¿Quién llena Selección y Vinculación: líder de gestión o coordinador por ciudad?
4. Matriz de permisos por pestaña (`TAB_PERM` en `js/app.js`) es una propuesta.
5. Dependencias y SLA de `js/data.js` (`PLANTILLA`) son una interpretación de las notas; ajustar con el Excel.

## Portabilidad
- `css/tokens.css`: tokens copiados de Cerebro; cambiar valores para adoptar los del ERP.
- `js/data.js`: áreas, plantilla del checklist y aprobaciones (configuración, no lógica).
- `js/app.js`: reglas (`estadoItem`, `motivosBloqueo`) separadas de las vistas.
