import re
from pydantic import BaseModel, field_validator
from typing import Any

_EXPRESSION_MAX_LEN = 1000
_EXPRESSION_PATTERN = re.compile(
    r'^[a-zA-Z0-9\s\+\-\*\/\^\(\)\.\,\=\_\|\<\>\!\&\%\{\}\[\]\\]+$'
)


def _validate_expr(v: str) -> str:
    if len(v) > _EXPRESSION_MAX_LEN:
        raise ValueError("La expresión no puede superar 1000 caracteres")
    if not _EXPRESSION_PATTERN.match(v):
        raise ValueError("La expresión contiene caracteres no permitidos")
    return v


class SolveRequest(BaseModel):
    expression: str
    options: dict = {}

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class SolveResponse(BaseModel):
    result: str
    steps: list[str] = []
    metadata: dict = {}


class DifferentiateRequest(BaseModel):
    expression: str
    variable: str
    order: int = 1
    level: str = "beginner"

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class DifferentiateResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"
    level: str = "beginner"


class IntegrateRequest(BaseModel):
    expression: str
    variable: str
    level: str = "beginner"

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class IntegrateResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"
    level: str = "beginner"


class SolveEquationRequest(BaseModel):
    equation: str
    variable: str

    @field_validator("equation")
    @classmethod
    def validate_equation(cls, v: str) -> str:
        if len(v) > _EXPRESSION_MAX_LEN:
            raise ValueError("La ecuación no puede superar 1000 caracteres")
        if not _EXPRESSION_PATTERN.match(v):
            raise ValueError("La ecuación contiene caracteres no permitidos")
        return v


class SolveEquationResponse(BaseModel):
    solutions: list[Any]
    steps: list[str] = []


class EvaluateRequest(BaseModel):
    expression: str
    variable: str
    value: float

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class EvaluateResponse(BaseModel):
    result: Any


class SimplifyRequest(BaseModel):
    expression: str

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class SimplifyResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"


class ExpandRequest(BaseModel):
    expression: str

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class ExpandResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"


class FactorRequest(BaseModel):
    expression: str

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)


class FactorResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"


# ── Premium: Graph 3D ───────────────────────────────────────────────────────

class Graph3DRequest(BaseModel):
    expression: str
    x_range: list[float] = [-5.0, 5.0]
    y_range: list[float] = [-5.0, 5.0]
    resolution: int = 50

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)

    @field_validator("resolution")
    @classmethod
    def validate_resolution(cls, v: int) -> int:
        if v < 10 or v > 200:
            raise ValueError("Resolution debe estar entre 10 y 200")
        return v


class Graph3DResponse(BaseModel):
    image_base64: str
    format: str = "png"


# ── Premium: Export ──────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    expression: str
    format: str = "latex"

    @field_validator("expression")
    @classmethod
    def validate_expression(cls, v: str) -> str:
        return _validate_expr(v)

    @field_validator("format")
    @classmethod
    def validate_format(cls, v: str) -> str:
        if v not in ("latex", "png"):
            raise ValueError("Format debe ser 'latex' o 'png'")
        return v


class ExportResponse(BaseModel):
    content: str
    format: str
    content_type: str