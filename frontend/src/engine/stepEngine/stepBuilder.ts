import { MathStep, StepInput } from './types';
import { RULE_BOOK } from './ruleBook';

function getRuleName(ruleId: string): string {
  return RULE_BOOK[ruleId]?.name ?? ruleId;
}

function getRuleHint(ruleId: string): string | null {
  return RULE_BOOK[ruleId]?.hint ?? null;
}

function detectDiffRule(expression: string, variable: string = 'x'): string {
  const expr = expression.trim();

  if (!expr.includes(variable)) {
    return 'CONST_RULE_DIFF';
  }

  const chainPattern = /\b(sin|cos|tan|exp|ln|log|sqrt)\s*\(([^)]+)\)/;
  const chainMatch = expr.match(chainPattern);
  if (chainMatch) {
    const innerArg = chainMatch[2].trim();
    if (innerArg !== variable) {
      return 'CHAIN_RULE_DIFF';
    }
  }

  if (expr.includes('+') || /[^e\d]-/.test(expr)) {
    return 'SUM_RULE_DIFF';
  }

  if (expr.includes('*')) {
    const factors = expr.split('*');
    const nonTrivialFactors = factors.filter(
      (f) => f.trim().includes(variable) || /\b(sin|cos|tan|exp|ln|log)\b/.test(f)
    );
    if (nonTrivialFactors.length >= 2) {
      return 'PRODUCT_RULE_DIFF';
    }
  }

  const powerPattern = /^\d*\*?x(\^\d+)?$|^x(\^\d+)?$/;
  if (powerPattern.test(expr.replace(/\s/g, ''))) {
    return 'POWER_RULE_DIFF';
  }

  if (/x\^\d+/.test(expr) && !/\b(sin|cos|tan|exp|ln|log)\b/.test(expr)) {
    return 'POWER_RULE_DIFF';
  }

  return 'POWER_RULE_DIFF';
}

function detectIntegrateRule(expression: string): string {
  const expr = expression.trim();

  const transcendentFuncs = /\b(sin|cos|tan|exp|ln|log)\b/;
  const algebraicFactor = /\bx(\^\d+)?\b/;

  if (expr.includes('*') && transcendentFuncs.test(expr) && algebraicFactor.test(expr)) {
    return 'INTEGRATION_BY_PARTS';
  }

  if (
    expr.includes('*') &&
    /x\^2/.test(expr) &&
    transcendentFuncs.test(expr)
  ) {
    return 'U_SUBSTITUTION';
  }

  return 'DIRECT_INTEGRAL_TABLE';
}

function parseProductIntegral(
  expression: string
): { algebraic: string; transcendent: string; transcendentType: string } | null {
  if (!expression.includes('*')) return null;

  const parts = expression.split('*');
  if (parts.length < 2) return null;

  // Join everything after first '*' as second part (handle cases like "x*exp(x)")
  const part0 = parts[0].trim();
  const part1 = parts.slice(1).join('*').trim();

  const transcendentPattern = /\b(sin|cos|tan|exp|ln|log)\b/;
  const algebraicPattern = /^(\d+\*)?x(\^(\d+))?$|^x$/;

  const transcendentMatch0 = part0.match(transcendentPattern);
  const transcendentMatch1 = part1.match(transcendentPattern);
  const isAlgebraic0 = algebraicPattern.test(part0);
  const isAlgebraic1 = algebraicPattern.test(part1);

  if (isAlgebraic0 && transcendentMatch1) {
    return { algebraic: part0, transcendent: part1, transcendentType: transcendentMatch1[1] };
  }

  if (isAlgebraic1 && transcendentMatch0) {
    return { algebraic: part1, transcendent: part0, transcendentType: transcendentMatch0[1] };
  }

  return null;
}

function derivada_aproximada(algebraic: string): string {
  const match = algebraic.match(/^x\^(\d+)$/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n === 2) return '2*x';
    return `${n}*x^(${n - 1})`;
  }
  return algebraic + "'";
}

function calcular_v(transcendentType: string, transcendent: string): string {
  switch (transcendentType) {
    case 'exp':
      return transcendent;
    case 'sin':
      return transcendent.replace('sin', '-cos');
    case 'cos':
      return transcendent.replace('cos', 'sin');
    case 'ln':
      return 'x·ln(x) - x';
    default:
      return transcendent;
  }
}

