# Migración Stripe → Mercado Pago — Plan de implementación

> **Contexto:** CalcIng es una calculadora científica + CAS con FastAPI backend, React frontend, JWT RS256 auth, PostgreSQL (Supabase) y Redis (Upstash). Actualmente usa Stripe para suscripciones (planes `pro` y `enterprise`, mensual y anual). Stripe no acepta cuentas Colombia, por eso se migra a Mercado Pago Colombia (MP).

> **Estado del proyecto al iniciar la migración:**
> - Tests: 991/991 frontend ✅, 194/194 backend ✅
> - Typecheck TS strict: limpio ✅
> - DB en Supabase con 5 migraciones aplicadas, head `c7d9e3f4a5b8`
> - Redis Upstash configurado
> - JWT keys generadas
> - Stripe coupling: moderado, ~8 archivos afectados
> - Deploy pendiente (Render backend + Vercel frontend)

---

## 1. Objetivo

Reemplazar toda la integración con Stripe por Mercado Pago (API de suscripciones `preapproval`), manteniendo:

- Los mismos planes (`free`, `pro`, `enterprise`) y periodos (mensual, anual).
- Los mismos endpoints URL del backend (salvo renombrar `/billing/portal` → `/billing/cancel`).
- El mismo flujo UX: usuario hace click en "Upgrade" → se redirecciona a checkout → vuelve a la app → plan actualizado vía webhook.
- Test coverage equivalente.
- Gating de endpoints premium (`/graph/3d`, `/export`) sin cambios.

## 2. Modelo conceptual: Stripe → Mercado Pago

| Concepto Stripe | Equivalente MP | Notas |
|---|---|---|
| `Product` + `Price` | `preapproval_plan` | Plantilla que define monto + frecuencia. Crear una por plan. |
| `Customer` | (no existe) | MP identifica al suscriptor por email. |
| `Subscription` | `preapproval` | Suscripción individual ligada a un plan y un email. |
| `Checkout Session` | `init_point` del preapproval | URL a la que redirigimos al usuario. |
| `Customer Portal` | (no existe) | Construir endpoint propio `/billing/cancel`. |
| `Webhook events` | MP Notifications | Topics: `subscription_preapproval`, `subscription_authorized_payment`. |
| `STRIPE_PRICE_*` | `MP_PLAN_*` | 4 plan IDs igual que antes. |
| `stripe_customer_id` (DB) | `mp_customer_email` + `mp_subscription_id` | Dos columnas. |
| Signature verification | HMAC-SHA256 con `x-signature` header y `x-request-id` | Diferente formato (ver abajo). |

## 3. Credenciales Mercado Pago necesarias

Obtener desde https://www.mercadopago.com.co/developers/panel/applications (crear aplicación).

**Modo Pruebas:**
- `MP_ACCESS_TOKEN` (formato `TEST-...`)
- `MP_PUBLIC_KEY` (formato `TEST-...-...`, opcional, solo para frontend si se integra brick checkout)
- `MP_WEBHOOK_SECRET` (se genera al crear el webhook después del deploy)

**Modo Producción:** análogos pero con prefijo `APP_USR-...`.

## 4. Planes a crear en Mercado Pago

Precios acordados en COP:

| Plan | Monto | Frecuencia | Env var del plan_id resultante |
|---|---|---|---|
| Pro Mensual | $30.000 COP | 1 mes | `MP_PLAN_PRO_MONTHLY` |
| Pro Anual | $300.000 COP | 12 meses | `MP_PLAN_PRO_ANNUAL` |
| Enterprise Mensual | $100.000 COP | 1 mes | `MP_PLAN_ENTERPRISE_MONTHLY` |
| Enterprise Anual | $1.000.000 COP | 12 meses | `MP_PLAN_ENTERPRISE_ANNUAL` |

Crear vía API (recomendado, guarda los IDs):

```bash
curl -X POST 'https://api.mercadopago.com/preapproval_plan' \
  -H 'Authorization: Bearer TEST-XXX' \
  -H 'Content-Type: application/json' \
  -d '{
    "reason": "CalcIng Pro - Mensual",
    "auto_recurring": {
      "frequency": 1,
      "frequency_type": "months",
      "transaction_amount": 30000,
      "currency_id": "COP"
    },
    "payment_methods_allowed": {
      "payment_types": [{"id": "credit_card"}, {"id": "debit_card"}],
      "payment_methods": []
    },
    "back_url": "https://calcing.vercel.app/precios"
  }'
```

