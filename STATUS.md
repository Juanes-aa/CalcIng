## Tests
Frontend: 646 passing, 0 failing
Backend:  102 passing, 0 failing

## Bloqueadores activos

NINGUNO

## Backend-5a ✅ COMPLETA — Alembic migrations
- alembic.ini + alembic/env.py + migración inicial
- Tablas users + problems listas para alembic upgrade head
- env.py soporta -x db_url= (tests) y DATABASE_URL (producción)
- Conversión automática asyncpg→psycopg2 y aiosqlite→sqlite
- 5 tests nuevos: 102 backend passing, 0 failing

## Backend-3: COMPLETO ✅

  3a — Infraestructura BD: db/models.py, db/database.py                    (10 tests)
  3b — Auth JWT RS256: routers/auth.py, core/security.py                   (12 tests)
  3c — Historial: routers/history.py, core/auth_deps.py                    (12 tests)

## Endpoints activos

  GET  /health
  POST /solve               (guarda en problems si autenticado)
  POST /differentiate
  POST /integrate
  POST /solve-equation
  POST /evaluate
  POST /auth/register
  POST /auth/login
  POST /auth/refresh
  GET  /users/me/history    (requiere JWT, paginado con cursor)

## Próxima fase: Backend-5b — GitHub Actions CI/CD

Tareas pendientes Backend-5b:
- [ ] GitHub Actions workflow para CI (pytest en cada PR)
- [ ] GitHub Actions workflow para CD (build Docker en merge a main)

## Deuda técnica conocida
- max_workers=4 hardcodeado en ProcessPoolExecutor — mover a variable de entorno en Backend-4
- Integración real useCAS.ts → mathService.ts pendiente (corte de nerdamer → backend)
- CASPanel.module.css: sin estilos propios — usa estilos del navegador.
  Pendiente sesión dedicada de UI polish post-cierre Fase 2.
- python-jose usa datetime.utcnow() deprecado — DeprecationWarning en tests de refresh,
  sin impacto funcional. Revisar alternativa (p.ej. PyJWT) en Backend-4.
- Cursor de paginación basado en timestamp: timestamps duplicados exactos podrían
  causar items repetidos o saltados. Revisar en Backend-4 si se agrega desempate por UUID.

Backend-4 Sub-fase 1 ✅ — Configuración centralizada (pydantic-settings)
Tests backend: 73 passing, 0 failing

Backend-4 ✅ Sub-fase 3 — Docker Compose con postgres:16 +
               redis:7-alpine. asyncpg agregado a requirements.txt.