function buildDifferentiateSteps(input: StepInput): MathStep[] {
  const variable = input.variable ?? 'x';
  const ruleId = detectDiffRule(input.expression, variable);
  const ruleName = getRuleName(ruleId);

  const step1: MathStep = {
    step_number: 1,
    expression_before: input.expression,
    expression_after: input.expression,
    rule_id: ruleId,
    rule_name: ruleName,
    explanation:
      'Se identifica la estructura de la expresión para seleccionar la regla de derivación apropiada.',
    hint: getRuleHint(ruleId),
    is_key_step: false,
  };

  const step2: MathStep = {
    step_number: 2,
    expression_before: input.expression,
    expression_after: input.result,
    rule_id: ruleId,
    rule_name: ruleName,
    explanation: `Se aplica la ${ruleName} para obtener la derivada.`,
    hint: null,
    is_key_step: true,
  };

  return [step1, step2];
}

function buildIntegrateSteps(input: StepInput): MathStep[] {
  const ruleId = detectIntegrateRule(input.expression);
  const ruleName = getRuleName(ruleId);

  if (ruleId === 'DIRECT_INTEGRAL_TABLE') {
    const step1: MathStep = {
      step_number: 1,
      expression_before: input.expression,
      expression_after: input.expression,
      rule_id: 'DIRECT_INTEGRAL_TABLE',
      rule_name: getRuleName('DIRECT_INTEGRAL_TABLE'),
      explanation: 'Se reconoce una forma directa de la tabla de integrales.',
      hint: getRuleHint('DIRECT_INTEGRAL_TABLE'),
      is_key_step: false,
    };
    const step2: MathStep = {
      step_number: 2,
      expression_before: input.expression,
      expression_after: input.result + ' + C',
      rule_id: 'DIRECT_INTEGRAL_TABLE',
      rule_name: getRuleName('DIRECT_INTEGRAL_TABLE'),
      explanation: 'Se aplica la fórmula de integración directa.',
      hint: null,
      is_key_step: true,
    };
    return [step1, step2];
  }

  if (ruleId === 'U_SUBSTITUTION') {
    const step1: MathStep = {
      step_number: 1,
      expression_before: input.expression,
      expression_after: input.expression,
      rule_id: 'U_SUBSTITUTION',
      rule_name: getRuleName('U_SUBSTITUTION'),
      explanation: 'Se identifica u = g(x) cuya derivada aparece en el integrando.',
      hint: getRuleHint('U_SUBSTITUTION'),
      is_key_step: false,
    };
    const step2: MathStep = {
      step_number: 2,
      expression_before: input.expression,
      expression_after: '∫ f(u) du',
      rule_id: 'U_SUBSTITUTION',
      rule_name: getRuleName('U_SUBSTITUTION'),
      explanation: 'Se sustituye u y du para simplificar la integral.',
      hint: null,
      is_key_step: true,
    };
    const step3: MathStep = {
      step_number: 3,
      expression_before: '∫ f(u) du',
      expression_after: input.result + ' + C',
      rule_id: 'U_SUBSTITUTION',
      rule_name: getRuleName('U_SUBSTITUTION'),
      explanation: 'Se resuelve la integral en términos de u y se regresa a la variable original.',
      hint: null,
      is_key_step: false,
    };
    return [step1, step2, step3];
  }

  // INTEGRATION_BY_PARTS
  const parsed = parseProductIntegral(input.expression);

  if (parsed === null) {
    // Fallback: 2 pasos genéricos
    const step1: MathStep = {
      step_number: 1,
      expression_before: input.expression,
      expression_after: input.expression,
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: 'Se identifica el método de integración por partes.',
      hint: getRuleHint('INTEGRATION_BY_PARTS'),
      is_key_step: false,
    };
    const step2: MathStep = {
      step_number: 2,
      expression_before: input.expression,
      expression_after: input.result + ' + C',
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: 'Se aplica integración por partes.',
      hint: null,
      is_key_step: true,
    };
    return [step1, step2];
  }

  const { algebraic, transcendent, transcendentType } = parsed;

  const u = algebraic;
  const du =
    algebraic === 'x'
      ? 'dx'
      : algebraic.includes('^')
      ? derivada_aproximada(algebraic) + 'dx'
      : 'dx';
  const v = calcular_v(transcendentType, transcendent);

  const step1: MathStep = {
    step_number: 1,
    expression_before: '∫ ' + input.expression + ' dx',
    expression_after: '∫ ' + input.expression + ' dx',
    rule_id: 'INTEGRATION_BY_PARTS',
    rule_name: ruleName,
    explanation:
      'Se identifica un producto de función algebraica (' +
      algebraic +
      ') y transcendente (' +
      transcendent +
      '). Se aplica integración por partes.',
    hint: getRuleHint('INTEGRATION_BY_PARTS'),
    is_key_step: false,
  };

  const step2: MathStep = {
    step_number: 2,
    expression_before: '∫ ' + input.expression + ' dx',
    expression_after: 'u = ' + u + ',  dv = ' + transcendent + ' dx',
    rule_id: 'INTEGRATION_BY_PARTS',
    rule_name: ruleName,
    explanation:
      'Por regla ILATE: A (algebraica) tiene prioridad sobre ' +
      transcendentType.toUpperCase() +
      ' (transcendente). Se elige u = ' +
      u +
      '.',
    hint: 'ILATE: Inversa > Logarítmica > Algebraica > Trigonométrica > Exponencial',
    is_key_step: false,
  };

  const step3: MathStep = {
    step_number: 3,
    expression_before: 'u = ' + u + ',  dv = ' + transcendent + ' dx',
    expression_after: 'du = ' + du + ',  v = ' + v,
    rule_id: 'INTEGRATION_BY_PARTS',
    rule_name: ruleName,
    explanation: 'Se calcula du derivando u, y v integrando dv.',
    hint: null,
    is_key_step: false,
  };

  const step4: MathStep = {
    step_number: 4,
    expression_before: 'du = ' + du + ',  v = ' + v,
    expression_after: u + '·' + v + ' - ∫' + v + ' ' + du,
    rule_id: 'INTEGRATION_BY_PARTS',
    rule_name: ruleName,
    explanation: 'Se aplica la fórmula ∫u dv = uv - ∫v du.',
    hint: null,
    is_key_step: true,
  };

  const step5: MathStep = {
    step_number: 5,
    expression_before: u + '·' + v + ' - ∫' + v + ' ' + du,
    expression_after: input.result + ' + C',
    rule_id: 'INTEGRATION_BY_PARTS',
    rule_name: ruleName,
    explanation: 'Se resuelve la integral restante y se agrega la constante de integración.',
    hint: null,
    is_key_step: false,
  };

  return [step1, step2, step3, step4, step5];
}

