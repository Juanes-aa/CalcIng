## 2026-03-12 — UI: Integración de CASPanel en App.tsx

**Decisión:** toggle button en el header; CASPanel se renderiza condicionalmente debajo del keypad; estado local `showCAS: boolean` en App.

**Razonamiento:** el roadmap (H1) no especifica layout concreto para el CASPanel. El contenedor `.calculator` tiene `max-width: 380px` — renderizar ambos paneles simultáneamente sin toggle rompería el layout o requeriría un rediseño mayor fuera del scope de Fase 2. El toggle es la opción de menor fricción: no rompe ningún test existente, no requiere nuevo estado global, y es reversible sin cambios de interfaz.

**Alternativas descartadas:**
- Siempre visible debajo del keypad: fuerza al usuario a scrollear en pantallas pequeñas; visualmente ruidoso cuando no se usa el CAS.
- Tab switcher (Calculadora | CAS): cambia el modelo mental de la app — deja de ser "calculadora con CAS" y pasa a ser "dos modos separados". Scope de Fase 3+.
- Sidebar: requiere cambio de layout a dos columnas, diseño CSS no trivial, fuera del scope de Fase 2.

**Revisión:** al inicio de Fase 3 (Step Engine) cuando el CASPanel necesite mostrar pasos — en ese momento puede evaluarse si tab switcher aporta más claridad UX.

**Impacto:** `src/App.tsx`, `src/App.module.css`, `src/App.test.tsx` (5 tests nuevos añadidos).

---

DECISION-005 — Estrategia de conexión Frontend ↔ Backend (Backend-2)
Fecha: 2026-03-13
Fase: Backend-2
Estado: APROBADA ✅

Contexto
El frontend usa casEngine.ts (nerdamer.js) para todo el CAS simbólico. El backend (FastAPI + SymPy) ya tiene 6 endpoints implementados y 18 tests pasando. Backend-2 debe conectar ambos. El roadmap establece explícitamente en §4.1: "Abstracción via interfaz común para que el frontend no necesite cambios en la migración."

Decisión
Crear una capa de servicio HTTP (mathService.ts) que implemente la misma interfaz CASEngine que hoy usa el frontend, llamando al backend en lugar de nerdamer.
Los componentes y hooks existentes (useCAS.ts, CASPanel, etc.) no se tocan — siguen llamando a la misma interfaz. Solo cambia quién la implementa por debajo.

Implementación concreta
src/
└── services/
    └── mathService.ts     ← NUEVO: cliente HTTP que implementa CASEngine
El useCAS.ts (que NO se toca) actualmente importa desde casEngine.ts. Se agrega un feature flag en .env:
VITE_USE_BACKEND=false   ← por defecto usa nerdamer (sin romper nada)
VITE_USE_BACKEND=true    ← redirige a mathService.ts
En el módulo que exporta el engine activo (casEngine.ts o un índice), se selecciona la implementación según el flag. Los 629 tests del frontend siguen pasando porque mockean la interfaz, no la implementación.

Por qué esta opción y no las otras
OpciónProblemaCorte limpio (borrar nerdamer)Los 629 tests unitarios pasan a depender de que el backend esté levantado. Rompe TDD.Migración gradual con fallback en runtimeLógica condicional en producción. Deuda técnica garantizada — el roadmap la prohíbe explícitamente (§1.1).Dual mode por env var sin capa de abstracciónEl useCAS.ts tendría que conocer el flag. Se tocaría un archivo prohibido.Capa de abstracción + feature flag ✅Cumple §4.1 del roadmap. No toca archivos prohibidos. Tests siguen siendo unitarios. Migración limpia cuando el backend esté listo.

Entregables de Backend-2 con esta estrategia

Dockerfile para math-engine
docker-compose.yml en la raíz (con el esquema del roadmap §9.3)
src/services/mathService.ts — cliente HTTP con la interfaz CASEngine
src/services/mathService.test.ts — tests con mock de fetch (sin backend real)
Actualización de CONTEXT.md, DECISIONS.md, STATUS.md

