import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepViewer } from './StepViewer';
import type { MathStep } from '@engine/stepEngine/types';
import { RULE_BOOK } from '@engine/stepEngine/ruleBook';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const sampleStep: MathStep = {
  step_number: 1,
  expression_before: 'x^2',
  expression_after: '2*x',
  rule_id: 'POWER_RULE_DIFF',
  rule_name: 'Regla de la potencia (derivación)',
  explanation: 'Se aplica la regla de la potencia.',
  hint: 'd/dx(xⁿ) = n·xⁿ⁻¹',
  is_key_step: true,
};

const stepNoHint: MathStep = {
  ...sampleStep,
  hint: null,
  is_key_step: false,
};

function makeStep(n: number): MathStep {
  return { ...sampleStep, step_number: n };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('StepViewer', () => {
  it('con steps=[] no renderiza nada', () => {
    const { container } = render(<StepViewer steps={[]} />);
    expect(screen.queryByTestId('step-viewer-list')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('con 1 paso renderiza ol con data-testid="step-viewer-list"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-viewer-list')).toBeInTheDocument();
  });

  it('con 1 paso renderiza li con data-testid="step-item-1"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-item-1')).toBeInTheDocument();
  });

  it('rule_name aparece en data-testid="step-rule-1"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-rule-1')).toHaveTextContent(sampleStep.rule_name);
  });

  it('explanation aparece en data-testid="step-explanation-1"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent(sampleStep.explanation);
  });

  it('expression_before aparece en data-testid="step-expr-before-1"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-expr-before-1')).toHaveTextContent(sampleStep.expression_before);
  });

  it('expression_after aparece en data-testid="step-expr-after-1"', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-expr-after-1')).toHaveTextContent(sampleStep.expression_after);
  });

  it('hint se muestra cuando hint !== null', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-hint-1')).toHaveTextContent(sampleStep.hint as string);
  });

  it('hint NO se renderiza cuando hint === null', () => {
    render(<StepViewer steps={[stepNoHint]} />);
    expect(screen.queryByTestId('step-hint-1')).toBeNull();
  });

  it('"Paso clave" se muestra cuando is_key_step === true', () => {
    render(<StepViewer steps={[sampleStep]} />);
    expect(screen.getByTestId('step-key-1')).toHaveTextContent('Paso clave');
  });

  it('"Paso clave" NO se renderiza cuando is_key_step === false', () => {
    render(<StepViewer steps={[stepNoHint]} />);
    expect(screen.queryByTestId('step-key-1')).toBeNull();
  });

  it('con 3 pasos renderiza 3 elementos li', () => {
    const steps = [makeStep(1), makeStep(2), makeStep(3)];
    render(<StepViewer steps={steps} />);
    expect(screen.getByTestId('step-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('step-item-3')).toBeInTheDocument();
  });
});

// ─── Step-5: niveles de detalle ───────────────────────────────────────────────

const stepWithLevels: MathStep = {
  step_number: 1,
  expression_before: 'x^2',
  expression_after: '2x',
  rule_id: 'POWER_RULE_DIFF',
  rule_name: 'Regla de la potencia (derivación)',
  explanation: 'fallback explanation',
  hint: 'd/dx(xⁿ) = n·xⁿ⁻¹',
  is_key_step: true,
};

describe('StepViewer — niveles de detalle', () => {
  it('sin level prop muestra step.explanation como fallback', () => {
    render(<StepViewer steps={[stepWithLevels]} />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent('fallback explanation');
  });

  it('level="intermediate" muestra texto intermedio de RULE_BOOK', () => {
    const expected = (RULE_BOOK['POWER_RULE_DIFF'] as any).explanations.intermediate;
    const SV = StepViewer as any;
    render(<SV steps={[stepWithLevels]} level="intermediate" />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent(expected);
  });

  it('level="beginner" muestra texto principiante de RULE_BOOK', () => {
    const expected = (RULE_BOOK['POWER_RULE_DIFF'] as any).explanations.beginner;
    const SV = StepViewer as any;
    render(<SV steps={[stepWithLevels]} level="beginner" />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent(expected);
  });

  it('level="advanced" muestra texto avanzado de RULE_BOOK', () => {
    const expected = (RULE_BOOK['POWER_RULE_DIFF'] as any).explanations.advanced;
    const SV = StepViewer as any;
    render(<SV steps={[stepWithLevels]} level="advanced" />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent(expected);
  });

  it('regla sin explanations en RULE_BOOK muestra step.explanation como fallback', () => {
    const unknownStep: MathStep = { ...stepWithLevels, rule_id: 'UNKNOWN_RULE' };
    const SV = StepViewer as any;
    render(<SV steps={[unknownStep]} level="intermediate" />);
    expect(screen.getByTestId('step-explanation-1')).toHaveTextContent('fallback explanation');
  });
});