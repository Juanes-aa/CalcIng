# CalcIng

Calculadora científica + CAS + graficador 2D + 6 motores especializados (matrices, bases, complejos, estadística, unidades, constantes), con auth, historial sincronizado, planes premium y PWA instalable.

## Stack

- **Frontend:** Vite + React 18 + TypeScript strict + Tailwind CSS v4 + Vitest + mathjs + nerdamer
- **Backend:** FastAPI + SymPy + Python 3.13 + Redis (Upstash) + PostgreSQL (Supabase) + Alembic
- **Auth:** JWT RS256 (passlib/bcrypt)
- **Pagos:** Mercado Pago (preapproval + cancel + webhook con HMAC)
- **Deploy:** Vercel (frontend) + Render.com (backend) + GitHub Actions CI/CD

## Setup

### Requisitos

- Node 20+
- Python 3.13
- Docker (opcional, para `docker compose up`)

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env   # editar con VITE_API_URL y VITE_USE_BACKEND
npm run dev              # http://localhost:5173
```

### Backend

```powershell
cd services/math-engine
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Crear .env con DATABASE_URL, JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, REDIS_URL, MP_*
alembic upgrade head
uvicorn main:app --reload --port 8001
```

### Docker (todo en uno)

```powershell
docker compose up --build
```

## Comandos de desarrollo

```powershell
# Frontend
cd frontend
npx vitest run          # tests
npx vitest              # tests en watch
npx tsc --noEmit        # typecheck
npm run build           # bundle producción

# Backend
cd services/math-engine
pytest                  # tests
pytest -k test_math     # tests filtrados
alembic revision --autogenerate -m "msg"
```

## Estructura

```
calcIng/
├── frontend/                  # Vite + React + TS
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/        # 15 vistas
│   │   ├── engine/            # mathEngine, parser, cas, graphEngine, stepEngine, etc.
│   │   ├── hooks/
│   │   ├── services/          # auth, math, history, billing, projects, support, premium
│   │   └── index.css          # tokens Tailwind v4 (dark + light)
│   └── tests/
└── services/
    └── math-engine/           # FastAPI
        ├── main.py
        ├── routers/           # math, auth, history, billing, projects, support, premium
        ├── core/              # auth_deps, security, config, cache
        ├── db/, models/, alembic/
        └── tests/
```

## Documentación adicional

- [`STATUS.md`](./STATUS.md) — estado operativo, endpoints, variables de entorno, limitaciones, roadmap
- [`CONTEXT.md`](./CONTEXT.md) — archivos clave, decisiones técnicas, comandos
- [`DESICIONS.md`](./DESICIONS.md) — historial de decisiones arquitectónicas (DECISION-001…)

## Variables de entorno

### Frontend (`frontend/.env`)

```
VITE_API_URL=https://calcing.onrender.com
VITE_USE_BACKEND=true
VITE_MP_PLAN_PRO_MONTHLY=2c93808...
VITE_MP_PLAN_PRO_ANNUAL=2c93808...
VITE_MP_PLAN_ENTERPRISE_MONTHLY=2c93808...
VITE_MP_PLAN_ENTERPRISE_ANNUAL=2c93808...
```

### Backend (`services/math-engine/.env`)

```
DATABASE_URL=postgresql+asyncpg://...
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
REDIS_URL=rediss://...upstash.io:6379
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...
MP_PLAN_PRO_MONTHLY=2c93808...
MP_PLAN_PRO_ANNUAL=2c93808...
MP_PLAN_ENTERPRISE_MONTHLY=2c93808...
MP_PLAN_ENTERPRISE_ANNUAL=2c93808...
MAX_WORKERS=4
APP_ENV=production
```

> **Importante:** `.env` nunca debe commitearse. Está en `.gitignore`.

## Live

- **Frontend:** https://calcing.vercel.app
- **Backend:** https://calcing.onrender.com (`/health` → `{"status":"ok","version":"1.0.0"}`)