Repetir 4 veces variando `reason`, `frequency`/`frequency_type` y `transaction_amount`.

**NOTA:** el campo `back_url` es obligatorio y debe ser HTTPS. En dev puede apuntar a `https://calcing.vercel.app/precios` aunque el backend esté en localhost.

## 5. Archivos a modificar

### Backend (`services/math-engine/`)

| Archivo | Acción | Notas |
|---|---|---|
| `requirements.txt` | Modificar | Quitar `stripe==12.1.0`, añadir `mercadopago==2.3.0` (o versión estable) |
| `core/config.py` | Modificar | Reemplazar variables `STRIPE_*` por `MP_*`; actualizar validador de producción |
| `core/stripe_client.py` | **Borrar** | Reemplazado por `mercadopago_client.py` |
| `core/mercadopago_client.py` | **Crear** | Wrapper del SDK oficial `mercadopago` |
| `routers/billing.py` | Reescribir | Endpoints checkout / status / cancel / webhook |
| `db/models.py` | Modificar | Renombrar `stripe_customer_id` → `mp_customer_email`; añadir `mp_subscription_id` |
| `alembic/versions/XXXXXX_migrate_stripe_to_mercadopago.py` | **Crear** | Nueva migración Alembic |
| `tests/test_billing.py` | Reescribir | Mocks del SDK de MP en vez de Stripe |
| `tests/test_config.py` / `tests/test_ci_config.py` | Ajustar | Cambiar referencias a variables |

### Frontend (`frontend/`)

| Archivo | Acción | Notas |
|---|---|---|
| `src/services/billingService.ts` | Modificar | Renombrar `openCustomerPortal` → `cancelSubscription`; mismo shape de respuesta |
| `src/components/PreciosView/PreciosView.tsx` | Modificar | Actualizar botones/flujo para usar `cancelSubscription` |
| `.env.example` | Modificar | Cambiar `VITE_STRIPE_PRICE_*` → `VITE_MP_PLAN_*` |
| `.env` | Modificar | Ídem (archivo local, no committeable) |

### Documentación

| Archivo | Acción |
|---|---|
| `README.md` | Actualizar sección "Variables de entorno" + stack |
| `STATUS.md` | Actualizar "Auth y planes" + endpoints |
| `DESICIONS.md` | Añadir DECISION-00X: migración a Mercado Pago |

## 6. Detalle del schema de DB

### Modelo actual (`db/models.py` líneas 22):
```python
stripe_customer_id: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
```

### Modelo nuevo:
```python
mp_customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
mp_subscription_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
```

### Migración Alembic

```python
"""migrate_stripe_to_mercadopago

Revision ID: d8e4c1a9b7f3
Revises: c7d9e3f4a5b8
"""
from alembic import op
import sqlalchemy as sa

revision = "d8e4c1a9b7f3"
down_revision = "c7d9e3f4a5b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mp_customer_email", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("mp_subscription_id", sa.String(100), nullable=True))
    op.create_index("ix_users_mp_customer_email", "users", ["mp_customer_email"])
    op.create_unique_constraint("uq_users_mp_subscription_id", "users", ["mp_subscription_id"])
    # Mantener stripe_customer_id durante transición. Borrarlo en una segunda migración
    # después de validar que nadie la usa. Para una DB nueva (caso actual): drop directamente.
    op.drop_column("users", "stripe_customer_id")


def downgrade() -> None:
    op.add_column("users", sa.Column("stripe_customer_id", sa.Text, nullable=True))
    op.create_unique_constraint("uq_users_stripe_customer_id", "users", ["stripe_customer_id"])
    op.drop_constraint("uq_users_mp_subscription_id", "users", type_="unique")
    op.drop_index("ix_users_mp_customer_email", table_name="users")
    op.drop_column("users", "mp_subscription_id")
    op.drop_column("users", "mp_customer_email")
```

## 7. API Mercado Pago — referencia rápida

### Crear suscripción (cuando usuario hace checkout)

