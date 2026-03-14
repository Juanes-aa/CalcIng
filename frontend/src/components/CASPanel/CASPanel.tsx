import { useState } from 'react';
import { useCAS } from '../../hooks/useCAS';
import type { CASOperation } from '../../hooks/useCAS';
import type { DetailLevel } from '@engine/stepEngine/types';
import { StepViewer } from './StepViewer';
import styles from './CASPanel.module.css';

const VARIABLE_OPS = new Set<CASOperation>(['differentiate', 'integrate', 'solveEquation']);
const ORDER_OPS    = new Set<CASOperation>(['differentiate']);

export function CASPanel(): JSX.Element {
  const {
    expression, variable, order, operation, status, result, errorMsg, steps,
    setExpression, setVariable, setOrder, setOperation, execute, reset,
  } = useCAS();

  const [level, setLevel] = useState<DetailLevel>('intermediate');

  const isLoading    = status === 'loading';
  const hideVariable = !VARIABLE_OPS.has(operation);
  const hideOrder    = !ORDER_OPS.has(operation);

  return (
    <section data-testid="cas-panel" className={styles.panel}>
      <select
        data-testid="cas-operation-select"
        value={operation}
        onChange={(e) => setOperation(e.target.value as CASOperation)}
      >
        <option value="simplify">Simplificar</option>
        <option value="differentiate">Derivar</option>
        <option value="integrate">Integrar</option>
        <option value="solveEquation">Resolver ecuación</option>
        <option value="expand">Expandir</option>
        <option value="factor">Factorizar</option>
      </select>

      <input
        data-testid="cas-expression-input"
        type="text"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
      />

      <input
        data-testid="cas-variable-input"
        type="text"
        value={variable}
        onChange={(e) => setVariable(e.target.value)}
        hidden={hideVariable}
      />

      <input
        data-testid="cas-order-input"
        type="number"
        value={order}
        onChange={(e) => setOrder(Number(e.target.value))}
        hidden={hideOrder}
      />

      <button
        data-testid="cas-execute-button"
        onClick={() => execute()}
        disabled={isLoading}
      >
        Ejecutar
      </button>

      <button
        data-testid="cas-reset-button"
        onClick={() => reset()}
        disabled={isLoading}
      >
        Reset
      </button>

      {status === 'success' && <div data-testid="cas-result">{result}</div>}
      {status === 'error'   && <div data-testid="cas-error">{errorMsg}</div>}

      <select
        data-testid="cas-detail-level-select"
        value={level}
        onChange={(e) => setLevel(e.target.value as DetailLevel)}
      >
        <option value="beginner">Principiante</option>
        <option value="intermediate">Intermedio</option>
        <option value="advanced">Avanzado</option>
      </select>

      <StepViewer steps={steps} level={level} />
    </section>
  );
}