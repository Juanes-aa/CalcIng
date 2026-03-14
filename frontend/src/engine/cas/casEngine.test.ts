import { describe, it, expect } from "vitest";
import type { CASEngine, CASResult, CASSuccess, CASError } from "./casEngine";

// ─── Mock único reutilizado en todos los tests ───────────────────────────────

const MockCASEngine: CASEngine = {
  simplify: async (expr: string): Promise<CASResult> => ({
    status: "success",
    result: expr,
  }),

  differentiate: async (expr: string, variable: string, order = 1): Promise<CASResult> => {
    if (expr === "x^2" && variable === "x" && order === 1) {
      return { status: "success", result: "2*x" };
    }
    if (expr === "x^2" && variable === "x" && order === 2) {
      return { status: "success", result: "2" };
    }
    return {
      status: "error",
      code: "UNSUPPORTED_OP",
      message: "Expresión no soportada por el mock",
      originalExpression: expr,
    };
  },

  integrate: async (expr: string, variable: string): Promise<CASResult> => {
    if (expr === "x^2" && variable === "x") {
      return { status: "success", result: "x^3/3" };
    }
    return { status: "success", result: `integral(${expr}, ${variable})` };
  },

  solveEquation: async (equation: string, variable: string): Promise<CASResult> => {
    if (equation === "x^2 - 4 = 0" && variable === "x") {
      return { status: "success", result: "[-2, 2]" };
    }
    return { status: "success", result: `solve(${equation}, ${variable})` };
  },

  expand: async (expr: string): Promise<CASResult> => {
    if (expr === "(x+1)^2") {
      return { status: "success", result: "x^2 + 2*x + 1" };
    }
    return { status: "success", result: expr };
  },

  factor: async (expr: string): Promise<CASResult> => {
    if (expr === "x^2 - 1") {
      return { status: "success", result: "(x+1)*(x-1)" };
    }
    return { status: "success", result: expr };
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CASEngine interface contract", () => {

  it("1. MockCASEngine satisface el contrato CASEngine (TypeScript compila)", () => {
    // Si este archivo compila, el contrato se cumple.
    // La aserción confirma que el objeto existe en runtime.
    const engine: CASEngine = MockCASEngine;
    expect(engine).toBeDefined();
    expect(typeof engine.simplify).toBe("function");
    expect(typeof engine.differentiate).toBe("function");
    expect(typeof engine.integrate).toBe("function");
    expect(typeof engine.solveEquation).toBe("function");
    expect(typeof engine.expand).toBe("function");
    expect(typeof engine.factor).toBe("function");
  });

  it("2. simplify retorna CASSuccess con status 'success'", async () => {
    const result = await MockCASEngine.simplify("x^2 + 2*x + 1");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(typeof result.result).toBe("string");
      expect(result.result.length).toBeGreaterThan(0);
    }
  });

  it("3. differentiate retorna resultado correcto para x^2", async () => {
    const result = await MockCASEngine.differentiate("x^2", "x");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("2*x");
    }
  });

  it("4. differentiate con order=2 retorna segunda derivada", async () => {
    const result = await MockCASEngine.differentiate("x^2", "x", 2);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("2");
    }
  });

  it("5. integrate retorna CASSuccess para x^2", async () => {
    const result = await MockCASEngine.integrate("x^2", "x");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("x^3/3");
    }
  });

  it("6. solveEquation retorna soluciones para x^2 - 4 = 0", async () => {
    const result = await MockCASEngine.solveEquation("x^2 - 4 = 0", "x");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("[-2, 2]");
    }
  });

  it("7. expand retorna CASSuccess para (x+1)^2", async () => {
    const result = await MockCASEngine.expand("(x+1)^2");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("x^2 + 2*x + 1");
    }
  });

  it("8. factor retorna CASSuccess para x^2 - 1", async () => {
    const result = await MockCASEngine.factor("x^2 - 1");
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.result).toBe("(x+1)*(x-1)");
    }
  });

  it("9. cualquier método puede retornar CASError con code y message", async () => {
    const result = await MockCASEngine.differentiate("expresion_desconocida", "x", 1);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(typeof result.code).toBe("string");
      expect(result.code.length).toBeGreaterThan(0);
      expect(typeof result.message).toBe("string");
      expect(result.message.length).toBeGreaterThan(0);
      expect(typeof result.originalExpression).toBe("string");
    }
  });

  it("10. el discriminated union permite inferencia de tipo en tiempo de compilación", async () => {
    const result: CASResult = await MockCASEngine.simplify("x + x");

    // TypeScript debe inferir CASSuccess dentro del if — si no compila, el contrato falla.
    if (result.status === "success") {
      const success: CASSuccess = result;
      expect(success.result).toBeDefined();
    } else {
      const error: CASError = result;
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.originalExpression).toBeDefined();
    }
  });

});