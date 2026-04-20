interface CalculatorDisplayProps {
  expression: string;
  result: string;
  isError: boolean;
}

export function CalculatorDisplay({ expression, result, isError }: CalculatorDisplayProps) {
  return (
    <div className="bg-(--color-surface-low) rounded-xl border border-(--color-outline)/20 p-4 flex flex-col justify-between min-h-[140px] transition-all focus-within:shadow-[0_0_20px_rgba(37,99,235,0.15)]">
      <div className="flex justify-between items-start mb-1">
        <span className="text-[9px] text-(--color-primary)/50 font-mono tracking-widest uppercase">
          Input: Main_Buffer
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span
          data-testid="display-expression"
          className="font-mono text-lg text-(--color-on-surface-dim) break-all leading-relaxed min-h-[1.2em]"
        >
          {expression}
        </span>
        <div className="flex items-center gap-2 border-t border-(--color-outline)/20 pt-2">
          <svg className="w-4 h-4 text-(--color-success) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
          <span
            data-testid="display-result"
            className={`font-mono tracking-tight ${isError ? 'text-(--color-error) text-2xl' : 'text-(--color-success) text-5xl font-bold'}`}
          >
            {result}
          </span>
        </div>
      </div>
    </div>
  );
}
