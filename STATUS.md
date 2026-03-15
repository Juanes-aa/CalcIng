## Estado actual
Tests frontend: 656 passing, 0 failing
Tests backend:  106 passing, 0 failing

## Bloqueadores activos

NINGUNO

## Fases completadas
Backend-5a  ✅ Alembic migrations (tablas users + problems en Supabase)
Backend-5b  ✅ GitHub Actions CI/CD — verde (frontend + backend)
Backend-5c  ✅ Render.com deploy — live en https://calcing.onrender.com
Backend-5d  ✅ Upstash Redis — caché verificado (1501ms → 395ms, 4x speedup)
             rediss:// TLS — alert-pup-71146.upstash.io:6379
Backend-5e  ✅ PWA migrada al frontend React
             - vite-plugin-pwa instalado con Workbox
             - manifest.json en public/ (theme #6666cc, bg #0a0a14)
             - NetworkFirst para API calls a Render.com
             - CacheFirst para assets estáticos
             - index.html con meta tags PWA + Apple

## Próxima fase
Backend-6 — Sprint B6-1: Rate limiting por IP y usuario (slowapi)

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

## Deuda técnica conocida
- max_workers=4 hardcodeado en ProcessPoolExecutor — mover a variable de entorno en Backend-4
- Integración real useCAS.ts → mathService.ts pendiente (corte de nerdamer → backend)
- CASPanel.module.css: sin estilos propios — usa estilos del navegador.
  Pendiente sesión dedicada de UI polish post-cierre Fase 2.
- python-jose usa datetime.utcnow() deprecado — DeprecationWarning en tests de refresh,
  sin impacto funcional. Revisar alternativa (p.ej. PyJWT) en Backend-4.
- Cursor de paginación basado en timestamp: timestamps duplicados exactos podrían
  causar items repetidos o saltados. Revisar en Backend-4 si se agrega desempate por UUID.