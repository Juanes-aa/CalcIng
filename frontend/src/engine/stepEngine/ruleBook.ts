export const RULE_BOOK: Record<string, {
  name: string;
  hint: string | null;
  explanations: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
}> = {
  POWER_RULE_DIFF: {
    name: 'Regla de la potencia (derivación)',
    hint: 'd/dx(xⁿ) = n·xⁿ⁻¹',
    explanations: {
      beginner:     'La regla de la potencia dice que xⁿ se deriva bajando el exponente y restándole 1: d/dx(xⁿ) = n·xⁿ⁻¹.',
      intermediate: 'Regla de la potencia: d/dx(xⁿ) = n·xⁿ⁻¹ para n∈ℝ.',
      advanced:     'Caso particular de la regla de la cadena con f(x)=xⁿ.',
    },
  },
  PRODUCT_RULE_DIFF: {
    name: 'Regla del producto (derivación)',
    hint: "d/dx(f·g) = f'·g + f·g'",
    explanations: {
      beginner:     'Para multiplicar dos funciones, usamos la regla del producto: (uv)′ = u′v + uv′.',
      intermediate: "Aplicamos la regla del producto: d/dx(fg) = f′·g + f·g′.",
      advanced:     'Por la regla de Leibniz: d(uv) = v·du + u·dv.',
    },
  },
  CHAIN_RULE_DIFF: {
    name: 'Regla de la cadena',
    hint: "d/dx f(g(x)) = f'(g(x))·g'(x)",
    explanations: {
      beginner:     'Como tenemos una función dentro de otra, usamos la regla de la cadena: la derivada de afuera × derivada de adentro.',
      intermediate: "Regla de la cadena: d/dx f(g(x)) = f′(g(x))·g′(x).",
      advanced:     "Composición de funciones: (f∘g)′ = (f′∘g)·g′.",
    },
  },
  QUOTIENT_RULE_DIFF: {
    name: 'Regla del cociente (derivación)',
    hint: "(f/g)' = (f'g - fg') / g²",
    explanations: {
      beginner:     'Se aplica la regla del cociente para obtener la derivada.',
      intermediate: 'Se aplica la regla del cociente para obtener la derivada.',
      advanced:     'Se aplica la regla del cociente para obtener la derivada.',
    },
  },
  CONST_RULE_DIFF: {
    name: 'Derivada de constante',
    hint: 'd/dx(c) = 0',
    explanations: {
      beginner:     'La derivada de una constante es cero.',
      intermediate: 'La derivada de una constante es cero.',
      advanced:     'La derivada de una constante es cero.',
    },
  },
  SUM_RULE_DIFF: {
    name: 'Linealidad de la derivada',
    hint: "d/dx(f + g) = f' + g'",
    explanations: {
      beginner:     'Se aplica la linealidad de la derivada término a término.',
      intermediate: 'Se aplica la linealidad de la derivada término a término.',
      advanced:     'Se aplica la linealidad de la derivada término a término.',
    },
  },
  DIRECT_INTEGRAL_TABLE: {
    name: 'Integral directa de tabla',
    hint: null,
    explanations: {
      beginner:     'Se reconoce una forma directa de la tabla de integrales y se aplica la fórmula.',
      intermediate: 'Se reconoce una forma directa de la tabla de integrales y se aplica la fórmula.',
      advanced:     'Se reconoce una forma directa de la tabla de integrales y se aplica la fórmula.',
    },
  },
  INTEGRATION_BY_PARTS: {
    name: 'Integración por partes',
    hint: '∫u dv = uv - ∫v du  (regla ILATE)',
    explanations: {
      beginner:     'Usamos integración por partes porque tenemos dos funciones multiplicadas. La regla es: ∫u dv = uv - ∫v du.',
      intermediate: 'Integración por partes: ∫u dv = uv - ∫v du. Elegimos u y dv según la regla ILATE.',
      advanced:     'Fórmula de integración por partes derivada del producto: d(uv) = u dv + v du → ∫u dv = uv - ∫v du.',
    },
  },
  U_SUBSTITUTION: {
    name: 'Sustitución algebraica (u)',
    hint: "Si u = g(x), entonces du = g'(x)dx",
    explanations: {
      beginner:     "Reconocemos que el integrando contiene una función y su derivada. Usamos la sustitución u=g(x).",
      intermediate: "Sustitución algebraica: si u=g(x), entonces du=g′(x)dx. Reescribimos la integral en términos de u.",
      advanced:     "Sea u = g(x), du = g′(x)dx. La integral ∫f(g(x))g′(x)dx se transforma en ∫f(u)du.",
    },
  },
  ADDITIVE_EQ_PROP: {
    name: 'Propiedad aditiva de la igualdad',
    hint: 'Si a = b, entonces a + c = b + c',
    explanations: {
      beginner:     'Se aplica la propiedad aditiva de la igualdad para transponer términos.',
      intermediate: 'Se aplica la propiedad aditiva de la igualdad para transponer términos.',
      advanced:     'Se aplica la propiedad aditiva de la igualdad para transponer términos.',
    },
  },
  MULT_EQ_PROP: {
    name: 'Propiedad multiplicativa de la igualdad',
    hint: 'Si a = b, entonces a·c = b·c',
    explanations: {
      beginner:     'Se aplica la propiedad multiplicativa de la igualdad para despejar la variable.',
      intermediate: 'Se aplica la propiedad multiplicativa de la igualdad para despejar la variable.',
      advanced:     'Se aplica la propiedad multiplicativa de la igualdad para despejar la variable.',
    },
  },
  ARITH_SIMPLIFY: {
    name: 'Simplificación aritmética',
    hint: null,
    explanations: {
      beginner:     'Se simplifica aritméticamente.',
      intermediate: 'Se simplifica aritméticamente.',
      advanced:     'Se simplifica aritméticamente.',
    },
  },
  ALGEBRAIC_SIMPLIFY: {
    name: 'Simplificación algebraica',
    hint: null,
    explanations: {
      beginner:     'Se simplifica la expresión algebraicamente.',
      intermediate: 'Se simplifica la expresión algebraicamente.',
      advanced:     'Se simplifica la expresión algebraicamente.',
    },
  },
  EXPAND_RULE: {
    name: 'Expansión algebraica',
    hint: null,
    explanations: {
      beginner:     'Se expande la expresión aplicando la propiedad distributiva.',
      intermediate: 'Se expande la expresión aplicando la propiedad distributiva.',
      advanced:     'Se expande la expresión aplicando la propiedad distributiva.',
    },
  },
  FACTOR_RULE: {
    name: 'Factorización',
    hint: null,
    explanations: {
      beginner:     'Se factoriza la expresión identificando factores comunes o patrones.',
      intermediate: 'Se factoriza la expresión identificando factores comunes o patrones.',
      advanced:     'Se factoriza la expresión identificando factores comunes o patrones.',
    },
  },
};