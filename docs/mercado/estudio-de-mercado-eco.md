# Estudio de Mercado — ECO-Asignar (evaluación de competencias) y plataforma Cerebro Asignar

**Versión:** 1.0 · **Fecha:** 2026-07-01
**Metodología:** replica la usada en los docs de mercado de Lumi (`lumi-mvp/docs/mercado/analisis-de-mercado.md` y `competitive-analysis.md`)
**Convención:** **[DURO]** = dato publicado por la fuente · **[EST.]** = estimación (cálculo propio o de firma de research, siempre marcado)
**Pregunta que responde:** ¿existe un mercado real para comercializar ECO-Asignar (evaluación de competencias) — y eventualmente la plataforma Cerebro Asignar completa — más allá del uso interno de Asignar?

---

## Resumen ejecutivo

- **El dolor existe y está cuantificado a nivel global:** el software de gestión de talento vale **USD 9,960M (2023)** y llegará a **USD 22,670M en 2030** (CAGR 12.5%). El subsegmento específico de evaluación/gestión de desempeño vale **USD 6,500M (2024)** con CAGR 10.7%. En LATAM, el HR tech vale **USD 1,174M (2024)** y el segmento #1 por participación es precisamente **talent management**.
- **El mercado alcanzable en Colombia es concreto:** ~**36,500 empresas medianas y grandes** [EST. sobre datos duros de Confecámaras] que son el perfil que hoy paga evaluaciones de competencias a consultoras externas o suites regionales. Dentro de ese universo hay un sub-nicho donde Asignar tiene ventaja injusta: las **616 EST** del país y las empresas usuarias de personal temporal.
- **El pivote de ECO ya validó el dolor internamente:** el módulo nació para **reemplazar al proveedor externo de evaluación de competencias de Asignar**. Si a Asignar le dolía el costo y la rigidez del proveedor, ese mismo dolor lo tienen miles de empresas medianas que hoy solo tienen dos opciones: consultora cara y puntual, o suite regional que obliga a comprar el paquete completo.
- **El hueco competitivo es de empaque y precio, no de categoría:** Crehana/Acsendo, Rankmi y Buk ya venden evaluación de desempeño en Colombia — pero como módulo dentro de suites grandes, con venta enterprise y precios no publicados. Nadie vende **evaluación de competencias lista-para-usar con modelo colombiano por bandas de cargo + PDI accionable**, a precio de empresa mediana y con implementación en días.
- **Conclusión honesta:** hay negocio para ECO como producto especializado en el nicho (EST + medianas empresas del ecosistema de Asignar), con un techo realista de **USD 40K–150K ARR a 24 meses** [EST.]. Competir con la plataforma completa contra Buk/Rankmi/Crehana en abierto es otra liga (ellos tienen USD 48–85M levantados); la plataforma completa tiene más sentido como diferenciador del portafolio de servicios de Asignar que como SaaS independiente en su primera fase.

---

## 0. El producto que se evaluaría comercializar

### 0.1 ECO-Asignar (el candidato principal — "el dolor de mercado real")

Módulo de evaluación de competencias organizacionales dentro de Cerebro Asignar. Estado a jul-2026: sub-etapas A–C completadas, D (motor de cálculo y reporte) en desarrollo, E (PDI y seguimiento) pendiente.

Lo que ya hace o hará al cierre de la Etapa 3:

| Capacidad | Estado |
|---|---|
| Modelo de 8 competencias (5 corporativas + 3 gerenciales) × 5 bandas de cargo (B1 Operativo – B5 Gerente) | ✅ |
| Cuestionario de 48 ítems + catálogo de 39 acciones de desarrollo | ✅ |
| Ciclos de evaluación con instanciación automática por colaborador | ✅ |
| 360° para cargos con personal a cargo, 270° para el resto (validación automática por banda) | ✅ |
| Captura de cuestionarios (auto, jefe, par, reporte) con confidencialidad vía RLS | ✅ |
| Motor de cálculo, brechas vs nivel esperado del cargo y radar chart | 🔧 en curso (Simon) |
| TOP 3 de acciones recomendadas + PDI con firma y seguimiento | 🔜 sub-etapa E |
| Importador de colaboradores desde el Excel del software HR (137 activos cargados) | ✅ |

