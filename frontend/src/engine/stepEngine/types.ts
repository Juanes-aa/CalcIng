/** Operaciones CAS que el Step Engine puede procesar */
export type StepOperation =
  | 'differentiate'
  | 'integrate'
  | 'solveEquation'
  | 'simplify'
  | 'expand'
  | 'factor';

/** Un paso individual en la resolución pedagógica */
export interface MathStep {
  step_number: number;       // 1, 2, 3...
  expression_before: string; // expresión LaTeX antes de la transformación
  expression_after: string;  // expresión LaTeX después
  rule_id: string;           // ej: 'POWER_RULE_DIFF', 'INTEGRATION_BY_PARTS'
  rule_name: string;         // nombre legible en español
  explanation: string;       // explicación en lenguaje natural (español)
  hint: string | null;       // tip adicional pedagógico, null si no aplica
  is_key_step: boolean;      // true si es el paso crítico del proceso
}

/** Contexto de entrada para generar pasos */
export interface StepInput {
  operation: StepOperation;
  expression: string;        // expresión original del usuario
  variable?: string;         // variable de operación (diff/integrate/solve)
  order?: number;            // orden de derivada (solo differentiate)
  result: string;            // resultado final entregado por el CAS
}

/** Nivel de detalle pedagógico para las explicaciones de pasos */
export type DetailLevel = 'beginner' | 'intermediate' | 'advanced';