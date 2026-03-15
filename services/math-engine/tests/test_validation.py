import pytest

# Expresión densa para tests de AST (>100 nodos en SymPy)
_DENSE_EXPR = "+".join([f"x**{i}" for i in range(1, 52)])


# ===========================================================================
# GRUPO 1: Longitud máxima de expresión (1000 caracteres)
# ===========================================================================

class TestExpressionLengthLimit:

    @pytest.mark.anyio
    async def test_expression_at_limit_is_accepted(self, test_app):
        """Expresión de exactamente 1000 chars es aceptada"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x" * 1000, "variable": "x", "order": 1},
        )
        assert response.status_code == 200

    @pytest.mark.anyio
    async def test_expression_over_limit_is_rejected(self, test_app):
        """Expresión de 1001 chars en /differentiate retorna 422"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x" * 1001, "variable": "x", "order": 1},
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_integrate_over_limit_is_rejected(self, test_app):
        """Expresión de 1001 chars en /integrate retorna 422"""
        response = await test_app.post(
            "/integrate",
            json={"expression": "x" * 1001, "variable": "x"},
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_solve_over_limit_is_rejected(self, test_app):
        """Expresión de 1001 chars en /solve retorna 422"""
        response = await test_app.post(
            "/solve",
            json={"expression": "x" * 1001},
        )
        assert response.status_code == 422

    @pytest.mark.anyio
    async def test_solve_equation_over_limit_is_rejected(self, test_app):
        """Expresión de 1001 chars en /solve-equation retorna 422"""
        response = await test_app.post(
            "/solve-equation",
            json={"equation": "x" * 1001, "variable": "x"},
        )
        assert response.status_code == 422


# ===========================================================================
# GRUPO 2: Whitelist de caracteres
# ===========================================================================

class TestCharacterWhitelist:

    @pytest.mark.anyio
    async def test_valid_expression_with_functions_accepted(self, test_app):
        """Expresión con funciones trigonométricas válidas es aceptada"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "sin(x) + cos(x)", "variable": "x", "order": 1},
        )
        assert response.status_code == 200

    @pytest.mark.anyio
    async def test_expression_with_forbidden_chars_rejected(self, test_app):
        """Expresión con '$' retorna 400 o 422"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x$2", "variable": "x", "order": 1},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.anyio
    async def test_expression_with_semicolon_rejected(self, test_app):
        """Expresión con ';' retorna 400 o 422"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x;drop table", "variable": "x", "order": 1},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.anyio
    async def test_expression_with_backtick_rejected(self, test_app):
        """Expresión con backtick retorna 400 o 422"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x`2", "variable": "x", "order": 1},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.anyio
    async def test_expression_with_hash_rejected(self, test_app):
        """Expresión con '#' retorna 400 o 422"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x#2", "variable": "x", "order": 1},
        )
        assert response.status_code in [400, 422]

    @pytest.mark.anyio
    async def test_valid_expression_with_operators_accepted(self, test_app):
        """Expresión con operadores aritméticos estándar es aceptada"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2 + 3*x - 1", "variable": "x", "order": 1},
        )
        assert response.status_code == 200

    @pytest.mark.anyio
    async def test_valid_expression_with_greek_notation_accepted(self, test_app):
        """Expresión con sqrt y log es aceptada en /solve"""
        response = await test_app.post(
            "/solve",
            json={"expression": "sqrt(x) + log(x)"},
        )
        assert response.status_code == 200


# ===========================================================================
# GRUPO 3: Profundidad AST (máx. 100 nodos)
# ===========================================================================

class TestASTDepthLimit:

    @pytest.mark.anyio
    async def test_simple_expression_under_ast_limit(self, test_app):
        """Expresión simple con pocos nodos AST es aceptada"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": "x**2 + 3*x", "variable": "x", "order": 1},
        )
        assert response.status_code == 200

    @pytest.mark.anyio
    async def test_deeply_nested_expression_rejected(self, test_app):
        """Expresión con >100 nodos AST en /differentiate retorna 400"""
        response = await test_app.post(
            "/differentiate",
            json={"expression": _DENSE_EXPR, "variable": "x", "order": 1},
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_ast_limit_applies_to_integrate(self, test_app):
        """Expresión con >100 nodos AST en /integrate retorna 400"""
        response = await test_app.post(
            "/integrate",
            json={"expression": _DENSE_EXPR, "variable": "x"},
        )
        assert response.status_code == 400

    @pytest.mark.anyio
    async def test_ast_limit_applies_to_solve_equation(self, test_app):
        """Expresión con >100 nodos AST en /solve-equation retorna 400"""
        response = await test_app.post(
            "/solve-equation",
            json={"equation": _DENSE_EXPR + "- 0", "variable": "x"},
        )
        assert response.status_code == 400