// ─────────────────────────────────────────────────────────────────────────────
// Auxiliar: parsea ecuaciones lineales de la forma "ax + b = c"
// Retorna { a, b, c } o null si no encaja en la forma lineal simple
// ─────────────────────────────────────────────────────────────────────────────
function parseLinearEquation(equation: string): { a: number; b: number; c: number } | null {
  // Rechazar potencias, funciones transcendentes, variables distintas de x, y formato con *
  if (/\^/.test(equation)) return null;
  if (/\b(sin|cos|tan|exp|ln|log|sqrt)\s*\(/.test(equation)) return null;
  if (/[a-wyz]/.test(equation)) return null;
  if (/\*/.test(equation)) return null; // "2*x + 3 = 7" → fallback

  const trimmed = equation.trim();

  // Regex: (coef_x)(término_b) = (c)
  // Grupo 1: coeficiente de x — vacío→1, "-"→-1, número
  // Grupo 2: término independiente con signo (opcional)
  // Grupo 3: lado derecho (puede ser negativo)
  const re = /^(-?\d*\.?\d*)x\s*([+-]\s*\d+\.?\d*)?\s*=\s*(-?\d+\.?\d*)$/;
  const match = trimmed.match(re);

  if (!match) return null;

  const rawA = match[1];
  const rawB = match[2];
  const rawC = match[3];

  let a: number;
  if (rawA === '' || rawA === undefined) {
    a = 1;
  } else if (rawA === '-') {
    a = -1;
  } else {
    a = parseFloat(rawA);
    if (isNaN(a)) return null;
  }

  let b: number;
  if (rawB === undefined || rawB === '') {
    b = 0;
  } else {
    b = parseFloat(rawB.replace(/\s/g, ''));
    if (isNaN(b)) return null;
  }

  const c = parseFloat(rawC);
  if (isNaN(c)) return null;

  if (a === 0) return null;

  return { a, b, c };
}

function buildSolveEquationSteps(input: StepInput): MathStep[] {
  const parsed = parseLinearEquation(input.expression);

  // ── FALLBACK: 4 pasos genéricos ────────────────────────────────────────────
  if (parsed === null) {
    return [
      {
        step_number: 1,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'ADDITIVE_EQ_PROP',
        rule_name: getRuleName('ADDITIVE_EQ_PROP'),
        explanation: 'Se identifican los términos a transponer.',
        hint: getRuleHint('ADDITIVE_EQ_PROP'),
        is_key_step: false,
      },
      {
        step_number: 2,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'ARITH_SIMPLIFY',
        rule_name: getRuleName('ARITH_SIMPLIFY'),
        explanation: 'Se simplifica el lado derecho.',
        hint: getRuleHint('ARITH_SIMPLIFY'),
        is_key_step: false,
      },
      {
        step_number: 3,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'MULT_EQ_PROP',
        rule_name: getRuleName('MULT_EQ_PROP'),
        explanation: 'Se despeja la variable dividiendo ambos lados.',
        hint: getRuleHint('MULT_EQ_PROP'),
        is_key_step: true,
      },
      {
        step_number: 4,
        expression_before: input.expression,
        expression_after: input.result,
        rule_id: 'ARITH_SIMPLIFY',
        rule_name: getRuleName('ARITH_SIMPLIFY'),
        explanation: `Solución: ${input.result}`,
        hint: getRuleHint('ARITH_SIMPLIFY'),
        is_key_step: false,
      },
    ];
  }

  // ── 5 PASOS para ecuación lineal ax + b = c ────────────────────────────────
  const { a, b, c } = parsed;
  const rhs = c - b;
  const xVal = rhs / a;
  const xValStr = Number.isInteger(xVal) ? String(xVal) : xVal.toFixed(4);
  const bDisplay = b < 0 ? `(${b})` : String(b);

  // Paso 1
  const step1After = b === 0 ? input.expression : `${a}x = ${c} - ${bDisplay}`;
  const step1: MathStep = {
    step_number: 1,
    expression_before: input.expression,
    expression_after: step1After,
    rule_id: 'ADDITIVE_EQ_PROP',
    rule_name: getRuleName('ADDITIVE_EQ_PROP'),
    explanation:
      b === 0
        ? 'No hay término independiente que transponer.'
        : `Se resta ${bDisplay} en ambos lados para aislar el término con x.`,
    hint: getRuleHint('ADDITIVE_EQ_PROP'),
    is_key_step: false,
  };

  // Paso 2
  const step2After = b === 0 ? input.expression : `${a}x = ${rhs}`;
  const step2: MathStep = {
    step_number: 2,
    expression_before: step1After,
    expression_after: step2After,
    rule_id: 'ARITH_SIMPLIFY',
    rule_name: getRuleName('ARITH_SIMPLIFY'),
    explanation:
      b === 0
        ? 'No hay simplificación necesaria.'
        : `${c} - ${bDisplay} = ${rhs}`,
    hint: null,
    is_key_step: false,
  };

  // Paso 3
  const step3After =
    a === 1 || a === -1 ? `x = ${rhs}` : `x = ${rhs} / ${a}`;
  const step3: MathStep = {
    step_number: 3,
    expression_before: step2After,
    expression_after: step3After,
    rule_id: 'MULT_EQ_PROP',
    rule_name: getRuleName('MULT_EQ_PROP'),
    explanation:
      a === 1
        ? 'El coeficiente de x es 1, no es necesario dividir.'
        : a === -1
        ? 'El coeficiente de x es -1, se multiplica por -1 en ambos lados.'
        : `Se divide ambos lados entre ${a}, el coeficiente de x.`,
    hint: getRuleHint('MULT_EQ_PROP'),
    is_key_step: true,
  };

  // Paso 4
  const step4: MathStep = {
    step_number: 4,
    expression_before: step3After,
    expression_after: `x = ${xValStr}`,
    rule_id: 'ARITH_SIMPLIFY',
    rule_name: getRuleName('ARITH_SIMPLIFY'),
    explanation:
      a === 1 || a === -1 ? `x = ${xValStr}` : `${rhs} / ${a} = ${xValStr}`,
    hint: null,
    is_key_step: false,
  };

  // Paso 5
  const verificacion = (a * xVal + b).toFixed(4).replace(/\.?0+$/, '');
  const step5: MathStep = {
    step_number: 5,
    expression_before: `x = ${xValStr}`,
    expression_after: `x = ${xValStr}`,
    rule_id: 'ARITH_SIMPLIFY',
    rule_name: getRuleName('ARITH_SIMPLIFY'),
    explanation: `Verificación: ${a}·(${xValStr}) + ${b} = ${verificacion} = ${c} ✓`,
    hint: null,
    is_key_step: false,
  };

  return [step1, step2, step3, step4, step5];
}

function buildSingleStep(
  input: StepInput,
  ruleId: string,
  explanation: string
): MathStep[] {
  return [
    {
      step_number: 1,
      expression_before: input.expression,
      expression_after: input.result,
      rule_id: ruleId,
      rule_name: getRuleName(ruleId),
      explanation,
      hint: getRuleHint(ruleId),
      is_key_step: true,
    },
  ];
}

export function buildSteps(input: StepInput): MathStep[] {
  switch (input.operation) {
    case 'differentiate':
      return buildDifferentiateSteps(input);

    case 'integrate':
      return buildIntegrateSteps(input);

    case 'solveEquation':
      return buildSolveEquationSteps(input);

    case 'simplify':
      return buildSingleStep(
        input,
        'ALGEBRAIC_SIMPLIFY',
        'Se simplifica la expresión algebraicamente.'
      );

    case 'expand':
      return buildSingleStep(
        input,
        'EXPAND_RULE',
        'Se expande la expresión aplicando la propiedad distributiva.'
      );

    case 'factor':
      return buildSingleStep(
        input,
        'FACTOR_RULE',
        'Se factoriza la expresión identificando factores comunes o patrones.'
      );
  }
}