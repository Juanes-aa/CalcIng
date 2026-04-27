"""
routers/math.py — Endpoints matemáticos de CalcIng Math Engine.
"""

import asyncio
import logging
import uuid as uuid_module
from concurrent.futures import ProcessPoolExecutor

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sympy import SympifyError

log = logging.getLogger("calcing.math")

import core.cache as _cache
from core.auth_deps import optional_auth, get_plan_from_token
from core.config import settings
from core.limiter import limiter
from db.database import get_db
from db.models import Problem
from models.schemas import (
    DifferentiateRequest,
    DifferentiateResponse,
    EvaluateRequest,
    EvaluateResponse,
    ExpandRequest,
    ExpandResponse,
    FactorRequest,
    FactorResponse,
    IntegrateRequest,
    IntegrateResponse,
    SimplifyRequest,
    SimplifyResponse,
    SolveEquationRequest,
    SolveEquationResponse,
    SolveRequest,
    SolveResponse,
)

router = APIRouter()

TIMEOUT_SECONDS = 10
_executor = ProcessPoolExecutor(max_workers=settings.MAX_WORKERS)

# Blacklist extendida: cubre vectores conocidos de RCE en sympify/parse_expr
# (lambdas, acceso a clases internas, builtins peligrosos, atributos mágicos).
# Esto se suma a la whitelist de caracteres en models/schemas.py.
_FORBIDDEN_TOKENS: tuple[str, ...] = (
    "import", "exec", "eval", "open", "os.", "sys.", "__",
    "lambda", "Lambda", "class", "def ",
    "getattr", "setattr", "delattr", "globals", "locals", "vars",
    "compile", "input", "breakpoint", "help",
    "subprocess", "system", "popen", "getenv",
    "file", "object", "type(", "super",
)


def _sanitize(expression: str) -> str:
    """Sanitización defensiva: rechaza tokens peligrosos y AST profundo.

    Capa 1 (schemas.py): regex whitelist de caracteres.
    Capa 2 (aquí): blacklist de identificadores que podrían abusar de sympify/parse_expr.
    Capa 3 (aquí): límite de tamaño de AST para prevenir DoS por expansión.
    """
    lowered = expression.lower()
    for token in _FORBIDDEN_TOKENS:
        if token in lowered:
            raise HTTPException(
                status_code=400,
                detail="Expresión no permitida",
            )
    # Validación de profundidad AST — máx. 100 nodos
    try:
        from sympy import preorder_traversal
        from sympy.parsing.sympy_parser import parse_expr
        parsed = parse_expr(expression, evaluate=False)
        node_count = sum(1 for _ in preorder_traversal(parsed))
        if node_count > 100:
            raise HTTPException(
                status_code=400,
                detail=f"Expresión demasiado compleja: {node_count} nodos (máx. 100)",
            )
    except HTTPException:
        raise
    except Exception:
        # Si parse_expr falla aquí, el error real vendrá al ejecutar la operación.
        # No propagamos detalles internos del parser al cliente.
        pass
    return expression.strip()


def _sympy_solve(expr_str: str) -> str:
    from sympy import sympify

    expr = sympify(expr_str)
    return str(expr)


def _sympy_differentiate(expr_str: str, var_str: str, order: int) -> str:
    from sympy import diff, symbols, sympify

    x = symbols(var_str)
    expr = sympify(expr_str)
    result = diff(expr, x, order)
    return str(result)


def _sympy_integrate(expr_str: str, var_str: str) -> str:
    from sympy import integrate, symbols, sympify

    x = symbols(var_str)
    expr = sympify(expr_str)
    result = integrate(expr, x)
    return str(result)


def _sympy_solve_equation(expr_str: str, var_str: str) -> list:
    from sympy import solve, symbols, sympify

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


def _sympy_simplify(expr_str: str) -> str:
    from sympy import simplify, sympify

    expr = sympify(expr_str)
    result = simplify(expr)
    return str(result)


def _sympy_expand(expr_str: str) -> str:
    from sympy import expand, sympify

    expr = sympify(expr_str)
    result = expand(expr)
    return str(result)


def _sympy_factor(expr_str: str) -> str:
    from sympy import factor, sympify

    expr = sympify(expr_str)
    result = factor(expr)
    return str(result)


# --- Endpoints ---


@router.get("/health")
@limiter.exempt
async def health() -> dict:
    return {"status": "ok", "version": "1.0.0"}


