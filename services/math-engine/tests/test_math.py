import pytest
from httpx import AsyncClient, ASGITransport
from httpx._transports.asgi import ASGITransport


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    from main import app
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# --- HEALTH ---

@pytest.mark.anyio
async def test_health_returns_200(client):
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_returns_status_ok(client):
    response = await client.get("/health")
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.anyio
async def test_health_returns_version(client):
    response = await client.get("/health")
    data = response.json()
    assert "version" in data


# --- DIFFERENTIATE ---

@pytest.mark.anyio
async def test_differentiate_sin_x(client):
    response = await client.post("/differentiate", json={
        "expression": "sin(x)",
        "variable": "x",
        "order": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "cos(x)"


@pytest.mark.anyio
async def test_differentiate_x_squared(client):
    response = await client.post("/differentiate", json={
        "expression": "x**2",
        "variable": "x",
        "order": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "2*x"


@pytest.mark.anyio
async def test_differentiate_second_order(client):
    response = await client.post("/differentiate", json={
        "expression": "x**3",
        "variable": "x",
        "order": 2
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "6*x"


@pytest.mark.anyio
async def test_differentiate_returns_steps(client):
    response = await client.post("/differentiate", json={
        "expression": "x**2",
        "variable": "x",
        "order": 1
    })
    data = response.json()
    assert "steps" in data
    assert isinstance(data["steps"], list)


# --- INTEGRATE ---

@pytest.mark.anyio
async def test_integrate_x_squared(client):
    response = await client.post("/integrate", json={
        "expression": "x**2",
        "variable": "x"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "x**3/3"


@pytest.mark.anyio
async def test_integrate_sin_x(client):
    response = await client.post("/integrate", json={
        "expression": "sin(x)",
        "variable": "x"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "-cos(x)"


@pytest.mark.anyio
async def test_integrate_returns_steps(client):
    response = await client.post("/integrate", json={
        "expression": "x**2",
        "variable": "x"
    })
    data = response.json()
    assert "steps" in data
    assert isinstance(data["steps"], list)


# --- SOLVE EQUATION ---

@pytest.mark.anyio
async def test_solve_equation_quadratic(client):
    response = await client.post("/solve-equation", json={
        "equation": "x**2 - 5*x + 6",
        "variable": "x"
    })
    assert response.status_code == 200
    data = response.json()
    assert sorted(data["solutions"]) == [2, 3]


@pytest.mark.anyio
async def test_solve_equation_linear(client):
    response = await client.post("/solve-equation", json={
        "equation": "2*x - 4",
        "variable": "x"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["solutions"] == [2]


@pytest.mark.anyio
async def test_solve_equation_returns_steps(client):
    response = await client.post("/solve-equation", json={
        "equation": "x**2 - 5*x + 6",
        "variable": "x"
    })
    data = response.json()
    assert "steps" in data
    assert isinstance(data["steps"], list)


# --- EVALUATE ---

@pytest.mark.anyio
async def test_evaluate_x_squared_at_3(client):
    response = await client.post("/evaluate", json={
        "expression": "x**2",
        "variable": "x",
        "value": 3
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == 9


@pytest.mark.anyio
async def test_evaluate_sin_at_0(client):
    response = await client.post("/evaluate", json={
        "expression": "sin(x)",
        "variable": "x",
        "value": 0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == 0


# --- SOLVE (evaluación simple) ---

@pytest.mark.anyio
async def test_solve_basic_expression(client):
    response = await client.post("/solve", json={
        "expression": "2 + 2",
        "options": {}
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "4"


@pytest.mark.anyio
async def test_solve_returns_metadata(client):
    response = await client.post("/solve", json={
        "expression": "2 + 2",
        "options": {}
    })
    data = response.json()
    assert "metadata" in data


# --- TIMEOUT ---

@pytest.mark.anyio
async def test_timeout_returns_408(client):
    response = await client.post("/solve", json={
        "expression": "__timeout_test__",
        "options": {"force_timeout": True}
    })
    assert response.status_code == 408


# --- PROCESSPOOLEXECUTOR ---

@pytest.mark.anyio
async def test_heavy_computation_respects_timeout(client):
    """
    Una expresión que fuerza un cálculo real y pesado de SymPy
    debe retornar 408 dentro del tiempo límite definido,
    no bloquear el event loop indefinidamente.
    Este test FALLARÁ hasta que ProcessPoolExecutor esté implementado.
    """
    import asyncio
    import time

    start = time.monotonic()
    response = await client.post("/solve", json={
        "expression": "__timeout_test__",
        "options": {"force_timeout": True}
    })
    elapsed = time.monotonic() - start

    assert response.status_code == 408
    # El timeout debe resolverse en menos de 12 segundos.
    # Sin ProcessPoolExecutor, el event loop se bloquea y este assert falla
    # porque asyncio.wait_for no puede cancelar trabajo síncrono.
    assert elapsed < 12.0, (
        f"El timeout tardó {elapsed:.1f}s — el event loop está bloqueado. "
        f"asyncio.wait_for no interrumpe SymPy síncrono. Se requiere ProcessPoolExecutor."
    )


@pytest.mark.anyio
async def test_event_loop_not_blocked_during_computation(client):
    """
    Mientras una operación pesada de SymPy se ejecuta,
    el endpoint /health debe responder sin demora.
    Si el event loop está bloqueado, /health no responde hasta que SymPy termina.
    Este test FALLARÁ hasta que ProcessPoolExecutor esté implementado.
    """
    import asyncio

    async def call_health(ac):
        return await ac.get("/health")

    async def call_heavy(ac):
        return await ac.post("/solve", json={
            "expression": "__timeout_test__",
            "options": {"force_timeout": True}
        })

    from main import app
    from httpx import AsyncClient, ASGITransport

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # Lanzar ambas llamadas concurrentemente
        heavy_task = asyncio.create_task(call_heavy(ac))
        # Dar 100ms para que la tarea pesada empiece
        await asyncio.sleep(0.1)
        
        import time
        start = time.monotonic()
        health_response = await call_health(ac)
        health_elapsed = time.monotonic() - start

        await heavy_task

    assert health_response.status_code == 200
    # /health debe responder en menos de 1 segundo aunque haya cómputo pesado.
    # Sin ProcessPoolExecutor, este assert falla porque el event loop está ocupado.
    assert health_elapsed < 1.0, (
        f"/health tardó {health_elapsed:.2f}s — el event loop está bloqueado por SymPy. "
        f"Se requiere ProcessPoolExecutor para liberar el event loop."
    )


@pytest.mark.anyio
async def test_differentiate_executes_in_separate_process(client):
    """
    Las operaciones de SymPy deben ejecutarse en un proceso separado,
    no en el event loop principal. Verificamos que /differentiate
    sigue retornando resultado correcto cuando se usa ProcessPoolExecutor.
    Este test FALLARÁ si ProcessPoolExecutor no está implementado
    o si rompe la funcionalidad existente.
    """
    response = await client.post("/differentiate", json={
        "expression": "sin(x)",
        "variable": "x",
        "order": 1
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "cos(x)"
    # Este campo confirma que la ejecución fue en proceso separado
    assert data.get("execution_mode") == "process_pool", (
        "El campo 'execution_mode' debe ser 'process_pool' cuando "
        "ProcessPoolExecutor está activo. Si el campo no existe, "
        "ProcessPoolExecutor no está implementado."
    )


@pytest.mark.anyio
async def test_integrate_executes_in_separate_process(client):
    """
    Igual que el anterior pero para /integrate.
    """
    response = await client.post("/integrate", json={
        "expression": "x**2",
        "variable": "x"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "x**3/3"
    assert data.get("execution_mode") == "process_pool", (
        "El campo 'execution_mode' debe ser 'process_pool' cuando "
        "ProcessPoolExecutor está activo."
    )