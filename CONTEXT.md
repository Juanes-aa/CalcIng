# CalcIng — CONTEXT.md
Actualizado: Marzo 2026

## Tests actuales
- Frontend: 709 passing, 0 failing (`npx vitest run`)
- Backend: 140 passing, 0 failing (`pytest`)

## Fase actual
Frontend-5 Sprint F5-4 — Login visible + QA (por iniciar)

## Fases completadas
Fase 0-4 ✅ | Backend-1-6 ✅ | Frontend-5 F5-1 F5-2 F5-3 ✅

## Stack
- Frontend: Vite + React 18 + TypeScript strict + Vitest + mathjs + nerdamer.js
- Backend: Python 3.13 + FastAPI + SymPy + pytest + Redis (Upstash) + PostgreSQL (Supabase)
- Deploy: Vercel (frontend) + Render.com (backend) + GitHub Actions CI/CD
- Alias: @engine/ → src/engine/

## Archivos — NO TOCAR NUNCA
- calcIng-v3/ (proyecto original)
- src/engine/stepEngine/stepBuilder.ts
- src/hooks/useCAS.ts
- src/engine/cas/casEngine.ts

## Decisiones técnicas clave
- hidden va en <input>, no en <label> padre
- APPENDABLE_TOKENS incluye: números, operadores, ',', 'e', funciones básicas,
  estadística (mean(, stdDev(, etc.), bases (decToBin(, etc.), abs(, ceil(, floor(, round(, factorial(
- TabConvert usa parseFloat(result.toPrecision(10)) para eliminar ruido flotante
- Cache key backend NO incluye plan — gate aplicado post-cache al retornar
- get_plan_from_token() retorna "free" si no hay token o claim ausente
- /graph/3d y /export retornan 402 (free) o 501 (premium stub)
- JWT guardado en localStorage con key 'calcing_token'
- TDD: tests primero, implementación después — dos prompts separados por tarea

## Archivos clave
### Frontend
- src/App.tsx — toggles: CAS, Graficar, Avanzado (+ Login en F5-4)
- src/hooks/useCalculator.ts — APPENDABLE_TOKENS
- src/components/CASPanel/CASPanel.tsx
- src/components/AdvancedPanel/AdvancedPanel.tsx — 6 tabs
- src/components/GraphViewer/GraphViewer.tsx
- src/services/mathService.ts — BASE_URL localhost:8001
### Backend
- services/math-engine/routers/math.py
- services/math-engine/routers/premium.py
- services/math-engine/core/auth_deps.py — get_plan_from_token
- services/math-engine/core/config.py

## Backend — endpoints activos
- GET /health | POST /solve | POST /differentiate | POST /integrate
- POST /solve-equation | POST /evaluate
- POST /auth/register | POST /auth/login | POST /auth/refresh
- GET /users/me/history
- POST /graph/3d (stub 402/501) | POST /export (stub 402/501)

## Deuda técnica
- detectDiffRule: regex frágil con exp(-x)
- python-jose usa datetime.utcnow() deprecado (warning, no fallo)
- CASPanel muestra selector nivel sin pasos — cosmético

## Comandos
```powershell
npx vitest run          # tests frontend
pytest                  # tests backend (desde services/math-engine con venv)
npx tsc --noEmit        # typecheck
docker compose up --build
```

## Tarea de esta sesión
Tarea 1/3 de F5-4: crear src/services/authService.ts
- Funciones: login(), register(), logout(), getToken(), isLoggedIn()
- register(email, password) — sin campo name (backend no lo acepta)
- Contrato login: { access_token, refresh_token, token_type }
- Contrato register: { id, email } — 201
- JWT key en localStorage: 'calcing_token'
- Refresh token key en localStorage: 'calcing_refresh_token'
- Flujo: tests primero → output del terminal → implementación
- Archivo de tests: src/services/authService.test.ts (crear nuevo)
- No tocar ningún otro archivo en esta sesión

## Criterio de completud
- [ ] 10+ tests de authService pasando
- [ ] 709 tests anteriores siguen pasando
- [ ] tsc --noEmit limpio