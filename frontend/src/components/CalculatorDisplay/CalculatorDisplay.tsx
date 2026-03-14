import styles from './CalculatorDisplay.module.css';

interface CalculatorDisplayProps {
  expression: string;
  result: string;
  isError: boolean;
}

export function CalculatorDisplay({ expression, result, isError }: CalculatorDisplayProps) {
  return (
    <div className={styles.display}>
      <span
        data-testid="display-expression"
        className={styles.expression}
      >
        {expression}
      </span>
      <span
        data-testid="display-result"
        className={`${styles.result}${isError ? ` ${styles.error}` : ''}`}
      >
        {result}
      </span>
    </div>
  );
}
