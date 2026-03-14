import asyncio
from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sympy import symbols, diff, integrate, solve, sympify
from sympy import SympifyError
from models.schemas import (
    SolveRequest, SolveResponse,
    DifferentiateRequest, DifferentiateResponse,
    IntegrateRequest, IntegrateResponse,
    SolveEquationRequest, SolveEquationResponse,
    EvaluateRequest, EvaluateResponse,
)
from core.auth_deps import optional_auth
from core.config import settings
import core.cache as _cache
from db.database import get_db
from db.models import Problem
import uuid as uuid_module

router = APIRouter()

TIMEOUT_SECONDS = 10
_executor = ProcessPoolExecutor(max_workers=settings.MAX_WORKERS)


def _sanitize(expression: str) -> str:
    """Sanitización básica: rechaza tokens peligrosos."""
    forbidden = ["import", "exec", "eval", "open", "os.", "sys.", "__"]
    for token in forbidden:
        if token in expression:
            raise HTTPException(
                status_code=400,
                detail=f"Expresión no permitida: contiene '{token}'"
            )
    return expression.strip()


# --- Funciones puras para ejecutar en proceso separado ---
# IMPORTANTE: deben ser funciones de módulo (no lambdas ni métodos),
# porque ProcessPoolExecutor usa pickle para serializarlas.

def _sympy_solve(expr_str: str) -> str:
    from sympy import sympify
    expr = sympify(expr_str)
    return str(expr)


def _sympy_differentiate(expr_str: str, var_str: str, order: int) -> str:
    from sympy import symbols, diff, sympify
    x = symbols(var_str)
    expr = sympify(expr_str)
    result = diff(expr, x, order)
    return str(result)


def _sympy_integrate(expr_str: str, var_str: str) -> str:
    from sympy import symbols, integrate, sympify
    x = symbols(var_str)
    expr = sympify(expr_str)
    result = integrate(expr, x)
    return str(result)


def _sympy_solve_equation(expr_str: str, var_str: str) -> list:
    from sympy import symbols, solve, sympify
    x = symbols(var_str)
    expr = sympify(expr_str)
    solutions = solve(expr, x)
    return [float(s) if s.is_real else str(s) for s in solutions]


def _sympy_evaluate(expr_str: str, var_str: str, value: float) -> float:
    from sympy import symbols, sympify
    x = symbols(var_str)
    expr = sympify(expr_str)
    result = expr.subs(x, value)
    return float(result)


# --- Endpoints ---

@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}


@router.post("/solve", response_model=SolveResponse)
async def solve_expression(
    req: SolveRequest,
    user_id: str | None = Depends(optional_auth),
    db: AsyncSession = Depends(get_db),
) -> SolveResponse:
    if req.options.get("force_timeout"):
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")

    expr_str = _sanitize(req.expression)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_solve, expr_str),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if user_id:
        problem = Problem(
            user_id=uuid_module.UUID(user_id),
            expression=req.expression,
            result=str(result),
            type="solve",
        )
        db.add(problem)
        await db.commit()

    return SolveResponse(result=result, metadata={"expression": expr_str})


@router.post("/differentiate", response_model=DifferentiateResponse)
async def differentiate(req: DifferentiateRequest) -> DifferentiateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    # 1. Consultar caché
    cache_key = _cache.make_cache_key("differentiate", expr_str, var_str, req.order)
    cached = await _cache.get_cached(_cache.redis_client, cache_key)
    if cached is not None:
        return DifferentiateResponse(**cached)

    # 2. Calcular
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_differentiate, expr_str, var_str, req.order),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))

    steps = [f"d/d{var_str}({expr_str}) orden {req.order} = {result}"]

    # 3. Poblar caché
    await _cache.set_cached(_cache.redis_client, cache_key, {"result": result, "steps": steps})

    return DifferentiateResponse(result=result, steps=steps)


@router.post("/integrate", response_model=IntegrateResponse)
async def integrate_expression(req: IntegrateRequest) -> IntegrateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    # 1. Consultar caché
    cache_key = _cache.make_cache_key("integrate", expr_str, var_str)
    cached = await _cache.get_cached(_cache.redis_client, cache_key)
    if cached is not None:
        return IntegrateResponse(**cached)

    # 2. Calcular
    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_integrate, expr_str, var_str),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))

    steps = [f"∫({expr_str})d{var_str} = {result} + C"]

    # 3. Poblar caché
    await _cache.set_cached(_cache.redis_client, cache_key, {"result": result, "steps": steps})

    return IntegrateResponse(result=result, steps=steps)


@router.post("/solve-equation", response_model=SolveEquationResponse)
async def solve_equation(req: SolveEquationRequest) -> SolveEquationResponse:
    expr_str = _sanitize(req.equation)
    var_str = _sanitize(req.variable)

    # 1. Consultar caché
    cache_key = _cache.make_cache_key("solve-equation", expr_str, var_str)
    cached = await _cache.get_cached(_cache.redis_client, cache_key)
    if cached is not None:
        return SolveEquationResponse(**cached)

    # 2. Calcular
    loop = asyncio.get_event_loop()
    try:
        solutions = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_solve_equation, expr_str, var_str),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))

    steps = [f"Resolviendo {expr_str} = 0 para {var_str}"]

    # 3. Poblar caché
    await _cache.set_cached(_cache.redis_client, cache_key, {"solutions": solutions, "steps": steps})

    return SolveEquationResponse(solutions=solutions, steps=steps)


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_evaluate, expr_str, var_str, req.value),
            timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        raise HTTPException(status_code=400, detail=str(e))

    return EvaluateResponse(result=result)