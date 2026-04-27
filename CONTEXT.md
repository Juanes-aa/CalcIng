# CalcIng — CONTEXT.md

Actualizado: Abril 2026

## Tests actuales

- **Frontend:** 991 / 991 passing ✅ (`npx vitest run`)
- **Backend:** 194 / 194 passing ✅ (`pytest`)
- **Typecheck:** `npx tsc --noEmit` limpio ✅
- **Migraciones Alembic:** 5 revisiones, aplican desde cero hasta head `c7d9e3f4a5b8` ✅

## Fase actual

Listo para producción. Próximas tareas opcionales: QA visual de light-mode + refinamiento de docs in-app.

## Stack

- **Frontend:** Vite + React 18 + TypeScript strict + Vitest + Tailwind CSS v4 + mathjs + nerdamer.js (CAS local)
- **Backend:** Python 3.13 + FastAPI + SymPy + pytest + Redis (Upstash) + PostgreSQL (Supabase) + Alembic
- **Auth:** JWT RS256 (passlib + bcrypt 4.0.1, claves RSA con cache de proceso)
- **Pagos:** Stripe (checkout, portal, webhook)
- **Deploy:** Vercel (frontend) + Render.com (backend) + GitHub Actions CI/CD
- **PWA:** vite-plugin-pwa con Workbox (NetworkFirst para API, CacheFirst para assets)
- **Alias:** `@engine/` → `frontend/src/engine/`

## Archivos — NO TOCAR NUNCA

- `calcIng-v3/` (proyecto original)
- `frontend/src/engine/stepEngine/stepBuilder.ts`
- `frontend/src/hooks/useCAS.ts`
- `frontend/src/engine/cas/casEngine.ts`

## Archivos clave

### Frontend

- `src/App.tsx` — orquestación de vistas (Calculadora, CAS, Graficar, Avanzado, Historial, Variables, Constantes, Proyectos, Soporte, Ajustes, Documentación, Precios)
- `src/hooks/useCalculator.ts` — `APPENDABLE_TOKENS`
- `src/services/authService.ts` — `register`/`login`/`logout`/`refresh`, JWT en `localStorage` key `calcing_token`
- `src/services/mathService.ts` — cliente HTTP que implementa la interfaz CASEngine; gate por `VITE_USE_BACKEND`
- `src/services/historyService.ts` — `fetchHistory()` con cursor
- `src/services/billingService.ts` — checkout / portal / status
- `src/services/projectsService.ts` — CRUD proyectos
- `src/services/supportService.ts` — submit ticket
- `src/services/premiumService.ts` — `graph/3d`, `export` (gates 402/501)
- `src/components/CASPanel/CASPanel.tsx`
- `src/components/AdvancedPanel/AdvancedPanel.tsx` (6 tabs)
- `src/components/GraphViewer/GraphViewer.tsx` (canvas 2D, lee colores con `cssVar()`)
- `src/components/AjustesView/AjustesView.tsx` (preferencias, cuenta, atajos, motor, exportación JSON)
- `src/components/DocumentacionView/DocumentacionView.tsx`
- `src/engine/historial.ts` — sync local↔backend con `mergeHistories`
- `src/engine/ajustes.ts` — settings (precision, sciNotation, theme, language) con bus de listeners
- `src/engine/i18n.ts` — diccionario ES/EN
- `src/index.css` — `@theme` Tailwind con tokens dark + bloque `html.light`

### Backend

- `services/math-engine/main.py`
- `services/math-engine/routers/` — `math.py`, `auth.py`, `history.py`, `billing.py`, `projects.py`, `support.py`, `premium.py`
- `services/math-engine/core/auth_deps.py` — `require_auth`, `optional_auth`, `get_plan_from_token`
- `services/math-engine/core/config.py` — pydantic-settings
- `services/math-engine/db/`, `models/`, `alembic/`

## Backend — endpoints activos

```
GET  /health
POST /solve              POST /differentiate    POST /integrate
POST /solve-equation     POST /evaluate
POST /simplify           POST /expand           POST /factor
POST /auth/register      POST /auth/login       POST /auth/refresh
GET  /users/me/history
POST /graph/3d           POST /export                  (premium gates 402/501)
POST /billing/create-checkout    POST /billing/portal
GET  /billing/status             POST /billing/webhook
GET  /projects           POST /projects        GET /projects/{id}
POST /support
```

## Decisiones técnicas clave

- TDD: tests primero, implementación después — dos prompts separados por tarea
- JWT en `localStorage` key `calcing_token` (refresh: `calcing_refresh_token`)
- `optional_auth` para `/solve` (auth opcional): el endpoint guarda historial si hay token, anónimo si no
- Cursor-based pagination en `/users/me/history` con `created_at` ISO timestamp
- Cache key backend NO incluye plan — gate aplicado post-cache
- `get_plan_from_token()` → `"free"` si token ausente o claim faltante
- `/graph/3d` y `/export` → 402 (free) o 501 (premium stub)
- ProcessPoolExecutor para SymPy (libera event loop)
- bcrypt pinneado a `4.0.1` (passlib 1.7.4 incompatible con bcrypt 5.x)
- Alembic con driver síncrono (psycopg2 / sqlite) en `env.py`; FastAPI con async (asyncpg / aiosqlite)
- `vite/client` en `tsconfig.json` `types[]` para `ImportMeta.env` en CI
- Tailwind CSS v4: tokens en `@theme`; light mode como `html.light` con override de variables
- Stripe: webhook idempotente, plan persistido en `users.plan`
- Sync de historial: `mergeHistories(remote, local)` — preserva `starred` local; remote es source of truth para timestamps

## Deuda técnica

- `python-jose` emite warning `datetime.utcnow()` deprecado (interno de la librería)
- CASPanel selector de nivel sin pasos visualmente diferenciados — cosmético

## Comandos

```powershell
# Frontend
cd frontend
npx vitest run          # tests
npx tsc --noEmit        # typecheck
npm run dev             # dev server (5173/5174)
npm run build           # producción

# Backend
cd services/math-engine
.\venv\Scripts\Activate.ps1
pytest                  # tests
uvicorn main:app --reload --port 8001

# Docker
docker compose up --build

# Migraciones
cd services/math-engine
alembic upgrade head
```

## Variables de entorno requeridas

- **Frontend (`frontend/.env`):** `VITE_BACKEND_URL`, `VITE_USE_BACKEND`
- **Backend (`services/math-engine/.env`):** `DATABASE_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
