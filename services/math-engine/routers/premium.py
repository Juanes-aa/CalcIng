"""
routers/premium.py — Endpoints premium de CalcIng (stubs con gate de plan).
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from core.auth_deps import get_plan_from_token

router = APIRouter()


@router.post("/graph/3d")
async def graph_3d(
    request: Request,
    plan: str = Depends(get_plan_from_token),
) -> JSONResponse:
    if plan != "premium":
        return JSONResponse(
            status_code=402,
            content={"detail": "Plan premium requerido", "upgrade_url": "/pricing"},
        )
    return JSONResponse(
        status_code=501,
        content={"detail": "Graficador 3D en desarrollo"},
    )


@router.post("/export")
async def export_content(
    request: Request,
    plan: str = Depends(get_plan_from_token),
) -> JSONResponse:
    if plan != "premium":
        return JSONResponse(
            status_code=402,
            content={"detail": "Plan premium requerido", "upgrade_url": "/pricing"},
        )
    return JSONResponse(
        status_code=501,
        content={"detail": "Export en desarrollo"},
    )