```python
import mercadopago
sdk = mercadopago.SDK(access_token)

response = sdk.preapproval().create({
    "preapproval_plan_id": plan_id,  # uno de los 4 creados
    "payer_email": user.email,
    "back_url": "https://calcing.vercel.app/checkout/success",
    "external_reference": str(user.id),  # UUID del user; viene de vuelta en webhooks
    "reason": "Suscripción CalcIng Pro Mensual",  # opcional
    "status": "pending"  # obligatorio en 2024+; el user lo autoriza al visitar init_point
})

# response["response"] contiene:
# {
#   "id": "2c938084...",           ← mp_subscription_id
#   "init_point": "https://www.mercadopago.com.co/subscriptions/checkout?...",
#   "status": "pending",
#   ...
# }
```

### Cancelar suscripción

```python
response = sdk.preapproval().update(subscription_id, {"status": "cancelled"})
```

### Consultar suscripción

```python
response = sdk.preapproval().get(subscription_id)
# response["response"]["status"] ∈ {"pending","authorized","paused","cancelled"}
# response["response"]["next_payment_date"]
```

### Webhook — formato de notificación

MP envía POST al endpoint configurado con body tipo:

```json
{
  "action": "updated",
  "api_version": "v1",
  "data": {"id": "2c938084..."},
  "date_created": "2025-01-15T10:00:00Z",
  "id": 12345,
  "live_mode": false,
  "type": "subscription_preapproval",
  "user_id": 123456789
}
```

Topics relevantes:
- `subscription_preapproval` — crear/actualizar/cancelar suscripción
- `subscription_authorized_payment` — pago recurrente procesado

### Validación del webhook (crítico)

MP firma con HMAC-SHA256. Headers:
- `x-signature`: contiene `ts=<timestamp>,v1=<hash>`
- `x-request-id`: id del request

Construcción del manifest para validar:
```
id:<data.id>;request-id:<x-request-id>;ts:<ts>;
```

Pseudo-código:
```python
import hmac, hashlib

def verify_mp_signature(secret: str, signature_header: str, request_id: str, data_id: str) -> bool:
    parts = dict(p.split("=") for p in signature_header.split(","))
    ts = parts["ts"]
    received_hash = parts["v1"]
    manifest = f"id:{data_id};request-id:{request_id};ts:{ts};"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, received_hash)
```

Docs oficiales: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks#bookmark_validar_el_origen_de_la_notificación

## 8. Diseño del backend — nuevo `routers/billing.py`

Pseudoestructura (manteniendo prefix `/billing`):

```python
@router.post("/create-checkout")  # crea preapproval, retorna init_point
@router.get("/status")             # sin cambios: retorna user.plan + expires
@router.post("/cancel")            # NUEVO: cancela user.mp_subscription_id
@router.post("/webhook")           # procesa notifications de MP
```

Lógica del webhook:
1. Validar firma con `MP_WEBHOOK_SECRET` (si falla → 400).
2. Si `type == "subscription_preapproval"`:
   - Fetch suscripción: `sdk.preapproval().get(data_id)`
   - Identificar user: `external_reference` contiene `user.id`
   - Según `status`:
     - `authorized` → `user.plan = <plan_from_plan_id>`, set `plan_expires_at` a `next_payment_date`
     - `cancelled` / `paused` → `user.plan = "free"`, `plan_expires_at = None`
   - Guardar `mp_subscription_id` en user si no lo tenía.
3. Si `type == "subscription_authorized_payment"`:
   - Solo refrescar `plan_expires_at`.
4. Retornar 200 OK.

**Importante: idempotencia.** MP puede enviar la misma notificación varias veces. Comprobar si el estado actual del user ya refleja el evento antes de escribir.

## 9. Diseño del frontend — cambios en `billingService.ts`

Diff conceptual:

```typescript
// Antes:
export async function openCustomerPortal(): Promise<PortalResult> {
  const res = await fetch(`${API_URL}/billing/portal`, { method: 'POST', headers: authHeaders() });
  return res.json();  // { url: "stripe portal url" }
}

// Después:
export interface CancelResult { status: "cancelled" | "error"; }

export async function cancelSubscription(): Promise<CancelResult> {
  const res = await fetch(`${API_URL}/billing/cancel`, { method: 'POST', headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
  return res.json();
}
```

En `PreciosView.tsx`: reemplazar el botón "Administrar facturación" (que abría portal de Stripe) por un botón "Cancelar suscripción" con confirmación modal. Después de cancelar con éxito, llamar a `getBillingStatus()` para refrescar.

Nota: MP no ofrece portal para cambiar método de pago o actualizar tarjeta. Si el pago falla, MP automáticamente notifica por email al usuario. Si queremos permitir cambio de tarjeta, el usuario debe cancelar y re-suscribirse.

