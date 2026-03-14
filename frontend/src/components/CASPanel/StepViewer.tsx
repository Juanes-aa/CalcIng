import type { MathStep, DetailLevel } from '@engine/stepEngine/types';
import { RULE_BOOK } from '@engine/stepEngine/ruleBook';

interface StepViewerProps {
  steps: MathStep[];
  level?: DetailLevel;
}

export function StepViewer({ steps, level }: StepViewerProps) {
  if (steps.length === 0) return null;

  return (
    <ol data-testid="step-viewer-list">
      {steps.map((step) => {
        const n = step.step_number;
        const explanation =
          level !== undefined
            ? (RULE_BOOK[step.rule_id]?.explanations?.[level] ?? step.explanation)
            : step.explanation;

        return (
          <li key={n} data-testid={`step-item-${n}`}>
            <span data-testid={`step-rule-${n}`}>{step.rule_name}</span>
            <span data-testid={`step-expr-before-${n}`}>{step.expression_before}</span>
            <span data-testid={`step-expr-after-${n}`}>{step.expression_after}</span>
            <span data-testid={`step-explanation-${n}`}>{explanation}</span>
            {step.hint !== null && (
              <span data-testid={`step-hint-${n}`}>{step.hint}</span>
            )}
            {step.is_key_step && (
              <span data-testid={`step-key-${n}`}>Paso clave</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}