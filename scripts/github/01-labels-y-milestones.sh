#!/usr/bin/env bash
# Crear labels y milestones del proyecto Cerebro Asignar
# Uso: bash scripts/github/01-labels-y-milestones.sh
set -e

echo "==> Creando labels..."
# Tipos de issue
gh label create "epic"                --color "5319e7" --description "Etapa completa del proyecto (con sub-issues)"        --force
gh label create "sub-etapa"           --color "8b5cf6" --description "Parte de una epic"                                   --force
gh label create "bug"                 --color "d73a4a" --description "Algo no funciona como debería"                       --force
gh label create "mejora"              --color "a2eeef" --description "Mejora UX/UI o funcionalidad existente"              --force
gh label create "docs"                --color "0075ca" --description "Documentación del proyecto"                          --force
gh label create "prioridad-alta"      --color "b60205" --description "Atender pronto"                                      --force
gh label create "buena-primera-tarea" --color "7057ff" --description "Buena tarea para empezar (clara y autocontenida)"    --force

# Etiquetas por etapa (colores graduales)
gh label create "etapa-3-desempeno"     --color "0e8a16" --description "Módulo de Evaluación de Competencias (ECO-Asignar)" --force
gh label create "etapa-5-usuarios"      --color "0e8a16" --description "Gestión de usuarios y líderes"                      --force
gh label create "etapa-6-documentos"    --color "0e8a16" --description "Documentos adjuntos en procesos"                    --force
gh label create "etapa-7-politicas"     --color "0e8a16" --description "Políticas y reglamentos"                            --force
gh label create "etapa-8-onboarding"    --color "0e8a16" --description "Onboarding / Acogida Laboral"                       --force
gh label create "etapa-9-entrenamientos" --color "0e8a16" --description "Entrenamientos y capacitaciones"                   --force
gh label create "etapa-10-prueba"       --color "0e8a16" --description "Periodos de prueba"                                 --force
gh label create "etapa-11-encuestas"    --color "0e8a16" --description "Encuestas de clima y satisfacción"                  --force
gh label create "etapa-12-expediente"   --color "0e8a16" --description "Expediente digital del colaborador"                 --force

echo "==> Creando milestones..."
HOY=$(date +%Y-%m-%d)
gh api repos/:owner/:repo/milestones -f title="Etapa 3 — Desempeño · ECO-Asignar"      -f description="Evaluación de competencias 360°/270° con PDI. Reemplaza al proveedor externo." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 5 — Gestión de usuarios y líderes" -f description="UI para editar usuarios, invitar al sistema y asignar líderes a gestiones." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 6 — Documentos adjuntos"           -f description="PDFs, Word y Excel adjuntos a cada proceso vía Supabase Storage." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 7 — Políticas y Reglamentos"       -f description="Repositorio de documentos normativos siempre accesibles." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 8 — Onboarding"                    -f description="Ruta de inducción estructurada para nuevos colaboradores." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 9 — Entrenamientos"                -f description="Registro y seguimiento de capacitaciones del equipo." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 10 — Periodos de Prueba"           -f description="Seguimiento del periodo de prueba con checklists y firmas." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 11 — Encuestas"                    -f description="Encuestas de clima, satisfacción y pulso del equipo." || true
gh api repos/:owner/:repo/milestones -f title="Etapa 12 — Expediente Digital"           -f description="Toda la información de cada colaborador en un solo lugar." || true

echo "==> Listo. Labels y milestones creados."
