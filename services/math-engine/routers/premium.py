"""
routers/premium.py — Endpoints premium de CalcIng (graph 3D + export LaTeX/PNG).
"""
import asyncio
import base64
import io
import logging
from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from core.auth_deps import get_plan_from_token
from core.config import settings
from core.limiter import limiter
from routers.math import _sanitize  # reutiliza misma defensa que endpoints math
from models.schemas import (
    Graph3DRequest, Graph3DResponse,
    ExportRequest, ExportResponse,
)

log = logging.getLogger("calcing.premium")

router = APIRouter()

PREMIUM_PLANS = {"pro", "enterprise"}
TIMEOUT_SECONDS = 15
_executor = ProcessPoolExecutor(max_workers=max(1, settings.MAX_WORKERS // 2))


# ─── Helpers (run in separate process) ──────────────────────────────────────

def _render_3d_plot(expr_str: str, x_range: list[float], y_range: list[float], resolution: int) -> str:
    """Genera surface plot 3D y retorna PNG en base64."""
    import numpy as np
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from sympy import sympify, lambdify, symbols

    x, y = symbols("x y")
    expr = sympify(expr_str)
    f = lambdify((x, y), expr, modules=["numpy"])

    xs = np.linspace(x_range[0], x_range[1], resolution)
    ys = np.linspace(y_range[0], y_range[1], resolution)
    X, Y = np.meshgrid(xs, ys)
    Z = np.array(f(X, Y), dtype=float)

    fig = plt.figure(figsize=(8, 6), dpi=100)
    ax = fig.add_subplot(111, projection="3d")
    ax.plot_surface(X, Y, Z, cmap="viridis", alpha=0.85, edgecolor="none")
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_zlabel("z")
    ax.set_title(expr_str, fontsize=10)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", facecolor="#1e1e2e")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


def _render_latex(expr_str: str) -> str:
    """Retorna representación LaTeX de la expresión."""
    from sympy import sympify, latex
    expr = sympify(expr_str)
    return latex(expr)


def _render_latex_png(expr_str: str) -> str:
    """Renderiza LaTeX como imagen PNG y retorna base64."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from sympy import sympify, latex

    expr = sympify(expr_str)
    tex = latex(expr)

    fig, ax = plt.subplots(figsize=(6, 1.5), dpi=150)
    ax.axis("off")
    ax.text(0.5, 0.5, f"${tex}$", fontsize=22, ha="center", va="center",
            color="white", transform=ax.transAxes)
    fig.patch.set_facecolor("#1e1e2e")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", facecolor="#1e1e2e")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/graph/3d", response_model=Graph3DResponse)
@limiter.limit("10/minute")
async def graph_3d(
    request: Request,
    req: Graph3DRequest,
    plan: str = Depends(get_plan_from_token),
) -> Graph3DResponse:
    if plan not in PREMIUM_PLANS:
        raise HTTPException(
            status_code=402,
            detail={"message": "Plan premium requerido", "upgrade_url": "/pricing"},
        )

    expr_str = _sanitize(req.expression)

    loop = asyncio.get_event_loop()
    try:
        img_b64 = await asyncio.wait_for(
            loop.run_in_executor(
                _executor, _render_3d_plot,
                expr_str, req.x_range, req.y_range, req.resolution,
            ),
            timeout=TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de renderizado excedido")
    except Exception as e:
        log.warning("graph_3d failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")

    return Graph3DResponse(image_base64=img_b64)


@router.post("/export", response_model=ExportResponse)
@limiter.limit("20/minute")
async def export_content(
    request: Request,
    req: ExportRequest,
    plan: str = Depends(get_plan_from_token),
) -> ExportResponse:
    if plan not in PREMIUM_PLANS:
        raise HTTPException(
            status_code=402,
            detail={"message": "Plan premium requerido", "upgrade_url": "/pricing"},
        )

    expr_str = _sanitize(req.expression)

    loop = asyncio.get_event_loop()
    try:
        if req.format == "latex":
            content = await asyncio.wait_for(
                loop.run_in_executor(_executor, _render_latex, expr_str),
                timeout=TIMEOUT_SECONDS,
            )
            return ExportResponse(
                content=content,
                format="latex",
                content_type="text/x-latex",
            )
        else:
            img_b64 = await asyncio.wait_for(
                loop.run_in_executor(_executor, _render_latex_png, expr_str),
                timeout=TIMEOUT_SECONDS,
            )
            return ExportResponse(
                content=img_b64,
                format="png",
                content_type="image/png;base64",
            )
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=408, detail="Tiempo de exportación excedido")
    except Exception as e:
        log.warning("export failed: %s", e, exc_info=False)
        raise HTTPException(status_code=400, detail="Expresión inválida")