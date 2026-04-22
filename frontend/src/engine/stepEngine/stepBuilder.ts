import { MathStep, StepInput } from './types';
import { RULE_BOOK } from './ruleBook';

function getRuleName(ruleId: string): string {
  return RULE_BOOK[ruleId]?.name ?? ruleId;
}

function getRuleHint(ruleId: string): string | null {
  return RULE_BOOK[ruleId]?.hint ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE PARSING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Separa una expresión en términos respetando paréntesis.
 * "x^3 + 2*x - 1" → ["x^3", "+ 2*x", "- 1"]
 */
function splitTerms(expr: string): string[] {
  const terms: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;

    if (depth === 0 && (ch === '+' || ch === '-') && i > 0) {
      if (current.trim()) terms.push(current.trim());
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current.trim()) terms.push(current.trim());
  return terms;
}

function splitFactors(expr: string): string[] {
  const factors: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;

    if (depth === 0 && ch === '*') {
      if (current.trim()) factors.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) factors.push(current.trim());
  return factors;
}

function parsePowerFactor(factor: string): { degree: number } | null {
  const clean = factor.replace(/\s/g, '');
  if (clean === 'x') return { degree: 1 };

  const match = clean.match(/^(\d*\.?\d+)?\*?x(?:\^(\d+))?$/);
  if (!match) return null;

  return { degree: match[2] ? parseInt(match[2], 10) : 1 };
}

function parseTranscendentFactor(factor: string): { fn: string; inner: string } | null {
  const match = factor.replace(/\s/g, '').match(/^(sin|cos|tan|exp|ln|log|sqrt)\((.+)\)$/);
  if (!match) return null;
  return { fn: match[1], inner: match[2] };
}

function shouldUseUSubstitution(expression: string): boolean {
  const factors = splitFactors(expression.replace(/\s/g, ''));
  if (factors.length < 2) return false;

  const algebraic = factors
    .map((factor) => parsePowerFactor(factor))
    .find((parsed) => parsed !== null);
  const transcendent = factors
    .map((factor) => parseTranscendentFactor(factor))
    .find((parsed) => parsed !== null);

  if (!algebraic || !transcendent) return false;

  const innerPower = transcendent.inner.match(/^x(?:\^(\d+))?$/);
  if (!innerPower) return false;

  const innerDegree = innerPower[1] ? parseInt(innerPower[1], 10) : 1;
  return innerDegree === algebraic.degree + 1;
}

/**
 * Clasifica un término e identifica qué regla de derivación aplica.
 */
function classifyTerm(term: string, variable: string): string {
  const t = term.replace(/\s/g, '').replace(/^[+-]/, '');

  if (!t.includes(variable)) return 'CONST_RULE_DIFF';

  // Producto de dos factores dependientes de la variable
  const factors = splitFactors(t);
  if (factors.length > 1) {
    const variableDependent = factors.filter((factor) => factor.includes(variable));
    if (variableDependent.length >= 2) return 'PRODUCT_RULE_DIFF';
  }

  // Función transcendente pura con argumento compuesto → cadena
  const transcMatch = parseTranscendentFactor(t);
  if (transcMatch) {
    if (transcMatch.inner !== variable) return 'CHAIN_RULE_DIFF';
    const directMap: Record<string, string> = {
      sin: 'SIN_RULE_DIFF', cos: 'COS_RULE_DIFF', tan: 'TAN_RULE_DIFF',
      exp: 'EXP_RULE_DIFF', ln: 'LN_RULE_DIFF', log: 'LOG_RULE_DIFF',
      sqrt: 'SQRT_RULE_DIFF',
    };
    return directMap[transcMatch.fn] ?? 'CHAIN_RULE_DIFF';
  }

  return 'POWER_RULE_DIFF';
}

/**
 * Deriva analíticamente un término simple respecto a variable.
 * Cubre: c, x, c*x, x^n, c*x^n, sin(x), cos(x), tan(x), e^x, ln(x).
 */
function diffTerm(term: string, variable: string): string {
  const t = term.replace(/\s/g, '');
  const sign = t.startsWith('-') ? -1 : 1;
  const abs = t.replace(/^[+-]/, '');

  if (!abs.includes(variable)) return '0';

  // x sola
  if (abs === variable) return sign === 1 ? '1' : '-1';

  // c*x^n
  const polyMatch = abs.match(/^(\d*\.?\d*)\*?x\^(\d+)$/);
  if (polyMatch) {
    const c = polyMatch[1] === '' ? 1 : parseFloat(polyMatch[1]);
    const n = parseInt(polyMatch[2], 10);
    const newC = sign * c * n;
    const newN = n - 1;
    if (newN === 0) return String(newC);
    if (newN === 1) return Math.abs(newC) === 1
      ? (newC < 0 ? `-${variable}` : variable)
      : `${newC}*${variable}`;
    return `${newC}*${variable}^${newN}`;
  }

  // c*x (lineal)
  const linearMatch = abs.match(/^(\d*\.?\d*)\*?x$/);
  if (linearMatch) {
    const c = linearMatch[1] === '' ? 1 : parseFloat(linearMatch[1]);
    return String(sign * c);
  }

  // Funciones directas
  if (abs === `sin(${variable})`) return sign === 1 ? `cos(${variable})` : `-cos(${variable})`;
  if (abs === `cos(${variable})`) return sign === 1 ? `-sin(${variable})` : `sin(${variable})`;
  if (abs === `tan(${variable})`) return sign === 1 ? `sec(${variable})^2` : `-sec(${variable})^2`;
  if (abs === `exp(${variable})` || abs === `e^${variable}`) return t;
  if (abs === `ln(${variable})`) return sign === 1 ? `1/${variable}` : `-1/${variable}`;
  if (abs === `log(${variable})`) return sign === 1 ? `1/(${variable}*ln(10))` : `-1/(${variable}*ln(10))`;

  // Regla de la cadena genérica — mostrar notación simbólica
  return `d/d${variable}(${t})`;
}

/**
 * Genera la explicación según la regla aplicada al término.
 */
function explainRule(ruleId: string, term: string, result: string, variable: string): string {
  const t = term.replace(/\s/g, '').replace(/^[+-]/, '');

  switch (ruleId) {
    case 'CONST_RULE_DIFF':
      return `La derivada de una constante es 0: d/d${variable}(${t}) = 0.`;

    case 'POWER_RULE_DIFF': {
      const polyMatch = t.match(/^(\d*\.?\d*)\*?x\^(\d+)$/);
      if (polyMatch) {
        const c = polyMatch[1] === '' ? 1 : parseFloat(polyMatch[1]);
        const n = parseInt(polyMatch[2], 10);
        return `Regla de la potencia: d/d${variable}(${c === 1 ? '' : c + '·'}${variable}^${n}) = ${c === 1 ? '' : c + '·'}${n}·${variable}^${n - 1} = ${result}.`;
      }
      const linMatch = t.match(/^(\d*\.?\d*)\*?x$/);
      if (linMatch) {
        const c = linMatch[1] === '' ? 1 : parseFloat(linMatch[1]);
        return `Derivada lineal: d/d${variable}(${c}·${variable}) = ${c}.`;
      }
      if (t === variable) return `Derivada de ${variable}: d/d${variable}(${variable}) = 1.`;
      return `Se aplica la regla de la potencia: resultado = ${result}.`;
    }

    case 'SIN_RULE_DIFF':
      return `Derivada del seno: d/d${variable}(sin(${variable})) = cos(${variable}).`;
    case 'COS_RULE_DIFF':
      return `Derivada del coseno: d/d${variable}(cos(${variable})) = -sin(${variable}).`;
    case 'TAN_RULE_DIFF':
      return `Derivada de la tangente: d/d${variable}(tan(${variable})) = sec²(${variable}).`;
    case 'EXP_RULE_DIFF':
      return `La exponencial es su propia derivada: d/d${variable}(eˣ) = eˣ.`;
    case 'LN_RULE_DIFF':
      return `Derivada del logaritmo natural: d/d${variable}(ln(${variable})) = 1/${variable}.`;
    case 'CHAIN_RULE_DIFF':
      return `Se aplica la regla de la cadena: d/d${variable}[f(g(${variable}))] = f'(g(${variable}))·g'(${variable}).`;
    case 'PRODUCT_RULE_DIFF':
      return `Se aplica la regla del producto: d/d${variable}(f·g) = f'·g + f·g'.`;

    default:
      return `Se deriva el término ${t} → ${result}.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD DIFFERENTIATE STEPS — LÓGICA PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function buildDifferentiateSteps(input: StepInput): MathStep[] {
  const variable = input.variable ?? 'x';
  const expr = input.expression.trim();
  const steps: MathStep[] = [];
  let stepN = 1;

  const terms = splitTerms(expr);
  const isSum = terms.length > 1;

  // ── Paso 1: Linealidad si hay suma ────────────────────────────────────────
  if (isSum) {
    const expanded = terms
      .map(t => `d/d${variable}(${t.replace(/^[+]/, '').trim()})`)
      .join(' + ')
      .replace(/\+ -/g, '- ');

    steps.push({
      step_number: stepN++,
      expression_before: expr,
      expression_after: expanded,
      rule_id: 'SUM_RULE_DIFF',
      rule_name: getRuleName('SUM_RULE_DIFF'),
      explanation: `La derivada es lineal: se separa la derivada sobre cada término d/d${variable}(f + g) = f' + g'.`,
      hint: getRuleHint('SUM_RULE_DIFF'),
      is_key_step: false,
    });
  }

  // ── Pasos intermedios: derivar cada término ───────────────────────────────
  const derivedTerms: string[] = [];

  for (const term of terms) {
    const cleanTerm = term.replace(/^[+]/, '').trim();
    const ruleId = classifyTerm(cleanTerm, variable);
    const derived = diffTerm(term, variable);
    derivedTerms.push(derived);

    // No mostrar paso de constante si el resultado es 0 y hay otros términos
    // (lo mencionamos pero no lo expandimos innecesariamente)
    const explanation = explainRule(ruleId, cleanTerm, derived, variable);

    steps.push({
      step_number: stepN++,
      expression_before: `d/d${variable}(${cleanTerm})`,
      expression_after: derived,
      rule_id: ruleId,
      rule_name: getRuleName(ruleId),
      explanation,
      hint: getRuleHint(ruleId),
      is_key_step: false,
    });
  }

  // ── Último paso: combinar y mostrar resultado final ───────────────────────
  // Filtrar los 0 si hay otros términos no nulos
  const nonZeroTerms = derivedTerms.filter(t => t !== '0');
  const finalExpr = nonZeroTerms.length > 0
    ? nonZeroTerms.join(' + ').replace(/\+ -/g, '- ')
    : '0';

  steps.push({
    step_number: stepN,
    expression_before: derivedTerms.join(' + ').replace(/\+ -/g, '- '),
    expression_after: input.result,
    rule_id: 'ALGEBRAIC_SIMPLIFY',
    rule_name: 'Resultado final',
    explanation: `Se combinan los términos derivados: ${finalExpr}.`,
    hint: null,
    is_key_step: true,
  });

  return steps;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATE STEPS
// ─────────────────────────────────────────────────────────────────────────────

function detectIntegrateRule(expression: string): string {
  const expr = expression.trim();
  const transcendentFuncs = /\b(sin|cos|tan|exp|ln|log)\b/;
  const algebraicFactor = /\bx(\^\d+)?\b/;

  if (shouldUseUSubstitution(expr)) {
    return 'U_SUBSTITUTION';
  }
  if (expr.includes('*') && transcendentFuncs.test(expr) && algebraicFactor.test(expr)) {
    return 'INTEGRATION_BY_PARTS';
  }
  return 'DIRECT_INTEGRAL_TABLE';
}

function parseProductIntegral(
  expression: string
): { algebraic: string; transcendent: string; transcendentType: string } | null {
  if (!expression.includes('*')) return null;
  const parts = splitFactors(expression);
  if (parts.length < 2) return null;

  const part0 = parts[0].trim();
  const part1 = parts.slice(1).join('*').trim();
  const transcendentPattern = /\b(sin|cos|tan|exp|ln|log)\b/;
  const algebraicPattern = /^(\d+\*)?x(\^(\d+))?$|^x$/;

  const t0 = part0.match(transcendentPattern);
  const t1 = part1.match(transcendentPattern);
  const a0 = algebraicPattern.test(part0);
  const a1 = algebraicPattern.test(part1);

  if (a0 && t1) return { algebraic: part0, transcendent: part1, transcendentType: t1[1] };
  if (a1 && t0) return { algebraic: part1, transcendent: part0, transcendentType: t0[1] };
  return null;
}

function calcular_v(transcendentType: string, transcendent: string): string {
  switch (transcendentType) {
    case 'exp': return transcendent;
    case 'sin': return transcendent.replace('sin', '-cos');
    case 'cos': return transcendent.replace('cos', 'sin');
    case 'ln':  return 'x·ln(x) - x';
    default:    return transcendent;
  }
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

function buildIntegrateSteps(input: StepInput): MathStep[] {
  const ruleId = detectIntegrateRule(input.expression);
  const ruleName = getRuleName(ruleId);

  if (ruleId === 'DIRECT_INTEGRAL_TABLE') {
    return [
      {
        step_number: 1,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'DIRECT_INTEGRAL_TABLE',
        rule_name: getRuleName('DIRECT_INTEGRAL_TABLE'),
        explanation: 'Se reconoce una forma directa de la tabla de integrales.',
        hint: getRuleHint('DIRECT_INTEGRAL_TABLE'),
        is_key_step: false,
      },
      {
        step_number: 2,
        expression_before: input.expression,
        expression_after: input.result + ' + C',
        rule_id: 'DIRECT_INTEGRAL_TABLE',
        rule_name: getRuleName('DIRECT_INTEGRAL_TABLE'),
        explanation: 'Se aplica la fórmula de integración directa y se agrega la constante C.',
        hint: null,
        is_key_step: true,
      },
    ];
  }

  if (ruleId === 'U_SUBSTITUTION') {
    return [
      {
        step_number: 1,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'U_SUBSTITUTION',
        rule_name: getRuleName('U_SUBSTITUTION'),
        explanation: 'Se identifica u = g(x) cuya derivada aparece en el integrando.',
        hint: getRuleHint('U_SUBSTITUTION'),
        is_key_step: false,
      },
      {
        step_number: 2,
        expression_before: input.expression,
        expression_after: '∫ f(u) du',
        rule_id: 'U_SUBSTITUTION',
        rule_name: getRuleName('U_SUBSTITUTION'),
        explanation: 'Se sustituye u y du para simplificar la integral.',
        hint: null,
        is_key_step: true,
      },
      {
        step_number: 3,
        expression_before: '∫ f(u) du',
        expression_after: input.result + ' + C',
        rule_id: 'U_SUBSTITUTION',
        rule_name: getRuleName('U_SUBSTITUTION'),
        explanation: 'Se resuelve la integral en términos de u y se regresa a la variable original.',
        hint: null,
        is_key_step: false,
      },
    ];
  }

  // INTEGRATION_BY_PARTS
  const parsed = parseProductIntegral(input.expression);

  if (parsed === null) {
    return [
      {
        step_number: 1,
        expression_before: input.expression,
        expression_after: input.expression,
        rule_id: 'INTEGRATION_BY_PARTS',
        rule_name: ruleName,
        explanation: 'Se identifica el método de integración por partes.',
        hint: getRuleHint('INTEGRATION_BY_PARTS'),
        is_key_step: false,
      },
      {
        step_number: 2,
        expression_before: input.expression,
        expression_after: input.result + ' + C',
        rule_id: 'INTEGRATION_BY_PARTS',
        rule_name: ruleName,
        explanation: 'Se aplica integración por partes: ∫u dv = uv − ∫v du.',
        hint: null,
        is_key_step: true,
      },
    ];
  }

  const { algebraic, transcendent, transcendentType } = parsed;
  const u = algebraic;
  const du = algebraic === 'x' ? 'dx'
    : algebraic.includes('^') ? derivada_aproximada(algebraic) + ' dx'
    : 'dx';
  const v = calcular_v(transcendentType, transcendent);

  return [
    {
      step_number: 1,
      expression_before: '∫ ' + input.expression + ' dx',
      expression_after: '∫ ' + input.expression + ' dx',
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: `Se identifica producto de función algebraica (${algebraic}) y transcendente (${transcendent}). Se aplica integración por partes.`,
      hint: getRuleHint('INTEGRATION_BY_PARTS'),
      is_key_step: false,
    },
    {
      step_number: 2,
      expression_before: '∫ ' + input.expression + ' dx',
      expression_after: `u = ${u},  dv = ${transcendent} dx`,
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: `Por regla ILATE: algebraica tiene prioridad. Se elige u = ${u}, dv = ${transcendent} dx.`,
      hint: 'ILATE: Inversa > Logarítmica > Algebraica > Trigonométrica > Exponencial',
      is_key_step: false,
    },
    {
      step_number: 3,
      expression_before: `u = ${u},  dv = ${transcendent} dx`,
      expression_after: `du = ${du},  v = ${v}`,
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: 'Se calcula du derivando u, y v integrando dv.',
      hint: null,
      is_key_step: false,
    },
    {
      step_number: 4,
      expression_before: `du = ${du},  v = ${v}`,
      expression_after: `${u}·${v} − ∫${v} ${du}`,
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: 'Se aplica la fórmula ∫u dv = uv − ∫v du.',
      hint: null,
      is_key_step: true,
    },
    {
      step_number: 5,
      expression_before: `${u}·${v} − ∫${v} ${du}`,
      expression_after: input.result + ' + C',
      rule_id: 'INTEGRATION_BY_PARTS',
      rule_name: ruleName,
      explanation: 'Se resuelve la integral restante y se agrega la constante de integración C.',
      hint: null,
      is_key_step: false,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SOLVE EQUATION STEPS
// ─────────────────────────────────────────────────────────────────────────────

function parseLinearEquation(equation: string): { a: number; b: number; c: number } | null {
  if (/\^/.test(equation)) return null;
  if (/\b(sin|cos|tan|exp|ln|log|sqrt)\s*\(/.test(equation)) return null;
  if (/[a-wyz]/.test(equation)) return null;
  if (/\*/.test(equation)) return null;

  const re = /^(-?\d*\.?\d*)x\s*([+-]\s*\d+\.?\d*)?\s*=\s*(-?\d+\.?\d*)$/;
  const match = equation.trim().match(re);
  if (!match) return null;

  const rawA = match[1];
  const rawB = match[2];
  const rawC = match[3];

  let a: number;
  if (rawA === '' || rawA === undefined) a = 1;
  else if (rawA === '-') a = -1;
  else { a = parseFloat(rawA); if (isNaN(a)) return null; }

  let b: number;
  if (rawB === undefined || rawB === '') b = 0;
  else { b = parseFloat(rawB.replace(/\s/g, '')); if (isNaN(b)) return null; }

  const c = parseFloat(rawC);
  if (isNaN(c) || a === 0) return null;

  return { a, b, c };
}

function buildSolveEquationSteps(input: StepInput): MathStep[] {
  const parsed = parseLinearEquation(input.expression);

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
        hint: null,
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
        hint: null,
        is_key_step: false,
      },
    ];
  }

  const { a, b, c } = parsed;
  const rhs = c - b;
  const xVal = rhs / a;
  const xValStr = Number.isInteger(xVal) ? String(xVal) : xVal.toFixed(4);
  const bDisplay = b < 0 ? `(${b})` : String(b);

  const step1After = b === 0 ? input.expression : `${a}x = ${c} - ${bDisplay}`;
  const step2After = b === 0 ? input.expression : `${a}x = ${rhs}`;
  const step3After = a === 1 || a === -1 ? `x = ${rhs}` : `x = ${rhs} / ${a}`;
  const verificacion = (a * xVal + b).toFixed(4).replace(/\.?0+$/, '');

  return [
    {
      step_number: 1,
      expression_before: input.expression,
      expression_after: step1After,
      rule_id: 'ADDITIVE_EQ_PROP',
      rule_name: getRuleName('ADDITIVE_EQ_PROP'),
      explanation: b === 0
        ? 'No hay término independiente que transponer.'
        : `Se resta ${bDisplay} en ambos lados para aislar el término con x.`,
      hint: getRuleHint('ADDITIVE_EQ_PROP'),
      is_key_step: false,
    },
    {
      step_number: 2,
      expression_before: step1After,
      expression_after: step2After,
      rule_id: 'ARITH_SIMPLIFY',
      rule_name: getRuleName('ARITH_SIMPLIFY'),
      explanation: b === 0 ? 'No hay simplificación necesaria.' : `${c} - ${bDisplay} = ${rhs}`,
      hint: null,
      is_key_step: false,
    },
    {
      step_number: 3,
      expression_before: step2After,
      expression_after: step3After,
      rule_id: 'MULT_EQ_PROP',
      rule_name: getRuleName('MULT_EQ_PROP'),
      explanation: a === 1
        ? 'El coeficiente de x es 1, no es necesario dividir.'
        : a === -1
        ? 'El coeficiente de x es −1, se multiplica por −1 en ambos lados.'
        : `Se divide ambos lados entre ${a}, el coeficiente de x.`,
      hint: getRuleHint('MULT_EQ_PROP'),
      is_key_step: true,
    },
    {
      step_number: 4,
      expression_before: step3After,
      expression_after: `x = ${xValStr}`,
      rule_id: 'ARITH_SIMPLIFY',
      rule_name: getRuleName('ARITH_SIMPLIFY'),
      explanation: a === 1 || a === -1 ? `x = ${xValStr}` : `${rhs} / ${a} = ${xValStr}`,
      hint: null,
      is_key_step: false,
    },
    {
      step_number: 5,
      expression_before: `x = ${xValStr}`,
      expression_after: `x = ${xValStr} ✓`,
      rule_id: 'ARITH_SIMPLIFY',
      rule_name: 'Verificación',
      explanation: `Verificación: ${a}·(${xValStr}) + ${b} = ${verificacion} = ${c} ✓`,
      hint: null,
      is_key_step: false,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE STEP (simplify, expand, factor)
// ─────────────────────────────────────────────────────────────────────────────

function buildSingleStep(input: StepInput, ruleId: string, explanation: string): MathStep[] {
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

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export function buildSteps(input: StepInput): MathStep[] {
  switch (input.operation) {
    case 'differentiate':
      return buildDifferentiateSteps(input);
    case 'integrate':
      return buildIntegrateSteps(input);
    case 'solveEquation':
      return buildSolveEquationSteps(input);
    case 'simplify':
      return buildSingleStep(input, 'ALGEBRAIC_SIMPLIFY', 'Se simplifica la expresión algebraicamente.');
    case 'expand':
      return buildSingleStep(input, 'EXPAND_RULE', 'Se expande la expresión aplicando la propiedad distributiva.');
    case 'factor':
      return buildSingleStep(input, 'FACTOR_RULE', 'Se factoriza la expresión identificando factores comunes o patrones.');
  }
}
