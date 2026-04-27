import { useState, useCallback } from 'react';
import type { CASEngine, CASResult } from '@engine/cas/casEngine';
import { getActiveCASEngine } from '@engine/cas/casSelector';
import type { MathStep } from '@engine/stepEngine/types';
import { buildSteps } from '@engine/stepEngine/stepBuilder';
import type { StepOperation } from '@engine/stepEngine/types';
import { formatResult } from './formatResult';

export type CASOperation =
  | 'simplify'
  | 'differentiate'
  | 'integrate'
  | 'solveEquation'
  | 'expand'
  | 'factor';

export type CASStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CASHookState {
  expression:   string;
  variable:     string;
  order:        number;
  operation:    CASOperation;
  status:       CASStatus;
  result:       string;
  errorMsg:     string;
  steps:        MathStep[];
  setExpression:  (expr: string) => void;
  setVariable:    (v: string) => void;
  setOrder:       (n: number) => void;
  setOperation:   (op: CASOperation) => void;
  execute:        (overrideOp?: CASOperation) => Promise<void>;
  reset:          () => void;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function useCAS(engine: CASEngine = getActiveCASEngine()): CASHookState {
  const [expression, setExpression] = useState<string>('');
  const [variable,   setVariable]   = useState<string>('x');
  const [order,      setOrder]      = useState<number>(1);
  const [operation,  setOperation]  = useState<CASOperation>('simplify');
  const [status,     setStatus]     = useState<CASStatus>('idle');
  const [result,     setResult]     = useState<string>('');
  const [errorMsg,   setErrorMsg]   = useState<string>('');
  const [steps,      setSteps]      = useState<MathStep[]>([]);

  const execute = useCallback(async (overrideOp?: CASOperation): Promise<void> => {
    if (expression.trim() === '') return;

    // Si viene override, sincroniza el estado visual antes de ejecutar.
    // Esto resuelve el race condition donde setOperation + execute() en el
    // mismo ciclo haría que execute corriera con la operación anterior.
    const activeOp = overrideOp ?? operation;
    if (overrideOp !== undefined) setOperation(overrideOp);

    setStatus('loading');

    try {
      let casResult: CASResult;
      switch (activeOp) {
        case 'simplify':
          casResult = await engine.simplify(expression);
          break;
        case 'differentiate':
          casResult = await engine.differentiate(expression, variable, order);
          break;
        case 'integrate':
          casResult = await engine.integrate(expression, variable);
          break;
        case 'solveEquation':
          casResult = await engine.solveEquation(expression, variable);
          break;
        case 'expand':
          casResult = await engine.expand(expression);
          break;
        case 'factor':
          casResult = await engine.factor(expression);
          break;
        default: {
          const _exhaustive: never = activeOp;
          throw new Error(`Operación no soportada: ${_exhaustive}`);
        }
      }

      if (casResult.status === 'success') {
        const formatted = formatResult(casResult.result, activeOp, variable);
        setResult(formatted);
        setErrorMsg('');
        setStatus('success');
        const builtSteps = buildSteps({
          operation: activeOp as StepOperation,
          expression,
          variable,
          order,
          result: formatted,
        });
        setSteps(builtSteps);
      } else {
        setResult('');
        setErrorMsg(casResult.message);
        setStatus('error');
        setSteps([]);
      }
    } catch (err: unknown) {
      setResult('');
      setErrorMsg(getErrorMessage(err));
      setStatus('error');
      setSteps([]);
    }
  }, [engine, expression, variable, order, operation]);

  const reset = useCallback((): void => {
    setStatus('idle');
    setResult('');
    setErrorMsg('');
    setSteps([]);
  }, []);

  return {
    expression,
    variable,
    order,
    operation,
    status,
    result,
    errorMsg,
    steps,
    setExpression,
    setVariable,
    setOrder,
    setOperation,
    execute,
    reset,
  };
}