## 10. Variables de entorno finales

### Backend `.env`:
```
# --- Mercado Pago (reemplaza Stripe) ---
MP_ACCESS_TOKEN=TEST-xxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxxxxxx
MP_PLAN_PRO_MONTHLY=2c938084-xxxxx
MP_PLAN_PRO_ANNUAL=2c938084-xxxxx
MP_PLAN_ENTERPRISE_MONTHLY=2c938084-xxxxx
MP_PLAN_ENTERPRISE_ANNUAL=2c938084-xxxxx
```

### Frontend `.env`:
```
VITE_MP_PLAN_PRO_MONTHLY=2c938084-xxxxx
VITE_MP_PLAN_PRO_ANNUAL=2c938084-xxxxx
VITE_MP_PLAN_ENTERPRISE_MONTHLY=2c938084-xxxxx
VITE_MP_PLAN_ENTERPRISE_ANNUAL=2c938084-xxxxx
```

(El `MP_PUBLIC_KEY` solo se necesita si se integra el SDK JS de MP para checkout embebido. Para el flujo de `init_point` redirect NO hace falta.)

## 11. Validador de producción en `core/config.py`

Actualizar el `@model_validator` para exigir:
```python
MP_ACCESS_TOKEN
MP_WEBHOOK_SECRET
MP_PLAN_PRO_MONTHLY
MP_PLAN_PRO_ANNUAL
MP_PLAN_ENTERPRISE_MONTHLY
MP_PLAN_ENTERPRISE_ANNUAL
```

En lugar de los antiguos `STRIPE_WEBHOOK_SECRET`.

## 12. Testing

### Tests backend a reescribir (`tests/test_billing.py`)

Reemplazar todos los mocks `patch("routers.billing.get_stripe")` por `patch("routers.billing.get_mp_sdk")` y mockear:
- `sdk.preapproval().create()` retorna un dict con `init_point` y `id`.
- `sdk.preapproval().update()` retorna OK.
- `sdk.preapproval().get()` retorna un dict con `status`, `next_payment_date`, `external_reference`.

Casos mínimos:
- `test_status_requires_auth` ✓ (sin cambios)
- `test_status_returns_plan` ✓
- `test_checkout_requires_auth`
- `test_checkout_creates_preapproval` (equivalente a test_checkout_creates_session)
- `test_checkout_rejects_unknown_plan_id`
- `test_cancel_requires_auth` (nuevo, reemplaza test_portal)
- `test_cancel_no_subscription` (nuevo)
- `test_cancel_success` (nuevo, mockeando update)
- `test_webhook_invalid_signature`
- `test_webhook_subscription_authorized_updates_plan` (nuevo)
- `test_webhook_subscription_cancelled_reverts_to_free` (nuevo)
- `test_webhook_idempotent` (nuevo)

### Tests frontend

Revisar si `src/services/billingService.test.ts` o tests de `PreciosView` existen y adaptar.

### Comandos de verificación

```powershell
# Backend
cd services/math-engine
pytest
pytest -k test_billing -v

# Frontend
cd frontend
npx vitest run
npx tsc --noEmit
```

Objetivo: mantener 991/991 frontend y 194/194 backend (o ajustar contadores si se añaden/quitan tests).

## 13. Orden de ejecución sugerido

Fase 1 — Setup (30 min)
1. Obtener credenciales MP (Access Token + generar Webhook Secret).
2. Crear los 4 preapproval_plan vía API y anotar los 4 plan_ids.
3. Actualizar `.env` local con las variables MP.

Fase 2 — Backend (3-4 h)
4. Actualizar `requirements.txt` + `pip install -r requirements.txt`.
5. Actualizar `core/config.py` (quitar STRIPE_*, añadir MP_*, ajustar validador).
6. Crear `core/mercadopago_client.py`.
7. Crear migración Alembic + correr `alembic upgrade head` en Supabase.
8. Actualizar `db/models.py`.
9. Reescribir `routers/billing.py`.
10. Borrar `core/stripe_client.py`.

Fase 3 — Tests backend (2-3 h)
11. Reescribir `tests/test_billing.py`.
12. Actualizar `tests/test_config.py` y `tests/test_ci_config.py`.
13. `pytest` hasta verde.

