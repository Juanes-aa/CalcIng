from pydantic import BaseModel
from typing import Any


class SolveRequest(BaseModel):
    expression: str
    options: dict = {}


class SolveResponse(BaseModel):
    result: str
    steps: list[str] = []
    metadata: dict = {}


class DifferentiateRequest(BaseModel):
    expression: str
    variable: str
    order: int = 1


class DifferentiateResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"


class IntegrateRequest(BaseModel):
    expression: str
    variable: str


class IntegrateResponse(BaseModel):
    result: str
    steps: list[str] = []
    execution_mode: str = "process_pool"


class SolveEquationRequest(BaseModel):
    equation: str
    variable: str


class SolveEquationResponse(BaseModel):
    solutions: list[Any]
    steps: list[str] = []


class EvaluateRequest(BaseModel):
    expression: str
    variable: str
    value: float


class EvaluateResponse(BaseModel):
    result: Any