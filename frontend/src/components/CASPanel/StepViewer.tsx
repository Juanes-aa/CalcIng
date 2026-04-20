import type { MathStep, DetailLevel } from '@engine/stepEngine/types';
import { RULE_BOOK } from '@engine/stepEngine/ruleBook';

interface StepViewerProps {
  steps: MathStep[];
  level?: DetailLevel;
}

export function StepViewer({ steps, level }: StepViewerProps) {
  if (steps.length === 0) return null;

  return (
    <ol data-testid="step-viewer-list" className="flex flex-col gap-2">
      {steps.map((step) => {
        const n = step.step_number;
        const explanation =
          level !== undefined
            ? (RULE_BOOK[step.rule_id]?.explanations?.[level] ?? step.explanation)
            : step.explanation;

        return (
          <li
            key={n}
            data-testid={`step-item-${n}`}
            className="bg-surface-mid rounded-lg p-3 flex flex-col gap-1.5 border border-outline/10"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary-cta/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                {n}
              </span>
              <span
                data-testid={`step-rule-${n}`}
                className="text-[11px] font-bold text-primary uppercase tracking-wider"
              >
                {step.rule_name}
              </span>
              {step.is_key_step && (
                <span
                  data-testid={`step-key-${n}`}
                  className="ml-auto text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                >
                  Paso clave
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span data-testid={`step-expr-before-${n}`} className="text-on-surface-dim">{step.expression_before}</span>
              <svg className="w-3 h-3 text-primary-cta shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
              <span data-testid={`step-expr-after-${n}`} className="text-success">{step.expression_after}</span>
            </div>
            <span data-testid={`step-explanation-${n}`} className="text-[11px] text-on-surface-dim leading-relaxed">
              {explanation}
            </span>
            {step.hint !== null && (
              <span
                data-testid={`step-hint-${n}`}
                className="text-[10px] text-primary/60 italic"
              >
                {step.hint}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}