Los 629 tests del frontend y los 22 del backend siguen pasando en verde.

---

DECISION-006 — ProcessPoolExecutor para operaciones SymPy
Fecha: 2026-03-13
Fase: Backend-2 (pre-conexión frontend)

Problema:
routers/math.py usaba corrutinas sin await para ejecutar SymPy.
asyncio.wait_for no puede cancelar trabajo síncrono — el timeout era
ilusorio contra cálculos reales. El event loop se bloqueaba completamente.

Decisión:
Mover todas las operaciones SymPy a un ProcessPoolExecutor global
(max_workers=4) usando loop.run_in_executor(). Las funciones SymPy
se extrajeron como funciones puras de módulo (requerimiento de pickle).

Alternativas descartadas:
- ThreadPoolExecutor: no resuelve el bloqueo del GIL para código CPU-bound
- asyncio.to_thread: mismo problema, no libera el GIL para SymPy
- Corrutinas con await falso: parche cosmético, no resuelve el problema

Consecuencias:
+ asyncio.wait_for ahora cancela realmente operaciones pesadas
+ El event loop queda libre durante cálculos SymPy
+ /health responde aunque haya cálculos corriendo
- Overhead de serialización pickle por llamada (aceptable para operaciones matemáticas)
- max_workers=4 es fijo — revisar en Backend-4 con configuración por variable de entorno

---

DECISION-007 — docker-compose.yml mínimo viable (Backend-2)
Fecha: 2026-03-13
Fase: Backend-2

Decisión:
El docker-compose.yml inicial solo incluye el servicio math-engine.
PostgreSQL y Redis no se agregan todavía.

Razonamiento:
Ningún código actual requiere base de datos ni caché. Agregarlos ahora
sería infraestructura sin consumidor — deuda de complejidad sin valor.
PostgreSQL y Redis se incorporan en Backend-3 cuando JWT e historial
los requieran realmente. El roadmap (§9.3) define el esquema completo
pero no impone cuándo agregarlo.

Consecuencias:
+ Compose arranca sin dependencias externas — útil para desarrollo local
+ Menos superficie de error en la primera integración Docker
- Habrá un segundo commit de compose cuando se agreguen los servicios de Backend-3

---

DECISION-008 — mathService.ts como capa de abstracción HTTP
Fecha: 2026-03-13
Fase: Backend-2

Decisión:
mathService.ts expone tres funciones (solveExpression, differentiateExpression,
integrateExpression) e isBackendEnabled(). El feature flag VITE_USE_BACKEND
en .env.local controla si el frontend usa el backend o nerdamer.

Razonamiento:
useCAS.ts y casEngine.ts no fueron tocados — los 629 tests frontend
anteriores siguen siendo completamente unitarios y no dependen de red.
La capa de servicio es el único lugar que conoce la URL del backend
y el protocolo HTTP. Cuando VITE_USE_BACKEND=false (default), el
comportamiento de la app es idéntico al estado pre-Backend-2.

Consecuencias:
+ Migración activable por variable de entorno sin tocar código
+ 17 tests nuevos cubren todos los contratos HTTP con mocks de fetch
+ Los 629 tests existentes siguen pasando sin modificación
- La integración real (useCAS.ts consumiendo mathService) queda pendiente
  para cuando el equipo decida hacer el corte de nerdamer → backend

---

DECISION-009 — bcrypt==4.0.1 pinneado en requirements.txt (Backend-3b)
Fecha: 2026-03-13
Fase: Backend-3b
Estado: APROBADA ✅

Problema:
passlib[bcrypt]==1.7.4 instala bcrypt 5.x como dependencia transitiva.
bcrypt 5.x eliminó el atributo __about__ y cambió su API interna.
passlib ejecuta una detección de bugs con una contraseña de prueba de >72
bytes durante la inicialización del backend — esto explota con bcrypt 5.x
antes de procesar ningún password real.

