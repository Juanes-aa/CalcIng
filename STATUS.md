# CalcIng — STATUS

Estado operativo del proyecto. Para detalle de archivos clave y decisiones técnicas: `CONTEXT.md`. Para historial de decisiones arquitectónicas: `DESICIONS.md`.

---

## Estado actual

| Métrica | Valor |
|---|---|
| Tests frontend | **992 / 992** ✅ (`cd frontend; npx vitest run`) |
| Tests backend | **223 / 224** ✅ (1 fallo en `test_cache.py::test_redis_url_default`, no bloqueante — ver Limitaciones conocidas) |
| Typecheck (TS strict) | **limpio** ✅ (`npx tsc --noEmit`) |
| Migraciones Alembic | **6 revisiones, head `d8e4c1a9b7f3`** ✅ |
| Pagos | **Mercado Pago** (migrado desde Stripe el 2026-04-27) |
| Bloqueadores | **ninguno** |

**Listo para producción.**

---

## Live

- **Frontend:** https://calcing.vercel.app
- **Backend:** https://calcing.onrender.com
- **Health:** `GET /health` → `{"status":"ok","version":"1.0.0"}`

---

## Funcionalidad operativa

### Motores de cálculo
- **mathjs** — calculadora numérica + funciones extendidas (estadística, complejos, bases, factorial, etc.)
- **nerdamer** — CAS offline (fallback sin sesión)
- **SymPy backend** — CAS server-side con cache Redis y rate limiting; usado vía `sympyAdapter` cuando `VITE_USE_BACKEND=true` y hay JWT
- **graphEngine** — muestreo adaptativo 2D (cartesiano, paramétrico, polar) + integral numérica + derivada visual
- **stepEngine** — pasos pedagógicos con 3 niveles (beginner/intermediate/advanced)

### Vistas frontend (15)
Calculadora, CASPanel, GraphViewer, AdvancedPanel (5 tabs: stats, complex, matrix, convert, bases), ConstantesView, VariablesView, HistorialView, AjustesView, ProyectosView, NuevoProyecto, SoporteView, DocumentacionView, PreciosView, AuthModal.

### Auth y planes
- JWT RS256 con claim `plan` dinámico desde DB
- Login / Register / Refresh
- Mercado Pago preapproval + cancel + webhook con HMAC-SHA256, idempotente
- Plans: `free` / `pro` / `enterprise`

### Sincronización
- Historial: local (localStorage) + remoto (`/users/me/history`) con `mergeHistories()`
- Proyectos: backend CRUD via `projectsService`
- Tickets de soporte: `/support` → tabla `support_tickets`

### Premium (gating por plan)
- `POST /graph/3d` — surface plot 3D con matplotlib (PNG base64)
- `POST /export` — LaTeX o PNG renderizado de expresiones
- Gate: 402 Payment Required para `free`, 200 con resultado para `pro`/`enterprise`

---

## Endpoints backend

```
GET  /health

# Math
POST /solve              POST /differentiate    POST /integrate
POST /solve-equation     POST /evaluate
POST /simplify           POST /expand           POST /factor

# Auth
POST /auth/register      POST /auth/login       POST /auth/refresh

# Historial
GET  /users/me/history

# Premium
POST /graph/3d           POST /export

# Billing (Mercado Pago)
POST /billing/create-checkout    POST /billing/cancel
GET  /billing/status             POST /billing/webhook

# Proyectos
GET  /projects           POST /projects
GET  /projects/{id}      PATCH /projects/{id}   DELETE /projects/{id}

# Soporte
POST /support
```

---

## Operación

### Variables de entorno requeridas

**Frontend (`frontend/.env`):**
- `VITE_API_URL` — URL del backend (sin trailing slash)
- `VITE_USE_BACKEND` — `"true"` para SymPy, `"false"` para nerdamer offline
- `VITE_MP_PLAN_*` — Plan IDs públicos de Mercado Pago (4 valores: pro/enterprise × monthly/annual)

**Backend (`services/math-engine/.env`):**
- `DATABASE_URL` — Postgres (Supabase) o sqlite local para dev
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — claves RSA para RS256
- `REDIS_URL` — Upstash Redis (`rediss://...`)
- `MP_ACCESS_TOKEN` (formato `APP_USR-...` en producción, `TEST-...` en pruebas)
- `MP_WEBHOOK_SECRET` (se genera al crear el webhook en el panel MP)
- `MP_PLAN_PRO_MONTHLY` / `MP_PLAN_PRO_ANNUAL`
- `MP_PLAN_ENTERPRISE_MONTHLY` / `MP_PLAN_ENTERPRISE_ANNUAL`
- `MAX_WORKERS` — opcional, default `4` (controla `ProcessPoolExecutor`)
- `APP_ENV` — `development` / `testing` / `production`

### Comandos

```powershell
# Tests + typecheck
cd frontend; npx vitest run; npx tsc --noEmit
cd services/math-engine; pytest

# Migraciones
cd services/math-engine
alembic upgrade head
alembic revision --autogenerate -m "msg"

# Dev local
cd frontend; npm run dev                                  # :5173
cd services/math-engine; uvicorn main:app --reload --port 8001
```

---

## Limitaciones conocidas

- **`python-jose` warning:** la librería emite `DeprecationWarning` por uso interno de `datetime.utcnow()`. Nuestro código usa `datetime.now(timezone.utc)` correctamente. Se resolvería migrando a `PyJWT`.
- **CASPanel — selector de nivel:** muestra un dropdown de detail level (beginner/intermediate/advanced) pero los pasos generados aún no diferencian visualmente entre niveles. Cosmético.
- **`test_cache.py::test_redis_url_default`:** falla porque `Settings.REDIS_URL` carga el `.env` real (Upstash) en lugar del default `redis://localhost:6379`. El conftest no patchea `REDIS_URL` antes de crear `Settings()`. Pre-existente a la migración MP.

---

## Roadmap opcional

Tareas no bloqueantes que mejorarían la experiencia:

1. **QA visual del light-mode** — recorrer las 15 vistas alternando tema y corregir contrastes/colores hardcodeados que no respeten variables CSS.
2. **Documentación in-app completa** — secciones "Graficados", "API Pública" y "Ejemplos" en `DocumentacionView` aún tienen contenido placeholder.
3. **OAuth social (Google/GitHub)** — la UI muestra "o continúa con" pero el flujo no está implementado. Se sugiere usar Supabase Auth.
4. **Workspace en proyectos** — actualmente un proyecto guarda solo nombre + descripción. El campo `data` (JSONB) está listo para almacenar expresiones/resultados/gráficas; falta UI para vincular cálculos a proyectos.
5. **Migrar `python-jose` a `PyJWT`** — elimina el warning de deprecación.