Fase 4 — Frontend (1-2 h)
14. Modificar `src/services/billingService.ts`.
15. Modificar `src/components/PreciosView/PreciosView.tsx`.
16. Actualizar `.env.example` y `.env`.
17. `npx vitest run` + `npx tsc --noEmit` hasta verde.

Fase 5 — Documentación (30 min)
18. Actualizar `README.md`, `STATUS.md`, `DESICIONS.md`.

Fase 6 — Deploy (después)
19. Deploy backend en Render con env vars MP (dejar `MP_WEBHOOK_SECRET` vacío temporalmente).
20. Deploy frontend en Vercel.
21. Configurar webhook en panel de MP apuntando a `https://<render-url>/billing/webhook`, topics `subscription_preapproval` y `subscription_authorized_payment`.
22. Copiar el `MP_WEBHOOK_SECRET` generado, pegarlo en env de Render, redeploy.
23. Probar end-to-end con tarjeta de prueba de MP.

## 14. Tarjetas de prueba Mercado Pago (modo test)

- Mastercard: `5031 4332 1540 6351`, CVV `123`, fecha `11/30`, titular `APRO` (aprobado)
- Visa: `4509 9535 6623 3704`, CVV `123`, fecha `11/30`, titular `APRO`
- Titular `OTHE` → pago rechazado
- Titular `CONT` → pago pendiente

Docs: https://www.mercadopago.com.co/developers/es/docs/checkout-api/additional-content/your-integrations/test/cards

## 15. Gotchas conocidos

1. **PreApproval en modo pending:** al crear el preapproval hay que pasarlo con `status: "pending"` y redirigir al `init_point`. Si lo creas con `authorized` directamente, requiere `card_token_id` (checkout transparente, más complejo). El flujo recomendado es `pending` + redirect.

2. **`back_url` obligatorio:** debe ser HTTPS. Para dev local, usa la URL de Vercel ya deployada o ngrok.

3. **Currency:** solo `COP` para Mercado Pago Colombia. No mezcles con USD.

4. **Amounts sin decimales en COP:** montos son enteros (`30000` no `30000.00`), COP no usa centavos.

5. **No Customer Portal:** MP no tiene equivalente al Stripe Customer Portal. Hay que construir UI propia para cancelar.

6. **Webhooks duplicados:** MP reenvía notificaciones si no recibe 200 en 22 segundos. Implementar idempotencia (comparar estado actual antes de escribir).

7. **Firma del webhook:** el formato del manifest es específico y estricto. Probarlo con el simulador de webhooks del panel de MP antes de ir a producción.

8. **Test mode:** en modo pruebas, las notificaciones de webhook SÍ se envían (vs Stripe test donde hay que usar Stripe CLI para forwarding). Esto facilita el testing pero requiere URL pública (usar ngrok en dev).

## 16. Archivos de referencia en el repo (snapshots actuales con Stripe)

Para que el agente de otra sesión pueda comparar:

- `services/math-engine/routers/billing.py` — 295 líneas, implementación Stripe completa
- `services/math-engine/core/stripe_client.py` — 13 líneas
- `services/math-engine/core/config.py` — líneas 55-87: configuración Stripe + validador prod
- `services/math-engine/db/models.py` — líneas 11-36: modelo User con `stripe_customer_id`
- `services/math-engine/tests/test_billing.py` — 179 líneas, 7 tests
- `frontend/src/services/billingService.ts` — 60 líneas
- `services/math-engine/alembic/versions/` — 5 migraciones previas, la última (`c7d9e3f4a5b8`) añadió `support_tickets`

## 17. Criterios de aceptación

La migración se considera completa cuando:

- [ ] `pytest` backend: verde (194+ tests o equivalente)
- [ ] `vitest run` frontend: verde (991+ tests)
- [ ] `tsc --noEmit`: limpio
- [ ] `alembic upgrade head` aplica limpiamente la nueva migración
- [ ] No quedan referencias a `stripe` en el código (grep: `grep -ri "stripe" services/math-engine/ --exclude-dir=venv --exclude-dir=__pycache__` debe estar vacío, excepto quizá comentarios en DESICIONS.md)
- [ ] El flujo manual funciona end-to-end en sandbox de MP: registrar user → upgrade → pagar con tarjeta test → plan queda como `pro` en DB → cancelar → vuelve a `free`

---

**Fin del documento.** Copia todo esto al nuevo chat junto con el repo abierto y podrá continuar sin contexto perdido.