Decisión:
Agregar bcrypt==4.0.1 explícito en requirements.txt para sobrescribir
la versión transitiva instalada por passlib[bcrypt].

Alternativas descartadas:
- Reemplazar passlib por bcrypt directo: requiere reescribir security.py,
  fuera del scope de Backend-3b.
- Ignorar el error: no es posible, bloquea todos los endpoints de auth.

Consecuencias:
+ Pin explícito evita rotura silenciosa en Docker build o entornos nuevos
+ passlib 1.7.4 + bcrypt 4.0.1 funciona correctamente en Python 3.13
- bcrypt 4.0.1 es una versión anterior; revisar compatibilidad en Backend-4
  cuando se evalúe migrar a una alternativa más mantenida

---

DECISION-010 — Claves RSA efímeras cacheadas en memoria (Backend-3b)
Fecha: 2026-03-13
Fase: Backend-3b
Estado: APROBADA ✅

Problema:
Sin variables de entorno JWT_PRIVATE_KEY / JWT_PUBLIC_KEY definidas,
core/keys.py generaba un par RSA nuevo en cada llamada a get_private_key()
y get_public_key(). El login firmaba con el par A y el refresh intentaba
verificar con el par B → JWTError → 401.

Decisión:
Cachear el par RSA generado en variables de módulo (_cached_private_pem,
_cached_public_pem). Se genera una sola vez por proceso mediante
_ensure_cached_pair(). En producción las variables de entorno tienen
precedencia y el cache no se usa.

Consecuencias:
+ Tests de refresh funcionan correctamente sin configuración adicional
+ En producción JWT_PRIVATE_KEY / JWT_PUBLIC_KEY son obligatorias
+ El par efímero es válido por toda la vida del proceso — correcto para tests
- El par efímero no persiste entre reinicios del proceso (esperado y deseado
  en tests; en producción se usan variables de entorno)

---

DECISION-013 — optional_auth como dependencia separada de require_auth
Fecha: 2026-03-13
Fase: Backend-3c
Estado: APROBADA ✅

Problema:
/solve funciona con o sin autenticación. Usar require_auth rompería
el comportamiento anónimo existente. Mezclar la lógica condicional
dentro del endpoint contaminaría la responsabilidad del router.

Decisión:
Crear optional_auth en core/auth_deps.py como dependencia independiente.
Retorna None si no hay token o el token es inválido, sin lanzar 401.
require_auth lanza 401 en cualquier caso de fallo.
Separación de responsabilidades limpia: el endpoint /solve no necesita
conocer la lógica de validación JWT — solo recibe user_id o None.

Consecuencias:
+ /solve mantiene comportamiento anónimo sin cambio de contrato
+ El guardado en BD es transparente para el caller
+ optional_auth reutilizable en futuros endpoints con auth opcional
- Un token malformado en /solve se ignora silenciosamente (diseño intencional)

---

DECISION-014 — Cursor-based pagination con created_at DESC
Fecha: 2026-03-13
Fase: Backend-3c
Estado: APROBADA ✅

Problema:
El roadmap especifica GET /users/me/history paginado con cursor.
Offset-based pagination degrada en historiales grandes (O(offset) en BD).

Decisión:
El cursor es el ISO timestamp (created_at.isoformat()) del último item
de la página. La siguiente página filtra WHERE created_at < cursor_dt
con ORDER BY created_at DESC. Se consulta limit+1 items para detectar
si hay más páginas sin un COUNT(*) adicional.

Razonamiento:
Más eficiente que offset para historiales grandes — el índice en
created_at permite saltar directamente al punto de corte.
El timestamp ISO es opaco para el cliente (no revela estructura interna)
y suficientemente preciso para SQLite en tests y PostgreSQL en producción.