**El insight de origen:** ECO existe porque el proveedor externo de evaluación de competencias resultaba reemplazable con software propio. Ese es exactamente el pitch de venta a terceros.

### 0.2 Plataforma Cerebro Asignar completa (el candidato secundario — "verificar el software completo")

Repositorio de procesos y procedimientos (150 actividades documentadas en 7 gestiones misionales), gestión de usuarios/roles, y un roadmap que apunta a suite integral de talento humano: documentos, onboarding, capacitaciones, periodos de prueba, encuestas y expediente digital (Etapas 5–12 del ROADMAP).

---

## 1. Tamaño de mercado: TAM / SAM / SOM

### 1.1 TAM — Software de gestión de talento y desempeño

| Mercado | Tamaño | Proyección | CAGR | Tipo | Fuente |
|---|---|---|---|---|---|
| Talent management software (global) | USD 9,960M (2023) | USD 22,670M (2030) | 12.5% | [DURO/EST.] | [Grand View Research](https://www.grandviewresearch.com/industry-analysis/talent-management-software-market) |
| Performance appraisal & management software (global) | USD 6,500M (2024) | USD 17,100M (2033) | 10.7% | [DURO/EST.] | [IMARC](https://www.imarcgroup.com/performance-appraisal-management-software-market) |
| Continuous performance management (global) | USD 2,350M (2024) | USD 7,960M (2033) | 12.5% | [DURO/EST.] | [Straits Research](https://straitsresearch.com/report/continuous-performance-management-software-market) |
| **HR tech LATAM** | **USD 1,174.5M (2024)** | **USD 2,188.2M (2033)** | 6.8% | [DURO/EST.] | [IMARC LATAM](https://www.imarcgroup.com/latin-america-human-resource-technology-market) |

Dato clave: dentro del HR tech LATAM, **talent management es el segmento con mayor participación de mercado** [DURO — IMARC]. La categoría de ECO no es un nicho exótico: es el segmento más grande del HR tech regional.

**TAM relevante: USD ~1,174M (HR tech LATAM 2024), del cual el segmento de talento/desempeño es la porción mayor.**

### 1.2 SAM — Mercado alcanzable: Colombia

No hay cifra pública del mercado colombiano de software de evaluación de desempeño. Lo estimamos por capas:

**En dinero [EST. propia]:** si Colombia pesa 7–9% del HR tech LATAM (proporcional a población y PIB, misma proporción usada en el análisis de Lumi), el mercado colombiano de HR tech es del orden de **USD 82–106M (2024)**; el segmento de talento/desempeño dentro de él, quizás **USD 20–35M**.

**En empresas [DURO + EST.]:**

| Capa | Valor | Tipo | Fuente |
|---|---|---|---|
| Empresas totales en Colombia (2024) | 1,739,405 | [DURO] | [Confecámaras](https://confecamaras.org.co/en-2024-se-crearon-en-el-pais-297-475-empresas-senala-informe-de-confecamaras/) |
| Medianas (1.6%) | ~27,800 | [EST. sobre % DURO] | Confecámaras |
| Grandes (0.5%) | ~8,700 | [EST. sobre % DURO] | Confecámaras |
| **Universo con capacidad y necesidad de evaluar competencias formalmente** | **~36,500 medianas + grandes** | [EST.] | cálculo propio |
| Sub-universo con dolor agudo hoy (las que ya pagan a un tercero por evaluaciones o lo hacen en Excel) | ~10–15K | [EST.] | supuesto a validar en discovery |

**Sub-nicho estratégico — el ecosistema EST [DURO]:**

| Dato | Valor | Fuente |
|---|---|---|
| EST legalmente aprobadas en Colombia | 616 (+243 sucursales) | [El Tiempo / ACOSET](https://www.eltiempo.com/economia/sectores/cae-el-numero-de-trabajadores-a-traves-de-empresas-de-servicios-temporales-en-colombia-3454490) |
| Trabajadores en misión (S1 2025) | 474,188 | [La Nota Económica](https://lanotaeconomica.com.co/movidas-empresarial/474-mil-empleos-formales-se-mantienen-gracias-a-las-empresas-de-servicios-temporales/) |
| Trabajadores en misión (2024) | 487,900 | La Nota Económica |
| Caída de trabajadores en misión Q1 2025 | −12.6% | El Tiempo |

Cada EST tiene el mismo problema estructural de Asignar: planta interna que evaluar + presión por diferenciar su portafolio ante empresas clientes. Y la contracción del sector (−12.6%) empuja a las EST a competir por **valor agregado**, no por precio — exactamente lo que un módulo de evaluación de competencias marca-blanca les daría.

### 1.3 SOM — Capturable a 24 meses [EST. propia]

Supuestos: venta consultiva liderada por la red de Asignar (20+ años de relaciones), precio por colaborador activo/mes (ver §6), sin equipo comercial dedicado el primer año.

| Escenario | Clientes | Empleados promedio | Precio COP/emp/mes | ARR |
|---|---|---|---|---|
| Conservador | 5 (2 EST + 3 medianas del ecosistema) | 100 | $4,000 | **~USD 6K** |
| Base | 15 | 150 | $4,000 | **~USD 26K** |
| Optimista | 30 + 1 contrato ancla de EST grande (1,000+ empleados con misión) | 200 | $4,000–6,000 | **~USD 75–150K** |

> ⚠️ Nota honesta: estos números son más chicos que los SOM de Lumi porque el producto se vende **por ciclo de evaluación** (1–2 veces/año de uso intenso) y el pricing anual por empleado en esta categoría es menor que el de un producto de uso diario. El SOM no financia una empresa independiente en 24 meses — financia una **línea de negocio de Asignar** con costo marginal cercano a cero (el software ya existe y se paga con el uso interno). Ese es el encuadre correcto.

---

## 2. Competidores

### 2.1 Tier 1 — Suites regionales de talento (competencia directa en la venta)

| Jugador | Origen | Qué vende | Evaluación de competencias | Precio publicado | Funding / respaldo | Presencia CO |
|---|---|---|---|---|---|---|
| **Crehana (ex-Acsendo)** | 🇵🇪/🇨🇴 | Suite: aprendizaje + desempeño + clima + OKRs | ✅ 360° con IA | ❌ no publicado (venta consultiva) | Compró a la colombiana Acsendo | ✅ fuerte |
| **Rankmi** | 🇨🇱 | Suite: desempeño + clima + nómina (Osmos) | ✅ | ❌ no publicado | USD 48M Serie A (SoftBank) | 🔜 expansión anunciada |
| **Buk** | 🇨🇱 | Suite integral con núcleo en **nómina** | ✅ módulo | ❌ no publicado | USD 85M+ · valorada USD 417M (2021) | ✅ desde 2020 |
| **Factorial** | 🇪🇸 | Suite pyme (núcleo administrativo) | ✅ módulo básico | desde €5.5/emp/mes (España) | Unicornio | ✅ |
| **Bizneo / Sesame HR** | 🇪🇸 | Suite pyme | ✅ módulo | parcial | — | parcial |

Fuentes: [El Espectador — Crehana compra Acsendo](https://www.elespectador.com/economia/emprendimiento-y-liderazgo/crehana-anuncio-la-compra-de-acsendo-la-startup-colombiana-de-talento-humano/) · [Bloomberg Línea — Rankmi/SoftBank](https://www.bloomberglinea.com/2023/03/01/softbank-latin-america-fund-lidera-ronda-para-startup-chilena-de-recursos-humanos/) · [La Tercera — Buk](https://www.latercera.com/pulso/noticia/startups-chilenas-de-recursos-humanos-van-a-la-conquista-de-america-latina/K2UUWGWI5NBKNBRUIVDBEYQWEI/) · [Factorial — precios](https://factorial.es/plan-de-precios)

### 2.2 Tier 2 — Especialistas en evaluación (competencia de producto)

| Jugador | Qué es | Límite explotable |
|---|---|---|
| **Evaluar.com** | Colombiana, assessments y desempeño 360 | Foco en pruebas de selección; el 360 es genérico, sin modelo por bandas pre-cargado ni PDI integrado |
| **Worki 360** | Software de evaluación 360 en español | Herramienta de encuesta; el cliente debe traer su propio modelo de competencias |
| **Qualtrics / SurveyMonkey** | Encuestas genéricas usadas como 360 improvisado | Sin cálculo de brechas, sin catálogo de acciones, sin nada de HR |
| **Consultoras de TH locales** | El statu quo: proceso manual por ciclo, entregable en PDF/Excel | Caro, puntual (sin continuidad entre ciclos), sin software que quede instalado. **Es el proveedor que ECO ya reemplazó en Asignar** |

### 2.3 Tier 3 — Enterprise global (no compiten por el mismo cliente)

SAP SuccessFactors, Workday, Cornerstone: venta a grandes corporativos con implementaciones de 6–18 meses y tickets que una empresa mediana colombiana no paga. Definen el techo de sofisticación, no el mercado de ECO.

### 2.4 Debilidades explotables (el cruce vacío)

| Competidor | Debilidad | Cómo la explota ECO |
|---|---|---|
| Crehana / Rankmi / Buk | Venden suite completa con venta enterprise: demos, licitación, onboarding de meses, precio opaco | Módulo enfocado: un dolor, un precio claro, implementación en días con el modelo 8×5 pre-cargado |
| Suites en general | El cliente debe **construir** su modelo de competencias desde cero dentro de la herramienta | ECO trae el modelo listo (8 competencias × 5 bandas × 48 ítems × 39 acciones), calibrado en una empresa colombiana real de 2,300 empleados |
| Consultoras | Cobran por ciclo, el conocimiento se va con ellas, sin trazabilidad año a año | SaaS que queda instalado: historial, comparación entre ciclos, PDI con seguimiento |
| Todos | Nadie tiene distribución en el ecosistema EST | Asignar es EST hace 20+ años: credibilidad sectorial + relaciones + caso propio |

**El insight estructural (espejo del de Lumi):** ningún jugador combina los 3 elementos — **modelo de competencias colombiano listo-para-usar + precio y ciclo de venta de empresa mediana + distribución vía el ecosistema EST**. Las suites tienen el software sin el modelo ni el canal; las consultoras tienen el modelo sin el software; nadie tiene el canal.

---

## 3. Tendencias

| Tendencia | Dato | Lectura para ECO |
|---|---|---|
| HR tech LATAM crece sostenido | USD 1,174M → 2,188M (2033), CAGR 6.8% [DURO/EST. — IMARC] | Categoría en expansión, no hay que evangelizar que "el software de RRHH existe" |
| Talent management es el segmento #1 del HR tech LATAM | [DURO — IMARC] | ECO entra por el segmento más grande, no por uno marginal |
| Adopción empujada por cumplimiento y digitalización | Empresas adoptan HR digital por reporting y regulación laboral [DURO — IMARC] | La venta con ángulo de "evidencia para SG-SST/auditorías/ISO 9001" resuena — sin inventar obligaciones legales que no existen (ver riesgo §8) |
| Contracción del sector EST | −12.6% trabajadores en misión Q1 2025 [DURO] | Doble filo: presiona presupuestos, pero obliga a las EST a diferenciarse por valor agregado — el argumento de canal |
| Capital concentrado en pocas suites grandes | Rankmi USD 48M, Buk USD 85M+ | No competir de frente por el mercado abierto; jugar el nicho donde el capital de ellos no llega: relación + modelo pre-cargado + precio |

---

## 4. La oportunidad

### 4.1 El nicho específico

> **Evaluación de competencias lista-para-usar para empresas medianas colombianas (50–500 empleados de planta) y EST, con modelo por bandas de cargo pre-cargado, 360°/270° automático, brechas vs cargo y PDI accionable — al costo de una fracción de un ciclo con consultora, y vendida a través de la red de Asignar.**

Cuatro capas de especificidad (misma lógica del nicho de Lumi):
1. **De producto:** no es una encuesta ni una suite — es el proceso completo de evaluación de competencias con el modelo ya construido.
2. **De precio y ciclo de venta:** decisión de un líder de TH, no un comité de compras enterprise.
3. **De canal:** la red de 20+ años de Asignar (empresas clientes + gremio EST) — el activo que ninguna suite chilena tiene.
4. **De prueba social:** "así evaluamos a nuestros propios 137 colaboradores de planta" — caso real, no demo.

### 4.2 La ventaja injusta de Asignar

| Activo | Por qué es difícil de copiar |
|---|---|
| Modelo 8×5 con 48 ítems y 39 acciones ya calibrado | Es el trabajo de diseño organizacional que las suites le dejan al cliente; aquí ya está hecho y probado en piloto |
| Caso de uso propio y permanente | El software se mantiene y mejora porque Asignar lo usa — costo marginal de venderlo ≈ 0 |
| Distribución sectorial | Relaciones comerciales de 20+ años con empresas usuarias + membresía del gremio EST |
| Datos operativos de EST | El importador desde el software HR y la lógica de bandas nacieron de la operación real de una EST — fricción de implementación mínima para pares del sector |

### 4.3 Los dos caminos (respuesta a "verificar el software completo también sería interesante")

**Camino A — ECO standalone (recomendado como primera jugada).**
Dolor agudo, comprador identificable (líder de TH), diferenciación clara, y el pitch se apoya en el caso propio. Vendible desde que cierre la sub-etapa E (PDI), porque el reporte individual + PDI **es** el entregable que hoy venden las consultoras.

**Camino B — Plataforma Cerebro completa (repositorio de procesos + desempeño + onboarding + …).**
Honestamente: como SaaS abierto compite de frente con Buk/Rankmi/Crehana/Factorial, que tienen decenas de millones de dólares y equipos comerciales regionales. Ahí no hay ventaja injusta hoy. **Pero** tiene dos usos con sentido:
1. **Marca blanca / valor agregado del portafolio de Asignar:** "contrata personal con nosotros y te llevas la plataforma de procesos + evaluación" — diferenciador comercial de la EST, no producto independiente.
2. **Upsell natural post-ECO:** el cliente que entró por evaluaciones descubre los módulos de onboarding, periodos de prueba y expediente (Etapas 8, 10, 12 del ROADMAP) — que además son los módulos con más sinergia con el negocio de una EST.

**Secuencia recomendada: A primero, B como expansión de cuenta — nunca B como cuña de entrada.**

---

## 5. Validación pendiente con el dato ancla

La búsqueda no arrojó precios públicos de consultoras de evaluación de competencias en Colombia ni de los módulos de desempeño de Crehana/Rankmi/Buk (todos venden con cotización cerrada). **Pero Asignar tiene el dato ancla que ningún estudio externo tiene: lo que le pagaba a su propio proveedor externo antes del pivote a ECO.**

Preguntas para responder internamente (Simon las tiene o las puede conseguir):
1. ¿Cuánto costaba el ciclo completo con el proveedor externo? (total y por colaborador evaluado)
2. ¿Qué incluía y qué no? (¿solo el informe? ¿PDI? ¿seguimiento?)
3. ¿Cada cuánto se hacía y por qué se decidió reemplazarlo?
4. ¿Qué proveedores similares usan las empresas clientes de Asignar y a qué precio? (3–5 llamadas de discovery a clientes de confianza)

Con esas 4 respuestas, el pricing de §6 pasa de [EST.] a fundamentado.

---

## 6. Hipótesis de modelo de negocio y pricing [EST. — validar con §5]

| Modelo | Estructura | Cuándo usarlo |
|---|---|---|
| **SaaS anual por colaborador activo** | $3,000–6,000 COP/emp/mes facturado anual (~USD 9–17/emp/año) | Cliente que quiere ciclos recurrentes + PDI con seguimiento (el valor completo) |
| **Por ciclo de evaluación** | $25,000–60,000 COP por colaborador evaluado por ciclo | Puerta de entrada para el que hoy compra "un ciclo" a consultora; ancla contra el precio de la consultora |
| **Marca blanca EST** | Fee de plataforma + tarifa por volumen | EST pares que quieren ofrecerlo a sus clientes (el juego de canal) |
| **Bundle Asignar** | Incluido/descontado con contratos de personal temporal | Defensa y diferenciación del negocio core de Asignar |

Referencias de anclaje: Factorial (suite básica) publica desde €5.5/emp/mes en España [DURO]; las consultoras cobran por ciclo cifras que multiplican por 5–20× el equivalente SaaS anual [EST. — validar]. El precio de ECO debe leerse como "menos que un solo ciclo de tu consultora, y te queda el software todo el año".

---

## 7. DOFA de la jugada comercial

**Fortalezas:** modelo de competencias real y calibrado; caso propio verificable; canal sectorial de 20+ años; costo marginal ≈ 0; stack moderno (Next.js + Supabase) con RLS y confidencialidad ya resueltas.

**Oportunidades:** segmento talent management = #1 del HR tech LATAM; 36,500 medianas+grandes en Colombia; 616 EST con el mismo dolor y presión por diferenciarse; consultoras sin software y suites sin modelo pre-cargado; posible expansión posterior a los módulos de la plataforma (upsell).

**Debilidades:** producto aún sin terminar (sub-etapas D y E); un solo caso de uso (el propio); sin equipo comercial ni de soporte multi-tenant; **el software hoy es single-tenant** — venderlo a terceros exige trabajo técnico real (multi-tenancy o instancias separadas, branding, onboarding de datos de cada cliente); sin marca en el mercado de software.

**Amenazas:** Rankmi entrando a Colombia con capital de SoftBank; Crehana bajando su módulo de desempeño a precio pyme; que una consultora grande saque su propia herramienta; conflicto de canal (las empresas clientes de Asignar pueden ver raro que su EST les venda software); dependencia de Simon/TH como único vendedor experto del dominio.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| **Multi-tenancy:** vender antes de poder servir a un segundo cliente | Definir la arquitectura (¿instancia por cliente vs multi-tenant real?) ANTES de la primera venta; el piloto externo #1 puede correr en instancia separada |
| **No inventar obligaciones legales:** a diferencia del pitch de Lumi (Ley 2460), la evaluación de competencias NO es obligatoria por ley en el sector privado colombiano | Vender por ROI y por evidencia para auditorías/ISO/SG-SST como *soporte*, nunca como "cumplimiento obligatorio". (Misma lección anotada en `lumi-mvp/docs/alianzas/pitch-simon.md` §notas de cuidado: verificar toda base legal con abogado antes de afirmarla) |
| Propiedad intelectual del modelo 8×5 | Verificar que el modelo (importado del piloto en Excel) sea 100% propio y no derive de material con derechos del proveedor externo reemplazado — **consultar antes de comercializar** |
| Datos personales de terceros (Ley 1581) | Al servir a otras empresas, Asignar pasa a ser Encargado de datos de empleados ajenos: se necesita DPA tipo el de Lumi (`lumi-mvp/docs/legal/dpa-b2b.md` sirve de plantilla) |
| Canibalizar el foco del equipo (el software interno es la prioridad) | No vender nada hasta cerrar sub-etapa E; primer piloto externo gratis y con alcance cerrado, calcado del playbook del piloto Lumi×Asignar (`lumi-mvp/docs/alianzas/alianza-asignar.md` §5: métricas de éxito definidas antes de empezar) |

---

## 9. Datos que faltan (y cómo conseguirlos)

| Dato faltante | Por qué importa | Cómo obtenerlo |
|---|---|---|
| Costo real del proveedor externo que ECO reemplazó | Es EL ancla de pricing y el titular del pitch ("nos ahorramos X%") | Preguntarle a Simon / contabilidad — costo cero |
| Precios de Crehana/Rankmi/Buk en Colombia | Posicionar el precio de ECO | Pedir cotizaciones como empresa interesada (mystery shopping) — costo cero |
| Cuántas empresas clientes de Asignar hacen evaluación formal hoy y con quién | Dimensionar el pipeline real del canal | 5 llamadas de discovery de Simon a clientes de confianza |
| Mercado de software de desempeño Colombia (cifra oficial) | Precisión del SAM si esto llega a un pitch formal | Informe de pago (IMARC/GVR) — comprar solo si se busca inversión externa |
| Interés del gremio EST | Validar el canal sectorial | Una conversación exploratoria vía la membresía de Asignar en el gremio |

---

## 10. Conclusión

1. **Sí hay mercado para ECO** — el dolor que motivó el pivote (proveedor externo caro y rígido) es generalizado, la categoría es el segmento más grande del HR tech LATAM, y el cruce "modelo pre-cargado + precio mediana empresa + canal EST" está vacío.
2. **El tamaño realista es de línea de negocio, no de startup independiente** (SOM USD 40–150K ARR a 24 meses en el escenario optimista). Con costo marginal ≈ 0, eso es margen casi puro para Asignar — pero no justifica desviar el foco del uso interno, que es lo que mantiene el producto vivo y creíble.
3. **La plataforma completa no es la cuña de entrada** — es el upsell y el diferenciador del portafolio EST de Asignar. Competir de frente con Buk/Rankmi/Crehana sería pelear contra USD 100M+ de capital sin ventaja injusta.
4. **Próximos 3 pasos concretos:** (1) terminar sub-etapas D y E — sin reporte + PDI no hay producto vendible; (2) responder las 4 preguntas del dato ancla (§5) con Simon; (3) decidir la arquitectura multi-cliente antes de prometerle nada a un tercero.

---

## Fuentes

- [Grand View Research — Talent Management Software Market](https://www.grandviewresearch.com/industry-analysis/talent-management-software-market)
- [IMARC — Performance Appraisal & Management Software Market](https://www.imarcgroup.com/performance-appraisal-management-software-market)
- [IMARC — Latin America HR Technology Market](https://www.imarcgroup.com/latin-america-human-resource-technology-market)
- [Straits Research — Continuous Performance Management Software](https://straitsresearch.com/report/continuous-performance-management-software-market)
- [Confecámaras — Dinámica de creación de empresas 2024](https://confecamaras.org.co/en-2024-se-crearon-en-el-pais-297-475-empresas-senala-informe-de-confecamaras/)
- [El Tiempo — Trabajadores en misión / EST](https://www.eltiempo.com/economia/sectores/cae-el-numero-de-trabajadores-a-traves-de-empresas-de-servicios-temporales-en-colombia-3454490)
- [La Nota Económica — 474 mil empleos vía EST](https://lanotaeconomica.com.co/movidas-empresarial/474-mil-empleos-formales-se-mantienen-gracias-a-las-empresas-de-servicios-temporales/)
- [El Espectador — Crehana compra Acsendo](https://www.elespectador.com/economia/emprendimiento-y-liderazgo/crehana-anuncio-la-compra-de-acsendo-la-startup-colombiana-de-talento-humano/)
- [Bloomberg Línea — SoftBank lidera ronda de Rankmi](https://www.bloomberglinea.com/2023/03/01/softbank-latin-america-fund-lidera-ronda-para-startup-chilena-de-recursos-humanos/)
- [La Tercera — Buk y startups chilenas de RRHH](https://www.latercera.com/pulso/noticia/startups-chilenas-de-recursos-humanos-van-a-la-conquista-de-america-latina/K2UUWGWI5NBKNBRUIVDBEYQWEI/)
- [Factorial — Plan de precios](https://factorial.es/plan-de-precios)
- Docs de referencia metodológica: `lumi-mvp/docs/mercado/analisis-de-mercado.md` · `lumi-mvp/docs/mercado/competitive-analysis.md` · `lumi-mvp/docs/alianzas/alianza-asignar.md` · `lumi-mvp/docs/alianzas/pitch-simon.md`

---

*Investigación realizada el 2026-07-01. Las estimaciones propias están marcadas [EST.] y explicadas. Los precios de competidores directos en Colombia no son públicos — ver §9 para el plan de obtención (el dato más valioso, el costo del proveedor externo reemplazado, está dentro de la propia Asignar).*
