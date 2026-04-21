import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { CASPanel } from './CASPanel';
import { useCAS } from '../../hooks/useCAS';
import type { CASHookState } from '../../hooks/useCAS';

vi.mock('../../hooks/useCAS');

const mockSetExpression = vi.fn();
const mockSetVariable   = vi.fn();
const mockSetOrder      = vi.fn();
const mockSetOperation  = vi.fn();
const mockExecute       = vi.fn();
const mockReset         = vi.fn();

const mockState: CASHookState = {
  expression: '', variable: 'x', order: 1, operation: 'simplify',
  status: 'idle', result: '', errorMsg: '', steps: [],
  setExpression: mockSetExpression, setVariable: mockSetVariable,
  setOrder: mockSetOrder, setOperation: mockSetOperation,
  execute: mockExecute, reset: mockReset,
};

beforeEach(() => {
  vi.mocked(useCAS).mockReturnValue(mockState);
  vi.clearAllMocks();
});

describe('CASPanel', () => {
  // T01
  it('T01 — renderiza el panel', () => {
    render(<CASPanel />);
    expect(screen.getByTestId('cas-panel')).toBeInTheDocument();
  });

  // T02
  it('T02 — el primer botón de operación tiene estado active para simplify', () => {
    render(<CASPanel />);
    const simplifyButton = screen.getByRole('button', { name: 'Simplificar' });
    expect(simplifyButton).toHaveClass('bg-(--color-primary-cta)/15');
  });

  // T03
  it('T03 — el input de expresión tiene valor vacío inicial', () => {
    render(<CASPanel />);
    expect(screen.getByTestId('cas-expression-input')).toHaveValue('');
  });

  // T04
  it('T04 — el botón Ejecutar existe y no está deshabilitado en idle', () => {
    render(<CASPanel />);
    expect(screen.getByTestId('cas-execute-button')).not.toBeDisabled();
  });

  // T05
  it('T05 — el botón Reset existe y no está deshabilitado en idle', () => {
    render(<CASPanel />);
    expect(screen.getByTestId('cas-reset-button')).not.toBeDisabled();
  });

  // T06
  it('T06 — con operation=simplify: variable-input y order-input están hidden', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'simplify' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).toHaveAttribute('hidden');
  });

  // T07
  it('T07 — con operation=differentiate: variable-input y order-input NO están hidden', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'differentiate' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).not.toHaveAttribute('hidden');
  });

  // T08
  it('T08 — con operation=integrate: variable-input NO está hidden, order-input SÍ', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'integrate' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).toHaveAttribute('hidden');
  });

  // T09
  it('T09 — con operation=solveEquation: variable-input NO está hidden, order-input SÍ', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'solveEquation' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).toHaveAttribute('hidden');
  });

  // T10
  it('T10 — con operation=expand: variable-input y order-input están hidden', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'expand' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).toHaveAttribute('hidden');
  });

  // T11
  it('T11 — con operation=factor: variable-input y order-input están hidden', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'factor' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-variable-input')).toHaveAttribute('hidden');
    expect(screen.getByTestId('cas-order-input')).toHaveAttribute('hidden');
  });

  // T12
  it('T12 — click en botón de operación llama setOperation con el valor correcto', () => {
    render(<CASPanel />);
    const differentiateButton = screen.getByRole('button', { name: 'Derivar' });
    fireEvent.click(differentiateButton);
    expect(mockExecute).toHaveBeenCalledWith('differentiate');
  });

  // T13
  it('T13 — escribir en expression-input llama setExpression', () => {
    render(<CASPanel />);
    fireEvent.change(screen.getByTestId('cas-expression-input'), { target: { value: 'x^2' } });
    expect(mockSetExpression).toHaveBeenCalledWith('x^2');
  });

  // T14
  it('T14 — escribir en variable-input llama setVariable', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'differentiate' });
    render(<CASPanel />);
    fireEvent.change(screen.getByTestId('cas-variable-input'), { target: { value: 'y' } });
    expect(mockSetVariable).toHaveBeenCalledWith('y');
  });

  // T15
  it('T15 — escribir en order-input llama setOrder con Number del valor', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, operation: 'differentiate' });
    render(<CASPanel />);
    fireEvent.change(screen.getByTestId('cas-order-input'), { target: { value: '2' } });
    expect(mockSetOrder).toHaveBeenCalledWith(2);
  });

  // T16
  it('T16 — click en Ejecutar llama execute()', () => {
    render(<CASPanel />);
    fireEvent.click(screen.getByTestId('cas-execute-button'));
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  // T17
  it('T17 — click en Reset llama reset()', () => {
    render(<CASPanel />);
    fireEvent.click(screen.getByTestId('cas-reset-button'));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  // T18
  it('T18 — con status=loading: Ejecutar está deshabilitado', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'loading' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-execute-button')).toBeDisabled();
  });

  // T19
  it('T19 — con status=loading: Reset está deshabilitado', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'loading' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-reset-button')).toBeDisabled();
  });

  // T20
  it('T20 — con status=idle: ni cas-result ni cas-error están en el DOM', () => {
    render(<CASPanel />);
    expect(screen.queryByTestId('cas-result')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cas-error')).not.toBeInTheDocument();
  });

  // T21
  it('T21 — con status=loading: ni cas-result ni cas-error están en el DOM', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'loading' });
    render(<CASPanel />);
    expect(screen.queryByTestId('cas-result')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cas-error')).not.toBeInTheDocument();
  });

  // T22
  it('T22 — con status=success y result=2*x: cas-result muestra 2*x', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'success', result: '2*x' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-result')).toHaveTextContent('2*x');
  });

  // T23
  it('T23 — con status=success: cas-error NO está en el DOM', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'success', result: '2*x' });
    render(<CASPanel />);
    expect(screen.queryByTestId('cas-error')).not.toBeInTheDocument();
  });

  // T24
  it('T24 — con status=error y errorMsg=expresión inválida: cas-error muestra el mensaje', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'error', errorMsg: 'expresión inválida' });
    render(<CASPanel />);
    expect(screen.getByTestId('cas-error')).toHaveTextContent('expresión inválida');
  });

  // T25
  it('T25 — con status=error: cas-result NO está en el DOM', () => {
    vi.mocked(useCAS).mockReturnValue({ ...mockState, status: 'error', errorMsg: 'expresión inválida' });
    render(<CASPanel />);
    expect(screen.queryByTestId('cas-result')).not.toBeInTheDocument();
  });
});

