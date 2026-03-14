# CalcIng — CONTEXT.md
**Última actualización:** Sesión actual — Backend-5a completo, 646 tests frontend + 102 backend pasando
**Fecha:** Marzo 2026

---

## Estado del proyecto

### FASE ACTUAL — Backend-5b
Backend-5a completada: Alembic configurado, migración inicial
generada (tablas users + problems), 5 tests nuevos pasando.
Backend-5b pendiente: GitHub Actions CI/CD.

### Fases completadas: 0 ✅, 1 ✅, 2 ✅, 3 ✅, 4 ✅, Backend-1 ✅, Backend-2 ✅, Backend-3a ✅, Backend-3b ✅, Backend-3c ✅, Backend-4 ✅, Backend-5a ✅

---

## Qué existe y funciona

### calcIng-v3/ (proyecto original — NO TOCAR)
- 8 módulos JS funcionales
- 93 tests pasando (`node tests/math.test.js`)
- PWA completa (manifest + sw.js)
- main.js: 1046 líneas monolítico — referencia visual, no tocar

### calcIng/frontend/ (proyecto nuevo — activo)
- Stack: Vite + React + TypeScript strict
- **646 tests totales — 646 pasando** (0 fallas)
- `npx vitest run` corre todos los tests

### services/math-engine/ (backend — activo)
- Stack: Python 3.13 + FastAPI + SymPy
- **102 tests backend — 102 pasando** (0 fallas)
- `pytest` corre todos los tests desde `services/math-engine/`

---

## Componentes completados — Fase 1

### CalculatorDisplay ✅ — 8 tests
### CalculatorKeypad ✅ — 40 tests
### useCalculator ✅ — 36 tests
### App.tsx ✅ — 17 tests de integración
- Toggle CASPanel (`showCAS`) y toggle GraphViewer (`showGraph`) como estado local

---

## Fase 2 — CAS Simbólico ✅ COMPLETA

### Archivos — Fase 2 (NO MODIFICAR)
- `src/engine/cas/casEngine.ts` — interfaz abstracta CASEngine
- `src/engine/cas/nerdamerAdapter.ts` — implementa CASEngine con nerdamer.js
- `src/hooks/useCAS.ts` — hook con steps: MathStep[] integrado
- `src/components/CASPanel/CASPanel.tsx` — renderiza StepViewer

---

## Fase 3 — Step Engine Pedagógico ✅ COMPLETA

### Archivos — Fase 3 (NO MODIFICAR)
- `src/engine/stepEngine/types.ts` — StepOperation, MathStep, StepInput, DetailLevel
- `src/engine/stepEngine/ruleBook.ts` — 15 entradas con explanations en 3 niveles
  (beginner/intermediate/advanced) por regla
- `src/engine/stepEngine/stepBuilder.ts` — NO TOCAR
- `src/engine/stepEngine/stepEngine.test.ts` — 68 tests ✅
- `src/components/CASPanel/StepViewer.tsx` — prop level, fallback a step.explanation
- `src/components/CASPanel/CASPanel.tsx` — level state + cas-detail-level-select

### Sprints completados
- Step-1 ✅ — Infraestructura base (28 tests)
- Step-2 ✅ — Integración useCAS + StepViewer (19 tests)
- Step-3 ✅ — Pasos reales ecuación lineal (20 tests)
- Step-4 ✅ — Pasos reales integrales (20 tests)
- Step-5 ✅ — DetailLevel, explanations por nivel en RULE_BOOK, selector en CASPanel

---

## Fase 4 — Graficador 2D ✅ COMPLETA

### Archivos — Fase 4 (NO MODIFICAR)
- `src/engine/graphEngine/evaluator.ts` — funciones exportadas:
  - `evaluatePoint(expr, val, variable='x'): number | null`
  - `adaptiveSample(expr, a, b): Point[]`
  - `sampleParametric(exprX, exprY, tMin, tMax, n=200): Point[]`
  - `samplePolar(exprR, thetaMin, thetaMax, n=200): Point[]`
  - `numericalIntegral(expr, a, b, n=500): number`
- `src/engine/graphEngine/evaluator.test.ts` — tests ✅
- `src/components/GraphViewer/GraphViewer.tsx` — componente completo Graph-3b
- `src/components/GraphViewer/GraphViewer.test.tsx` — tests ✅

### Sub-fases completadas
- Graph-1 ✅ — evaluator.ts, canvas base, ejes, cuadrícula, zoom por botones
- Graph-2a ✅ — adaptiveSample, múltiples funciones (hasta 6), inputs de rango
- Graph-2b ✅ — zoom rueda, pan arrastrar, tooltip, exportar PNG, reset dblClick
- Graph-3a ✅ — selector modo (cartesian/parametric/polar), sampleParametric,
  samplePolar, toggle derivada (solo cartesiano), derivada numérica h=0.001
- Graph-3b ✅ — área bajo la curva: graph-area-toggle, graph-area-a/b (default -1/1),
  graph-area-value, sombreado canvas rgba(0,229,255,0.25), numericalIntegral