Consecuencias:
+ O(log n) vs O(n) para páginas avanzadas en historiales grandes
+ Sin COUNT(*) adicional — una sola query por página
+ Compatible con SQLite (tests) y PostgreSQL (producción)
- Timestamps duplicados exactos podrían causar items repetidos o saltados
  (probabilidad muy baja en práctica; revisar si se agrega microsegundo UUID en Backend-4)4

DECISION-015 — pydantic-settings (BaseSettings) como fuente única de configuración.
               Settings singleton en core/config.py. Todos los módulos leen de ahí.
               Defaults seguros en código; producción sobreescribe via .env o env vars.

DECISION-019 — asyncpg como driver async de PostgreSQL para
               SQLAlchemy en entorno Docker. aiosqlite sigue
               siendo el driver para tests (SQLite en memoria).

DECISION-020 — Alembic con driver síncrono en env.py.
Fecha: 2026-03-13
Fase: Backend-5a
Estado: APROBADA ✅

Problema:
Alembic no soporta drivers async (asyncpg, aiosqlite). El proyecto usa
sqlite+aiosqlite para FastAPI en desarrollo y postgresql+asyncpg en
producción. Alembic necesita drivers síncronos equivalentes para crear
y aplicar migraciones.

Decisión:
env.py convierte DATABASE_URL al driver síncrono equivalente antes de
crear el engine. En producción: asyncpg para FastAPI, psycopg2 para
Alembic. En tests: -x db_url=sqlite:///./test.db.
La función get_url() en env.py implementa la conversión con precedencia:
(1) -x db_url= en línea de comandos (usado en tests de pytest),
(2) variable de entorno DATABASE_URL con conversión de driver,
(3) fallback a sqlalchemy.url en alembic.ini.

Alternativas descartadas:
- alembic[async]: soporte experimental, no recomendado para producción.
- Mantener dos DATABASE_URL separadas: duplicación propensa a errores de
  sincronización entre la URL de FastAPI y la de Alembic.

Consecuencias:
+ Los tests de migración (test_alembic.py) corren sin levantar servicios externos
+ En producción, alembic upgrade head usa psycopg2 (síncrono) mientras
  FastAPI usa asyncpg (async) — coexistencia limpia sin conflicto
+ Un solo alembic.ini y env.py para todos los entornos
- psycopg2 debe estar disponible en el entorno de producción junto a asyncpg

---

DECISION-021 — vite/client en tsconfig.json types[] para ImportMeta.env en CI
Fecha: 2026-03-13
Fase: Backend-5b
Estado: APROBADA ✅

Problema:
`npx tsc --noEmit` fallaba en GitHub Actions con:
  error TS2339: Property 'env' does not exist on type 'ImportMeta'
El tsconfig.json tenía `"types": ["node"]`. Al listar `types` explícitamente,
TypeScript excluye todo lo que no figure en la lista — incluido `vite/client`,
que es quien declara `ImportMeta.env`. El error no aparecía en desarrollo
porque Vite inyecta los tipos en runtime, pero CI corre `tsc` directamente.

Decisión:
Agregar `"vite/client"` al array `types` en `frontend/tsconfig.json`:
  "types": ["node", "vite/client"]

Alternativas descartadas:
- Triple-slash reference `/// <reference types="vite/client" />` en cada archivo:
  solución local, no sistémica; cualquier archivo nuevo vuelve a fallar en CI.
- Eliminar el campo `types` completamente: TypeScript incluiría todos los @types/*
  instalados, lo que puede introducir conflictos de tipos no deseados (p.ej.
  `@types/node` vs DOM para `fetch`, `Buffer`, etc.).

Consecuencias:
+ `tsc --noEmit` pasa limpio en CI sin depender del runtime de Vite
+ `import.meta.env.VITE_*` está correctamente tipado en todo el proyecto
+ El test `mathService.typecheck.test.ts` actúa como guardia permanente:
  falla en CI si `vite/client` se elimina accidentalmente del tsconfig
- Ninguna consecuencia negativa conocida