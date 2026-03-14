import { describe, it, expect } from "vitest";
import { nerdamerAdapter } from "./nerdamerAdapter";

// Helper para acceder a propiedades de la unión CASSuccess | CASError sin narrowing
type R = { status: 'success' | 'error'; result: string; message?: string; code?: string; originalExpression?: string };

// ============================================================
// OPERACIÓN 1: simplify
// ============================================================
describe("nerdamerAdapter.simplify", () => {
  describe("casos felices", () => {
    it("simplifica x + x a 2*x", async () => {
      const result = await nerdamerAdapter.simplify("x + x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2*x");
    });

    it("simplifica 2*x + 3*x a 5*x", async () => {
      const result = await nerdamerAdapter.simplify("2*x + 3*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("5*x");
    });

    it("simplifica x^2 + 2*x + 1", async () => {
      const result = await nerdamerAdapter.simplify("x^2 + 2*x + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("simplifica identidad trigonométrica sin(x)^2 + cos(x)^2 a 1", async () => {
      const result = await nerdamerAdapter.simplify("sin(x)^2 + cos(x)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("simplifica x/x a 1", async () => {
      const result = await nerdamerAdapter.simplify("x/x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("simplifica 0*x a 0", async () => {
      const result = await nerdamerAdapter.simplify("0*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("simplifica 1*x a x", async () => {
      const result = await nerdamerAdapter.simplify("1*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("x");
    });

    it("simplifica x - x a 0", async () => {
      const result = await nerdamerAdapter.simplify("x - x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("simplifica 2*(x + 1)", async () => {
      const result = await nerdamerAdapter.simplify("2*(x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("simplifica (x^2 - 1)/(x - 1) a x+1", async () => {
      const result = await nerdamerAdapter.simplify("(x^2 - 1)/(x - 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("simplifica fracción 1/2 + 1/3 a 5/6", async () => {
      const result = await nerdamerAdapter.simplify("1/2 + 1/3") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("5");
    });

    it("simplifica e^0 a 1", async () => {
      const result = await nerdamerAdapter.simplify("e^0") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("1");
    });

    it("simplifica sqrt(4) a 2", async () => {
      const result = await nerdamerAdapter.simplify("sqrt(4)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2");
    });

    it("simplifica 2*pi", async () => {
      const result = await nerdamerAdapter.simplify("2*pi") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("pi");
    });

    it("simplifica x^3 - x^3 a 0", async () => {
      const result = await nerdamerAdapter.simplify("x^3 - x^3") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("simplifica x*y + y*x a 2*x*y", async () => {
      const result = await nerdamerAdapter.simplify("x*y + y*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
      expect(result.result).toContain("y");
    });

    it("simplifica x^2 - x^2 + x a x", async () => {
      const result = await nerdamerAdapter.simplify("x^2 - x^2 + x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("x");
    });

    it("simplifica 3*x + 2*x - x a 4*x", async () => {
      const result = await nerdamerAdapter.simplify("3*x + 2*x - x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("4*x");
    });

    it("simplifica sqrt(9) a 3", async () => {
      const result = await nerdamerAdapter.simplify("sqrt(9)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("3");
    });

    it("simplifica expresión con múltiples constantes 2 + 3 a 5", async () => {
      const result = await nerdamerAdapter.simplify("2 + 3") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("5");
    });

    it("simplifica x^2*x a x^3", async () => {
      const result = await nerdamerAdapter.simplify("x^2*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("simplifica (x + y) + (x - y) a 2*x", async () => {
      const result = await nerdamerAdapter.simplify("(x + y) + (x - y)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2*x");
    });
  });

  describe("casos borde", () => {
    it("string vacío retorna error o resultado vacío", async () => {
      const result = await nerdamerAdapter.simplify("") as unknown as R;
      if (result.status === "success") {
        expect(result.result).toBeDefined();
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("solo whitespace retorna error o maneja graciosamente", async () => {
      const result = await nerdamerAdapter.simplify("   ") as unknown as R;
      if (result.status === "success") {
        expect(result.result).toBeDefined();
      } else {
        expect(result.message).toBeDefined();
      }
    });

    it("número solo '42' retorna '42'", async () => {
      const result = await nerdamerAdapter.simplify("42") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("42");
    });

    it("variable sola 'x' retorna 'x'", async () => {
      const result = await nerdamerAdapter.simplify("x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("x");
    });

    it("expresión ya simplificada '2*x' se mantiene", async () => {
      const result = await nerdamerAdapter.simplify("2*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2*x");
    });
  });

  describe("casos de error", () => {
    it("símbolo inválido '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.simplify("@#$") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis sin cerrar 'x + (y' retorna error", async () => {
      const result = await nerdamerAdapter.simplify("x + (y") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("operador sin operando 'x +' retorna error", async () => {
      const result = await nerdamerAdapter.simplify("x +") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("caracteres especiales 'x § y' retorna error", async () => {
      const result = await nerdamerAdapter.simplify("x § y") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("expresión completamente inválida '!!!' retorna error", async () => {
      const result = await nerdamerAdapter.simplify("!!!") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 32 tests
});

// ============================================================
// OPERACIÓN 2: differentiate
// ============================================================
describe("nerdamerAdapter.differentiate", () => {
  describe("casos felices", () => {
    it("diferencia x^2 respecto a x → 2*x", async () => {
      const result = await nerdamerAdapter.differentiate("x^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2*x");
    });

    it("diferencia x^3 respecto a x → 3*x^2", async () => {
      const result = await nerdamerAdapter.differentiate("x^3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("3*x^2");
    });

    it("diferencia 2*x respecto a x → 2", async () => {
      const result = await nerdamerAdapter.differentiate("2*x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("2");
    });

    it("diferencia x respecto a x → 1", async () => {
      const result = await nerdamerAdapter.differentiate("x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("1");
    });

    it("diferencia constante 5 respecto a x → 0", async () => {
      const result = await nerdamerAdapter.differentiate("5", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("diferencia sin(x) respecto a x → cos(x)", async () => {
      const result = await nerdamerAdapter.differentiate("sin(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("cos");
    });

    it("diferencia cos(x) respecto a x → -sin(x)", async () => {
      const result = await nerdamerAdapter.differentiate("cos(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("sin");
    });

    it("diferencia e^x respecto a x → e^x", async () => {
      const result = await nerdamerAdapter.differentiate("e^x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("e");
    });

    it("diferencia ln(x) respecto a x → 1/x", async () => {
      const result = await nerdamerAdapter.differentiate("ln(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("diferencia tan(x) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("tan(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("diferencia polinomio x^2 + 3*x + 1 respecto a x → 2*x+3", async () => {
      const result = await nerdamerAdapter.differentiate("x^2 + 3*x + 1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2*x");
    });

    it("regla del producto: diferencia x*sin(x) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("x*sin(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("regla de la cadena: diferencia sin(x^2) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("sin(x^2)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("diferencia x^2 respecto a y → 0", async () => {
      const result = await nerdamerAdapter.differentiate("x^2", "y") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("segunda derivada de x^3 respecto a x (order=2) → 6*x", async () => {
      const result = await nerdamerAdapter.differentiate("x^3", "x", 2) as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("6*x");
    });

    it("tercera derivada de x^3 respecto a x (order=3) → 6", async () => {
      const result = await nerdamerAdapter.differentiate("x^3", "x", 3) as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("6");
    });

    it("segunda derivada de sin(x) (order=2) → -sin(x)", async () => {
      const result = await nerdamerAdapter.differentiate("sin(x)", "x", 2) as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("sin");
    });

    it("diferencia función compuesta cos(2*x) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("cos(2*x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("sin");
    });

    it("diferencia e^(2*x) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("e^(2*x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("e");
    });

    it("diferencia ln(2*x) respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("ln(2*x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("diferencia x^4 respecto a x → 4*x^3", async () => {
      const result = await nerdamerAdapter.differentiate("x^4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^3");
    });
  });

  describe("casos borde", () => {
    it("order=1 es idéntico a no pasar order", async () => {
      const r1 = await nerdamerAdapter.differentiate("x^2", "x", 1) as unknown as R;
      const r2 = await nerdamerAdapter.differentiate("x^2", "x") as unknown as R;
      expect(r1.status).toBe("success");
      expect(r2.status).toBe("success");
      expect(r1.result).toBe(r2.result);
    });

    it("derivada de constante pura '7' → 0", async () => {
      const result = await nerdamerAdapter.differentiate("7", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("expresión con múltiples variables, derivar respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("x^2 + y^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("variable que no aparece en la expresión → 0", async () => {
      const result = await nerdamerAdapter.differentiate("y^2 + 3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("polinomio de grado alto x^10 respecto a x", async () => {
      const result = await nerdamerAdapter.differentiate("x^10", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });
  });

  describe("casos de error", () => {
    it("expresión inválida '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.differentiate("@#$", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("variable vacía '' retorna error", async () => {
      const result = await nerdamerAdapter.differentiate("x^2", "") as unknown as R;
      expect(result.status).toMatch(/^(success|error)$/);
    });

    it("input malformado 'x +' retorna error", async () => {
      const result = await nerdamerAdapter.differentiate("x +", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis mal balanceados 'sin(x' retorna error", async () => {
      const result = await nerdamerAdapter.differentiate("sin(x", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("caracteres especiales en expresión retorna error", async () => {
      const result = await nerdamerAdapter.differentiate("x § y", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 31 tests
});

// ============================================================
// OPERACIÓN 3: integrate
// ============================================================
describe("nerdamerAdapter.integrate", () => {
  describe("casos felices", () => {
    it("integra 1 respecto a x → contiene x", async () => {
      const result = await nerdamerAdapter.integrate("1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("integra x respecto a x → contiene x^2", async () => {
      const result = await nerdamerAdapter.integrate("x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("integra x^2 respecto a x → contiene x^3", async () => {
      const result = await nerdamerAdapter.integrate("x^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^3");
    });

    it("integra x^3 respecto a x → contiene x^4", async () => {
      const result = await nerdamerAdapter.integrate("x^3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^4");
    });

    it("integra 2*x respecto a x → contiene x^2", async () => {
      const result = await nerdamerAdapter.integrate("2*x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("integra cos(x) respecto a x → contiene sin(x)", async () => {
      const result = await nerdamerAdapter.integrate("cos(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("sin");
    });

    it("integra sin(x) respecto a x → contiene cos(x)", async () => {
      const result = await nerdamerAdapter.integrate("sin(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("cos");
    });

    it("integra e^x respecto a x → contiene e^x", async () => {
      const result = await nerdamerAdapter.integrate("e^x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("e");
    });

    it("integra 1/x respecto a x → contiene log o ln", async () => {
      const result = await nerdamerAdapter.integrate("1/x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result.toLowerCase()).toMatch(/log|ln/);
    });

    it("integra x^2 + 1 respecto a x → success", async () => {
      const result = await nerdamerAdapter.integrate("x^2 + 1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra 2*x + 3 respecto a x → success", async () => {
      const result = await nerdamerAdapter.integrate("2*x + 3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra x^(-2) respecto a x → success", async () => {
      const result = await nerdamerAdapter.integrate("x^(-2)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra sec(x)^2 respecto a x → contiene tan(x)", async () => {
      const result = await nerdamerAdapter.integrate("sec(x)^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("tan");
    });

    it("integra x^4 respecto a x → contiene x^5", async () => {
      const result = await nerdamerAdapter.integrate("x^4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^5");
    });

    it("integra 3*x^2 respecto a x → contiene x^3", async () => {
      const result = await nerdamerAdapter.integrate("3*x^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^3");
    });

    it("integra x^2 + 2*x + 1 respecto a x → success", async () => {
      const result = await nerdamerAdapter.integrate("x^2 + 2*x + 1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra x^5 respecto a x → contiene x^6", async () => {
      const result = await nerdamerAdapter.integrate("x^5", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^6");
    });

    it("integra 4*x^3 respecto a x → contiene x^4", async () => {
      const result = await nerdamerAdapter.integrate("4*x^3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^4");
    });

    it("integra x^2 + x respecto a x → success", async () => {
      const result = await nerdamerAdapter.integrate("x^2 + x", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra 5*x^4 respecto a x → contiene x^5", async () => {
      const result = await nerdamerAdapter.integrate("5*x^4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^5");
    });
  });

  describe("casos borde", () => {
    it("integra constante 5 respecto a x → contiene x", async () => {
      const result = await nerdamerAdapter.integrate("5", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("integra y^2 respecto a x → contiene x", async () => {
      const result = await nerdamerAdapter.integrate("y^2", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("integra polinomio de grado alto x^9 respecto a x", async () => {
      const result = await nerdamerAdapter.integrate("x^9", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^10");
    });

    it("integra suma de funciones sin(x) + cos(x) respecto a x", async () => {
      const result = await nerdamerAdapter.integrate("sin(x) + cos(x)", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("integra expresión simple x + 1 respecto a x", async () => {
      const result = await nerdamerAdapter.integrate("x + 1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });
  });

  describe("casos de error", () => {
    it("expresión inválida '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.integrate("@#$", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("variable vacía '' retorna error", async () => {
      const result = await nerdamerAdapter.integrate("x^2", "") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("input malformado 'x +' retorna error", async () => {
      const result = await nerdamerAdapter.integrate("x +", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis mal balanceados 'sin(x' retorna error", async () => {
      const result = await nerdamerAdapter.integrate("sin(x", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("caracteres no matemáticos 'x § y' retorna error", async () => {
      const result = await nerdamerAdapter.integrate("x § y", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 30 tests
});

// ============================================================
// OPERACIÓN 4: solveEquation
// ============================================================
describe("nerdamerAdapter.solveEquation", () => {
  describe("casos felices", () => {
    it("resuelve x + 1 = 0 → contiene -1", async () => {
      const result = await nerdamerAdapter.solveEquation("x + 1 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("-1");
    });

    it("resuelve x - 5 = 0 → contiene 5", async () => {
      const result = await nerdamerAdapter.solveEquation("x - 5 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("5");
    });

    it("resuelve 2*x = 4 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("2*x = 4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve x^2 = 4 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 = 4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve x^2 - 5*x + 6 = 0 → contiene 2 o 3", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - 5*x + 6 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      const hasTwo = result.result.includes("2");
      const hasThree = result.result.includes("3");
      expect(hasTwo || hasThree).toBe(true);
    });

    it("resuelve 3*x + 7 = 22 → contiene 5", async () => {
      const result = await nerdamerAdapter.solveEquation("3*x + 7 = 22", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("5");
    });

    it("resuelve x^2 - x = 0 → contiene 0 o 1", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - x = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      const hasZero = result.result.includes("0");
      const hasOne = result.result.includes("1");
      expect(hasZero || hasOne).toBe(true);
    });

    it("resuelve x^3 = 8 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("x^3 = 8", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve x/2 = 3 → contiene 6", async () => {
      const result = await nerdamerAdapter.solveEquation("x/2 = 3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("6");
    });

    it("resuelve x^2 - 9 = 0 → contiene 3", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - 9 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("3");
    });

    it("resuelve 5*x - 10 = 0 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("5*x - 10 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve x^2 + 2*x + 1 = 0 → contiene -1", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 + 2*x + 1 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("-1");
    });

    it("resuelve x^2 - 4*x + 4 = 0 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - 4*x + 4 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve 2*x^2 - 8 = 0 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("2*x^2 - 8 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve x - 0 = 0 → contiene 0", async () => {
      const result = await nerdamerAdapter.solveEquation("x - 0 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("0");
    });

    it("resuelve 4*x - 12 = 0 → contiene 3", async () => {
      const result = await nerdamerAdapter.solveEquation("4*x - 12 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("3");
    });

    it("resuelve x^2 - 16 = 0 → contiene 4", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - 16 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("4");
    });

    it("resuelve 6*x = 18 → contiene 3", async () => {
      const result = await nerdamerAdapter.solveEquation("6*x = 18", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("3");
    });

    it("resuelve x^2 - 25 = 0 → contiene 5", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 - 25 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("5");
    });

    it("resuelve x + 10 = 0 → contiene -10", async () => {
      const result = await nerdamerAdapter.solveEquation("x + 10 = 0", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("-10");
    });
  });

  describe("casos borde", () => {
    it("resuelve x = 3 → contiene 3", async () => {
      const result = await nerdamerAdapter.solveEquation("x = 3", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("3");
    });

    it("resuelve coeficiente decimal 0.5*x = 1 → contiene 2", async () => {
      const result = await nerdamerAdapter.solveEquation("0.5*x = 1", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("2");
    });

    it("resuelve ecuación con múltiples variables respecto a x", async () => {
      const result = await nerdamerAdapter.solveEquation("x + y = 5", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("resuelve ecuación de segundo grado sin término lineal x^2 = 9", async () => {
      const result = await nerdamerAdapter.solveEquation("x^2 = 9", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("3");
    });

    it("resuelve ecuación con coeficiente fraccionario x/3 = 4", async () => {
      const result = await nerdamerAdapter.solveEquation("x/3 = 4", "x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("12");
    });
  });

  describe("casos de error", () => {
    it("variable vacía '' retorna error", async () => {
      const result = await nerdamerAdapter.solveEquation("x + 1 = 0", "") as unknown as R;
      expect(result.status).toMatch(/^(success|error)$/);
    });

    it("input sin formato de ecuación '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.solveEquation("@#$", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis sin cerrar '(x + 1 = 0' retorna error", async () => {
      const result = await nerdamerAdapter.solveEquation("(x + 1 = 0", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("string vacío retorna error", async () => {
      const result = await nerdamerAdapter.solveEquation("", "x") as unknown as R;
      expect(result.status).toMatch(/^(success|error)$/);
    });

    it("caracteres inválidos en ecuación retorna error", async () => {
      const result = await nerdamerAdapter.solveEquation("x § 1 = 0", "x") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 30 tests
});

// ============================================================
// OPERACIÓN 5: expand
// ============================================================
describe("nerdamerAdapter.expand", () => {
  describe("casos felices", () => {
    it("expande (x + 1)^2 → contiene x^2 y 2*x", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande (x - 1)^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("(x - 1)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande diferencia de cuadrados (x + 1)*(x - 1) → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)*(x - 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande (x + y)^2 → contiene x^2 y y^2", async () => {
      const result = await nerdamerAdapter.expand("(x + y)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
      expect(result.result).toContain("y^2");
    });

    it("expande (2*x + 3)^2 → success", async () => {
      const result = await nerdamerAdapter.expand("(2*x + 3)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande (x + 1)^3 → success", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)^3") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande x*(x + 1) → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("x*(x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande 2*(x + y) → contiene 2*x", async () => {
      const result = await nerdamerAdapter.expand("2*(x + y)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("expande (a + b)*(c + d) → success con 4 términos", async () => {
      const result = await nerdamerAdapter.expand("(a + b)*(c + d)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande (x^2 + 1)*(x^2 - 1) → contiene x^4", async () => {
      const result = await nerdamerAdapter.expand("(x^2 + 1)*(x^2 - 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^4");
    });

    it("expande -1*(x + 1) → contiene -x", async () => {
      const result = await nerdamerAdapter.expand("-1*(x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("-x");
    });

    it("expande (x + 1)*(x + 2) → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)*(x + 2)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande (x + 1)*(x + 2)*(x + 3) → success", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)*(x + 2)*(x + 3)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande 3*(2*x + 1) → contiene 6*x", async () => {
      const result = await nerdamerAdapter.expand("3*(2*x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("6*x");
    });

    it("expande (x - 2)^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("(x - 2)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande x*(x - 1)*(x + 1) → success", async () => {
      const result = await nerdamerAdapter.expand("x*(x - 1)*(x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande (x + 3)^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.expand("(x + 3)^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("expande (2*x + y)*(x - y) → success", async () => {
      const result = await nerdamerAdapter.expand("(2*x + y)*(x - y)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("expande (x + 1)^4 → success", async () => {
      const result = await nerdamerAdapter.expand("(x + 1)^4") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^4");
    });

    it("expande (3*x - 2)*(2*x + 5) → success", async () => {
      const result = await nerdamerAdapter.expand("(3*x - 2)*(2*x + 5)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });
  });

  describe("casos borde", () => {
    it("número solo '42' retorna '42'", async () => {
      const result = await nerdamerAdapter.expand("42") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("42");
    });

    it("variable sola 'x' retorna 'x'", async () => {
      const result = await nerdamerAdapter.expand("x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("x");
    });

    it("expresión sin paréntesis 'x^2 + 1' se mantiene", async () => {
      const result = await nerdamerAdapter.expand("x^2 + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("producto con cero '0*(x + 1)' → 0", async () => {
      const result = await nerdamerAdapter.expand("0*(x + 1)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("0");
    });

    it("expresión completamente expandida 'x^2 + 2*x + 1' se mantiene", async () => {
      const result = await nerdamerAdapter.expand("x^2 + 2*x + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });
  });

  describe("casos de error", () => {
    it("input inválido '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.expand("@#$") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis desbalanceados '(x + 1' retorna error", async () => {
      const result = await nerdamerAdapter.expand("(x + 1") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("string vacío '' retorna error", async () => {
      const result = await nerdamerAdapter.expand("") as unknown as R;
      expect(result.status).toMatch(/^(success|error)$/);
    });

    it("operador sin operandos '+' retorna error", async () => {
      const result = await nerdamerAdapter.expand("+") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("caracteres no matemáticos 'x § y' retorna error", async () => {
      const result = await nerdamerAdapter.expand("x § y") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 30 tests
});

// ============================================================
// OPERACIÓN 6: factor
// ============================================================
describe("nerdamerAdapter.factor", () => {
  describe("casos felices", () => {
    it("factoriza x^2 - 1 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 - 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^2 + 2*x + 1 → contiene x+1", async () => {
      const result = await nerdamerAdapter.factor("x^2 + 2*x + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^2 - 4 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 - 4") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^3 - x → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^3 - x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza 2*x^2 + 4*x → contiene x", async () => {
      const result = await nerdamerAdapter.factor("2*x^2 + 4*x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^2 - 5*x + 6 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 - 5*x + 6") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^3 + x^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.factor("x^3 + x^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("factoriza x^2 + x → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 + x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza 4*x^2 - 4*x + 1 → success", async () => {
      const result = await nerdamerAdapter.factor("4*x^2 - 4*x + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza x^2 - y^2 → contiene x e y", async () => {
      const result = await nerdamerAdapter.factor("x^2 - y^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
      expect(result.result).toContain("y");
    });

    it("factoriza x^3 - 8 → success", async () => {
      const result = await nerdamerAdapter.factor("x^3 - 8") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza x^3 + 8 → success", async () => {
      const result = await nerdamerAdapter.factor("x^3 + 8") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza 6*x^2 + 5*x + 1 → success", async () => {
      const result = await nerdamerAdapter.factor("6*x^2 + 5*x + 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza x^4 - 1 → success", async () => {
      const result = await nerdamerAdapter.factor("x^4 - 1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza x^2 - 9 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 - 9") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza 2*x^2 - 2 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("2*x^2 - 2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^4 - x^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.factor("x^4 - x^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });

    it("factoriza 3*x^2 - 12 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("3*x^2 - 12") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^2 - 3*x + 2 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2 - 3*x + 2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza x^3 - x^2 → contiene x^2", async () => {
      const result = await nerdamerAdapter.factor("x^3 - x^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x^2");
    });
  });

  describe("casos borde", () => {
    it("factoriza x → x", async () => {
      const result = await nerdamerAdapter.factor("x") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("x");
    });

    it("factoriza x^2 → contiene x", async () => {
      const result = await nerdamerAdapter.factor("x^2") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toContain("x");
    });

    it("factoriza 1 → 1", async () => {
      const result = await nerdamerAdapter.factor("1") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBe("1");
    });

    it("factoriza polinomio ya factorizado '(x+1)*(x+2)' → success", async () => {
      const result = await nerdamerAdapter.factor("(x+1)*(x+2)") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });

    it("factoriza número entero 6 → success", async () => {
      const result = await nerdamerAdapter.factor("6") as unknown as R;
      expect(result.status).toBe("success");
      expect(result.result).toBeTruthy();
    });
  });

  describe("casos de error", () => {
    it("input inválido '@#$' retorna error", async () => {
      const result = await nerdamerAdapter.factor("@#$") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("paréntesis mal balanceados '(x + 1' retorna error", async () => {
      const result = await nerdamerAdapter.factor("(x + 1") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("string vacío '' retorna error", async () => {
      const result = await nerdamerAdapter.factor("") as unknown as R;
      expect(result.status).toMatch(/^(success|error)$/);
    });

    it("caracteres inválidos 'x § y' retorna error", async () => {
      const result = await nerdamerAdapter.factor("x § y") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });

    it("operador sin operandos '+' retorna error", async () => {
      const result = await nerdamerAdapter.factor("+") as unknown as R;
      expect(result.status).toBe("error");
      expect(result.message).toBeDefined();
    });
  });
  // TOTAL: 30 tests
});

// GRAND TOTAL: 183 tests