### Graph-4 (3D con Three.js) — BLOQUEADO hasta H2
Requiere backend existente. Gate de monetización (plan premium).

---

## Fase 5 — Backend ⏳ EN PROGRESO (Horizonte 2)

### Estado actual del proyecto
- Tests backend: 102 passing, 0 failing
- Tests frontend: 646 passing, 0 failing

### Fases completadas

#### Backend-1 ✅ — Infraestructura FastAPI + SymPy
- Entorno Python 3.13, venv, dependencias instaladas
- Estructura: `services/math-engine/` con `routers/`, `models/`, `tests/`
- Endpoints implementados: `GET /health`, `POST /solve`,
  `POST /differentiate`, `POST /integrate`,
  `POST /solve-equation`, `POST /evaluate`
- Motor CAS: SymPy 1.14.0
- Seguridad: sanitización básica, timeout 10s, CORS localhost:5173
- Tests pytest: 18 passing con pytest-asyncio + httpx ASGITransport

#### Backend-2 ✅ — Conectar frontend con math-engine
- ProcessPoolExecutor (max_workers=4) — todas las operaciones SymPy corren en proceso separado
- loop.run_in_executor() reemplaza corrutinas síncronas en todos los endpoints
- asyncio.wait_for ahora cancela realmente el trabajo de SymPy
- Campo `execution_mode: str = "process_pool"` en DifferentiateResponse e IntegrateResponse
- 4 tests nuevos en tests/test_math.py — total 22 passing
- `services/math-engine/Dockerfile` — imagen python:3.13-slim, puerto 8001
- `docker-compose.yml` en raíz del monorepo — levanta math-engine en puerto 8001
- `src/services/mathService.ts` — cliente HTTP con feature flag VITE_USE_BACKEND
- `src/services/mathService.test.ts` — 17 tests con mock de fetch, sin backend real
- `.env.local` — VITE_USE_BACKEND=false por defecto

#### Backend-3 ✅ COMPLETO — Autenticación JWT + historial PostgreSQL

**Backend-3a ✅ — Infraestructura de base de datos (10 tests)**
- `db/__init__.py` — módulo vacío
- `db/models.py` — Base, User (email unique, UUID PK, created_at), Problem (UUID PK, FK user_id CASCADE, expression, result, type, created_at)
- `db/database.py` — engine async + AsyncSessionLocal + get_db()
- Dependencias agregadas: sqlalchemy[asyncio], aiosqlite, alembic, passlib[bcrypt], python-jose[cryptography], python-multipart
- Tests: 10 nuevos en tests/test_db.py — total 32 passing

**Backend-3b ✅ — Autenticación JWT RS256 (12 tests)**
- `core/__init__.py` — módulo vacío
- `core/keys.py` — generación/carga de claves RSA, par efímero cacheado en memoria
- `core/security.py` — JWT RS256, bcrypt hash/verify, create_access_token, create_refresh_token, decode_refresh_token
- `routers/auth.py` — POST /auth/register (201), POST /auth/login (200), POST /auth/refresh (200)
- `main.py` — registrado auth_router
- Dependencias: bcrypt==4.0.1 (pinneado), pydantic[email], cryptography>=42.0.0
- Tests: 12 nuevos en tests/test_auth.py — total 44 passing

**Backend-3c ✅ — historial paginado con cursor, require_auth, optional_auth, guardado automático en /solve (12 tests)**
- `core/auth_deps.py` — require_auth (valida access token RS256, rechaza refresh tokens) + optional_auth (retorna None sin lanzar 401)
- `routers/history.py` — GET /users/me/history con paginación cursor basada en created_at DESC
- `routers/math.py` — /solve modificado: guarda Problem si usuario autenticado (optional_auth + db)
- `main.py` — registrado history_router
- Tests: 12 nuevos en tests/test_history.py — total 56 passing

#### Backend-4 ✅ — Redis + configuración centralizada + Docker Compose completo
- `core/config.py` — Settings(BaseSettings): MAX_WORKERS, APP_ENV, DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY
- Redis caché de resultados SymPy, rate limiting por IP y usuario
- docker-compose.yml actualizado con postgres:16 + redis:7-alpine
- asyncpg agregado a requirements.txt como driver async de PostgreSQL
- Tests: total 97 passing

#### Backend-5a ✅ — Alembic migrations (5 tests)
- `alembic.ini` — configurado con fallback sqlite:///./calcIng_dev.db
- `alembic/env.py` — configurado con get_url(): soporta -x db_url= (tests),
  DATABASE_URL (producción), conversión automática asyncpg→psycopg2 y aiosqlite→sqlite
- `alembic/versions/<hash>_initial.py` — migración inicial con op.create_table("users") y op.create_table("problems")
- Tests: 5 nuevos en tests/test_alembic.py — total 102 passing

### Stack nuevo que se agrega
- Python + FastAPI
- PostgreSQL
- Redis
- Docker / Docker Compose

---

## Estado de tests