@router.post("/solve", response_model=SolveResponse)
@limiter.limit("30/minute")
async def solve_expression(
    request: Request,
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
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("solve failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

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
@limiter.limit("30/minute")
async def differentiate(
    request: Request,
    req: DifferentiateRequest,
    plan: str = Depends(get_plan_from_token),
) -> DifferentiateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    cache_key = _cache.make_cache_key("differentiate", expr_str, var_str, req.order)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        cached_steps = cached["steps"]
        cached_level = "beginner" if plan == "free" else cached.get("level", req.level)
        if plan == "free":
            cached_steps = cached_steps[:3]
        return DifferentiateResponse(
            result=cached["result"],
            steps=cached_steps,
            level=cached_level,
        )

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _sympy_differentiate,
                expr_str,
                var_str,
                req.order,
            ),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("differentiate failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    steps = [f"d/d{var_str}({expr_str}) orden {req.order} = {result}"]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"result": result, "steps": steps},
    )

    # Gate aplicado DESPUÉS del cache, solo al retornar
    if plan == "free":
        steps = steps[:3]
        level_out = "beginner"
    else:
        level_out = req.level

    return DifferentiateResponse(result=result, steps=steps, level=level_out)


@router.post("/integrate", response_model=IntegrateResponse)
@limiter.limit("30/minute")
async def integrate_expression(
    request: Request,
    req: IntegrateRequest,
    plan: str = Depends(get_plan_from_token),
) -> IntegrateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    cache_key = _cache.make_cache_key("integrate", expr_str, var_str)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        cached_steps = cached["steps"]
        cached_level = "beginner" if plan == "free" else cached.get("level", req.level)
        if plan == "free":
            cached_steps = cached_steps[:3]
        return IntegrateResponse(
            result=cached["result"],
            steps=cached_steps,
            level=cached_level,
        )

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _sympy_integrate,
                expr_str,
                var_str,
            ),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("integrate failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    steps = [f"∫({expr_str})d{var_str} = {result} + C"]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"result": result, "steps": steps},
    )

    # Gate aplicado DESPUÉS del cache, solo al retornar
    if plan == "free":
        steps = steps[:3]
        level_out = "beginner"
    else:
        level_out = req.level

    return IntegrateResponse(result=result, steps=steps, level=level_out)


@router.post("/solve-equation", response_model=SolveEquationResponse)
@limiter.limit("30/minute")
async def solve_equation(
    request: Request,
    req: SolveEquationRequest,
    plan: str = Depends(get_plan_from_token),
) -> SolveEquationResponse:
    expr_str = _sanitize(req.equation)
    var_str = _sanitize(req.variable)

    cache_key = _cache.make_cache_key("solve-equation", expr_str, var_str)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        return SolveEquationResponse(**cached)

    loop = asyncio.get_event_loop()
    try:
        solutions = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _sympy_solve_equation,
                expr_str,
                var_str,
            ),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("solve_equation failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Ecuación inválida")

    steps = [f"Resolviendo {expr_str} = 0 para {var_str}"]

    # Gate: free recibe máximo 3 steps
    if plan == "free":
        steps = steps[:3]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"solutions": solutions, "steps": steps},
    )

    return SolveEquationResponse(solutions=solutions, steps=steps)


@router.post("/evaluate", response_model=EvaluateResponse)
@limiter.limit("30/minute")
async def evaluate(
    request: Request,
    req: EvaluateRequest,
) -> EvaluateResponse:
    expr_str = _sanitize(req.expression)
    var_str = _sanitize(req.variable)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(
                _executor,
                _sympy_evaluate,
                expr_str,
                var_str,
                req.value,
            ),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("evaluate failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    return EvaluateResponse(result=result)


@router.post("/simplify", response_model=SimplifyResponse)
@limiter.limit("30/minute")
async def simplify_expression(
    request: Request,
    req: SimplifyRequest,
    plan: str = Depends(get_plan_from_token),
) -> SimplifyResponse:
    expr_str = _sanitize(req.expression)

    cache_key = _cache.make_cache_key("simplify", expr_str)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        cached_steps = cached["steps"]
        if plan == "free":
            cached_steps = cached_steps[:3]
        return SimplifyResponse(result=cached["result"], steps=cached_steps)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_simplify, expr_str),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("simplify failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    steps = [f"simplify({expr_str}) = {result}"]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"result": result, "steps": steps},
    )

    if plan == "free":
        steps = steps[:3]

    return SimplifyResponse(result=result, steps=steps)


@router.post("/expand", response_model=ExpandResponse)
@limiter.limit("30/minute")
async def expand_expression(
    request: Request,
    req: ExpandRequest,
    plan: str = Depends(get_plan_from_token),
) -> ExpandResponse:
    expr_str = _sanitize(req.expression)

    cache_key = _cache.make_cache_key("expand", expr_str)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        cached_steps = cached["steps"]
        if plan == "free":
            cached_steps = cached_steps[:3]
        return ExpandResponse(result=cached["result"], steps=cached_steps)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_expand, expr_str),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("expand failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    steps = [f"expand({expr_str}) = {result}"]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"result": result, "steps": steps},
    )

    if plan == "free":
        steps = steps[:3]

    return ExpandResponse(result=result, steps=steps)


@router.post("/factor", response_model=FactorResponse)
@limiter.limit("30/minute")
async def factor_expression(
    request: Request,
    req: FactorRequest,
    plan: str = Depends(get_plan_from_token),
) -> FactorResponse:
    expr_str = _sanitize(req.expression)

    cache_key = _cache.make_cache_key("factor", expr_str)
    cached = await _cache.get_cached(_cache.get_redis_client(), cache_key)
    if cached is not None:
        cached_steps = cached["steps"]
        if plan == "free":
            cached_steps = cached_steps[:3]
        return FactorResponse(result=cached["result"], steps=cached_steps)

    loop = asyncio.get_event_loop()
    try:
        result = await asyncio.wait_for(
            loop.run_in_executor(_executor, _sympy_factor, expr_str),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de operación excedido")
    except (SympifyError, Exception) as e:
        log.warning("factor failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    steps = [f"factor({expr_str}) = {result}"]

    await _cache.set_cached(
        _cache.get_redis_client(),
        cache_key,
        {"result": result, "steps": steps},
    )

    if plan == "free":
        steps = steps[:3]

    return FactorResponse(result=result, steps=steps)