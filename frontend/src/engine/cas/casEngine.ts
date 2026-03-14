/**
 * Resultado exitoso de una operación CAS.
 */
export interface CASSuccess {
  status: "success";
  result: string;
}

/**
 * Error tipado retornado por una operación CAS.
 */
export interface CASError {
  status: "error";
  code: string;
  message: string;
  originalExpression: string;
}

/**
 * Toda operación CAS retorna éxito o error.
 */
export type CASResult = CASSuccess | CASError;

/**
 * Interfaz del motor de álgebra simbólica (CAS).
 *
 * Diseñada para ser independiente de la implementación: NerdamerAdapter (H1)
 * y SymPyAdapter (H2) deben satisfacer este contrato sin que el frontend cambie.
 */
export interface CASEngine {
  /**
   * Simplifica algebraicamente una expresión.
   *
   * @param expr - Expresión a simplificar, ej: "x^2 + 2*x + 1"
   * @returns Expresión simplificada, ej: "(x+1)^2"
   */
  simplify(expr: string): Promise<CASResult>;

  /**
   * Calcula la derivada de una expresión respecto a una variable.
   *
   * @param expr     - Expresión a derivar, ej: "x^3 + sin(x)"
   * @param variable - Variable de diferenciación, ej: "x"
   * @param order    - Orden de la derivada (default: 1). Debe ser entero ≥ 1.
   * @returns Derivada de orden `order`, ej: "3*x^2 + cos(x)"
   */
  differentiate(expr: string, variable: string, order?: number): Promise<CASResult>;

  /**
   * Calcula la integral indefinida de una expresión respecto a una variable.
   *
   * @param expr     - Expresión a integrar, ej: "x^2"
   * @param variable - Variable de integración, ej: "x"
   * @returns Antiderivada, ej: "x^3/3"
   */
  integrate(expr: string, variable: string): Promise<CASResult>;

  /**
   * Resuelve una ecuación para una variable dada.
   *
   * @param equation - Ecuación en forma de igualdad, ej: "x^2 - 4 = 0"
   * @param variable - Variable a despejar, ej: "x"
   * @returns Soluciones, ej: "[-2, 2]"
   */
  solveEquation(equation: string, variable: string): Promise<CASResult>;

  /**
   * Expande una expresión algebraica.
   *
   * @param expr - Expresión a expandir, ej: "(x+1)^3"
   * @returns Expresión expandida, ej: "x^3 + 3*x^2 + 3*x + 1"
   */
  expand(expr: string): Promise<CASResult>;

  /**
   * Factoriza una expresión algebraica.
   *
   * @param expr - Expresión a factorizar, ej: "x^2 - 5*x + 6"
   * @returns Expresión factorizada, ej: "(x-2)*(x-3)"
   */
  factor(expr: string): Promise<CASResult>;
}