| Archivo | Tests | Estado |
|---------|-------|--------|
| `tests/engine/math.test.ts` | 93 | ✅ |
| `src/App.test.tsx` | 17 | ✅ |
| `src/components/CalculatorDisplay/...test.tsx` | 8 | ✅ |
| `src/components/CalculatorKeypad/...test.tsx` | 40 | ✅ |
| `src/hooks/useCalculator.test.ts` | 36 | ✅ |
| `src/hooks/useCAS.test.ts` | 22 | ✅ |
| `src/hooks/useCAS.steps.test.ts` | 7 | ✅ |
| `src/engine/cas/casEngine.test.ts` | 10 | ✅ |
| `src/engine/cas/nerdamerAdapter.test.ts` | 183 | ✅ |
| `src/components/CASPanel/CASPanel.test.tsx` | 25 | ✅ |
| `src/components/CASPanel/StepViewer.test.tsx` | 12 | ✅ |
| `src/engine/stepEngine/stepEngine.test.ts` | 68 | ✅ |
| `src/engine/graphEngine/evaluator.test.ts` | tests ✅ | ✅ |
| `src/components/GraphViewer/GraphViewer.test.tsx` | tests ✅ | ✅ |
| `src/services/mathService.test.ts` | 17 | ✅ |
| `services/math-engine/tests/test_math.py` | 22 | ✅ |
| `services/math-engine/tests/test_db.py` | 10 | ✅ |
| `services/math-engine/tests/test_auth.py` | 12 | ✅ |
| `services/math-engine/tests/test_history.py` | 12 | ✅ |
| `services/math-engine/tests/test_alembic.py` | 5 | ✅ |
| **Total frontend** | **646** | **✅ 0 fallas** |
| **Total backend** | **102** | **✅ 0 fallas** |

---

## Infraestructura

- Vitest + jsdom + @testing-library/react
- ESLint configurado: `eslint.config.js` con `typescript-eslint`
- `npx vitest run` → todos los tests
- `npm run typecheck` → tsc --noEmit
- `tsconfig.json`: `skipLibCheck: true`, `types: ["node"]`
- Alias: `@engine` → `src/engine`

---

## Bugs conocidos registrados

### BUG-001 — CERRADO ✅
- **Archivo:** `src/hooks/useCalculator.ts`
- **Fix:** Constante `APPENDABLE_TOKENS` Set

### Deuda técnica activa
- `detectDiffRule`: regex frágil con `exp(-x)` — revisar en futuro
- `detectIntegrateRule` U_SUBSTITUTION sub-testeado
- CASPanel muestra selector de nivel aunque no haya pasos — cosmético
- App.test.tsx genera stderr de canvas en jsdom — ruido, no fallo
- sampleParametric/samplePolar: n fijo 200 puntos vs adaptativo — revisar en Graph-4
- **Backend:** `max_workers=4` hardcodeado en ProcessPoolExecutor — mover a variable de entorno en Backend-4
- `python-jose` usa `datetime.utcnow()` deprecado — DeprecationWarning en tests de refresh, sin impacto funcional

---

## Reglas de siempre

- TDD: tests primero, código después
- No modificar archivos existentes sin aprobación explícita
- No tocar calcIng-v3/ bajo ninguna circunstancia
- Una tarea por sesión
- 2 intentos fallidos en el mismo bug → parar y reportar
- No aprobar sin output real del terminal

---

## Comandos útiles (PowerShell)
```powershell
# Tests completos (frontend)
npx vitest run

# Tests backend
cd services/math-engine && pytest

# Docker
docker compose up --build

# TypeCheck
npx tsc --noEmit

# ESLint
npx eslint src --max-warnings 0

# Dev server
npm run dev
```

---

## Roadmap — Fases

| Fase | Estado | Tests | Descripción |
|------|--------|-------|-------------|
| Fase 0 | ✅ Completa | 93 | Setup monorepo, migración TS |
| Fase 1 | ✅ Completa | 96 | Display, Keypad, useCalculator, App |
| Fase 2 | ✅ Completa | 245 | CAS simbólico con nerdamer.js |
| Fase 3 | ✅ Completa | 521 | Step Engine pedagógico |
| Fase 4 | ✅ Completa | 629 | Graficador 2D completo |
| Fase 5 — Backend-1 | ✅ Completa | 18 | FastAPI + SymPy, 6 endpoints |
| Fase 5 — Backend-2 | ✅ Completa | 646 | Docker, mathService.ts, feature flag |
| Fase 5 — Backend-3a | ✅ Completa | 32 | Infraestructura BD: modelos, engine async |
| Fase 5 — Backend-3b | ✅ Completa | 44 | JWT RS256, register, login, refresh |
| Fase 5 — Backend-3c | ✅ Completa | 56 | GET /users/me/history, require_auth, optional_auth |
| Fase 5 — Backend-4 | ✅ Completa | 97 | Redis, pydantic-settings, Docker Compose completo |
| Fase 5 — Backend-5a | ✅ Completa | 102 | Alembic migrations. alembic init + env.py configurado + migración inicial users+problems. 5 tests nuevos. Total backend: 102 passing. |