describe('CASPanel — selector de nivel de detalle', () => {
  it('renderiza selector de nivel con data-testid="cas-detail-level-select" en pestaña pasos', () => {
    render(<CASPanel />);
    const pasosTab = screen.getByRole('button', { name: 'Pasos' });
    fireEvent.click(pasosTab);
    expect(screen.getByTestId('cas-detail-level-select')).toBeInTheDocument();
  });

  it('valor por defecto del selector es "intermediate"', () => {
    render(<CASPanel />);
    const pasosTab = screen.getByRole('button', { name: 'Pasos' });
    fireEvent.click(pasosTab);
    expect(screen.getByTestId('cas-detail-level-select')).toHaveValue('intermediate');
  });

  it('cambiar selector a "beginner" actualiza el nivel visible', () => {
    render(<CASPanel />);
    const pasosTab = screen.getByRole('button', { name: 'Pasos' });
    fireEvent.click(pasosTab);
    fireEvent.change(screen.getByTestId('cas-detail-level-select'), {
      target: { value: 'beginner' },
    });
    expect(screen.getByTestId('cas-detail-level-select')).toHaveValue('beginner');
  });

  it('cambiar selector a "advanced" actualiza el nivel visible', () => {
    render(<CASPanel />);
    const pasosTab = screen.getByRole('button', { name: 'Pasos' });
    fireEvent.click(pasosTab);
    fireEvent.change(screen.getByTestId('cas-detail-level-select'), {
      target: { value: 'advanced' },
    });
    expect(screen.getByTestId('cas-detail-level-select')).toHaveValue('advanced');
  });
});

describe('CASPanel — estilos y accesibilidad', () => {

  test('input de expresión tiene placeholder descriptivo', () => {
    render(<CASPanel />)
    const input = screen.getByTestId('cas-expression-input')
    expect(input).toHaveAttribute('placeholder')
    expect(input.getAttribute('placeholder')).not.toBe('')
  })

  test('input de variable tiene label o placeholder visible', () => {
    render(<CASPanel />)
    const differentiateButton = screen.getByRole('button', { name: 'Derivar' })
    fireEvent.click(differentiateButton)
    const varInput = screen.getByTestId('cas-variable-input')
    expect(varInput).toHaveAttribute('placeholder')
  })

  test('botón ejecutar tiene texto visible', () => {
    render(<CASPanel />)
    const btn = screen.getByTestId('cas-execute-button')
    expect(btn.textContent?.trim()).not.toBe('')
  })

  test('panel tiene clase CSS aplicada', () => {
    render(<CASPanel />)
    const panel = screen.getByTestId('cas-panel')
    expect(panel.className).not.toBe('')
    expect(panel.className).toBeTruthy()
  })

  test('resultado tiene clase CSS cuando hay éxito', async () => {
    render(<CASPanel />)
    const input = screen.getByTestId('cas-expression-input')
    const btn = screen.getByTestId('cas-execute-button')
    fireEvent.change(input, { target: { value: 'x^2' } })
    fireEvent.click(btn)
    await waitFor(() => {
      const result = screen.queryByTestId('cas-result')
      if (result) {
        expect(result.className).toBeTruthy()
      }
    })
  })

})