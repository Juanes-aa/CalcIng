import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';

// ─── Mock del engine ──────────────────────────────────────────────────────────
//
// El hook no debe testear el engine — eso ya lo cubren los 93 tests de engine.
// Mockeamos evaluate() para que los tests sean deterministas y rápidos,
// sin depender de mathjs ni de inicialización del engine.

vi.mock('@engine/mathEngine', () => ({
  evaluate: vi.fn(),
}));

import { evaluate } from '@engine/mathEngine';
const mockEvaluate = vi.mocked(evaluate);

// ─── Helper ───────────────────────────────────────────────────────────────────

function press(result: { current: ReturnType<typeof useCalculator> }, key: string) {
  act(() => result.current.handleKeyPress(key));
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('useCalculator', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    mockEvaluate.mockReturnValue('0');
  });

  // --- Estado inicial ---

  describe('estado inicial', () => {
    it('expression arranca vacía', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.expression).toBe('');
    });

    it('result arranca como string vacío', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.result).toBe('');
    });

    it('isError arranca en false', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.isError).toBe(false);
    });

    it('angleMode arranca en RAD', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.angleMode).toBe('RAD');
    });

    it('expone handleKeyPress como función', () => {
      const { result } = renderHook(() => useCalculator());
      expect(typeof result.current.handleKeyPress).toBe('function');
    });
  });

  // --- Construcción de expresión ---

  describe('construcción de expresión', () => {
    it('presionar un dígito lo agrega a expression', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      expect(result.current.expression).toBe('5');
    });

    it('presionar varios dígitos los concatena en orden', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '2');
      press(result, '3');
      expect(result.current.expression).toBe('123');
    });

    it('presionar un operador lo agrega a expression', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '4');
      press(result, '+');
      expect(result.current.expression).toBe('4+');
    });

    it('presionar una función agrega el token completo con paréntesis', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'sin(');
      expect(result.current.expression).toBe('sin(');
    });

    it('presionar pi agrega "pi" a la expresión', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'pi');
      expect(result.current.expression).toBe('pi');
    });

    it('presionar ^ agrega "^" a la expresión', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '2');
      press(result, '^');
      expect(result.current.expression).toBe('2^');
    });

    it('secuencia completa: "sin(90)" construye la expresión correcta', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'sin(');
      press(result, '9');
      press(result, '0');
      press(result, ')');
      expect(result.current.expression).toBe('sin(90)');
    });

    it('presionar "." agrega el punto decimal', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '3');
      press(result, '.');
      press(result, '1');
      expect(result.current.expression).toBe('3.1');
    });
  });

  // --- CLEAR ---

  describe('tecla CLEAR', () => {
    it('resetea expression a string vacío', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '4');
      press(result, '+');
      press(result, '2');
      press(result, 'CLEAR');
      expect(result.current.expression).toBe('');
    });

    it('resetea result a string vacío', () => {
      mockEvaluate.mockReturnValue('6');
      const { result } = renderHook(() => useCalculator());
      press(result, '4');
      press(result, '+');
      press(result, '2');
      press(result, '=');
      press(result, 'CLEAR');
      expect(result.current.result).toBe('');
    });

    it('resetea isError a false', () => {
      mockEvaluate.mockReturnValue('Error de Sintaxis');
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '=');
      // forzamos error: cualquier resultado que empiece por "Error" o sea "Indefinido"
      // se refleja en isError — lo probamos en la sección de evaluate
      // aquí solo verificamos que CLEAR lo resetea
      act(() => { /* isError puede ser false aquí — lo que importa es el reset */ });
      press(result, 'CLEAR');
      expect(result.current.isError).toBe(false);
    });

    it('CLEAR sobre estado vacío no causa error', () => {
      const { result } = renderHook(() => useCalculator());
      expect(() => press(result, 'CLEAR')).not.toThrow();
      expect(result.current.expression).toBe('');
    });
  });

  // --- BACKSPACE ---

  describe('tecla BACKSPACE', () => {
    it('elimina el último carácter de expression', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '2');
      press(result, '3');
      press(result, 'BACKSPACE');
      expect(result.current.expression).toBe('12');
    });

    it('elimina el único carácter dejando expression vacía', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '9');
      press(result, 'BACKSPACE');
      expect(result.current.expression).toBe('');
    });

    it('BACKSPACE sobre expression vacía no causa error', () => {
      const { result } = renderHook(() => useCalculator());
      expect(() => press(result, 'BACKSPACE')).not.toThrow();
      expect(result.current.expression).toBe('');
    });

    it('elimina carácter de un token de función (comportamiento char-by-char)', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'sin(');
      press(result, 'BACKSPACE');
      // BACKSPACE es char-by-char: elimina solo el último carácter "("
      expect(result.current.expression).toBe('sin');
    });
  });

  // --- Tecla = (evaluar) ---

  describe('tecla = (evaluar)', () => {
    it('llama a evaluate con la expression actual y el angleMode', () => {
      mockEvaluate.mockReturnValue('10');
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      press(result, '+');
      press(result, '5');
      press(result, '=');
      expect(mockEvaluate).toHaveBeenCalledWith('5+5', 'RAD');
    });

    it('pone el resultado en result', () => {
      mockEvaluate.mockReturnValue('10');
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      press(result, '+');
      press(result, '5');
      press(result, '=');
      expect(result.current.result).toBe('10');
    });

    it('no llama a evaluate si expression está vacía', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '=');
      expect(mockEvaluate).not.toHaveBeenCalled();
    });

    it('pasa el angleMode correcto a evaluate', () => {
      mockEvaluate.mockReturnValue('1');
      const { result } = renderHook(() => useCalculator());
      press(result, 'MODE_DEG');
      press(result, '1');
      press(result, '=');
      expect(mockEvaluate).toHaveBeenCalledWith('1', 'DEG');
    });

    it('isError es false cuando el resultado es un número válido', () => {
      mockEvaluate.mockReturnValue('42');
      const { result } = renderHook(() => useCalculator());
      press(result, '4');
      press(result, '2');
      press(result, '=');
      expect(result.current.isError).toBe(false);
    });

    it('isError es true cuando el resultado es "Error de Sintaxis"', () => {
      mockEvaluate.mockReturnValue('Error de Sintaxis');
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '=');
      expect(result.current.isError).toBe(true);
    });

    it('isError es true cuando el resultado empieza por "Error"', () => {
      mockEvaluate.mockReturnValue('Error');
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '=');
      expect(result.current.isError).toBe(true);
    });

    it('isError es true cuando el resultado es "Indefinido"', () => {
      mockEvaluate.mockReturnValue('Indefinido');
      const { result } = renderHook(() => useCalculator());
      press(result, '1');
      press(result, '=');
      expect(result.current.isError).toBe(true);
    });

    it('expression se mantiene visible tras evaluar', () => {
      mockEvaluate.mockReturnValue('10');
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      press(result, '+');
      press(result, '5');
      press(result, '=');
      expect(result.current.expression).toBe('5+5');
    });

    it('presionar una tecla después de = continúa sobre la expression existente', () => {
      mockEvaluate.mockReturnValue('10');
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      press(result, '+');
      press(result, '5');
      press(result, '=');
      press(result, '+');
      press(result, '3');
      expect(result.current.expression).toBe('5+5+3');
    });
  });

  // --- angleMode ---

  describe('angleMode', () => {
    it('MODE_DEG cambia angleMode a DEG', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'MODE_DEG');
      expect(result.current.angleMode).toBe('DEG');
    });

    it('MODE_RAD cambia angleMode a RAD', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'MODE_DEG');
      press(result, 'MODE_RAD');
      expect(result.current.angleMode).toBe('RAD');
    });

    it('cambiar modo no altera la expression en curso', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '4');
      press(result, '2');
      press(result, 'MODE_DEG');
      expect(result.current.expression).toBe('42');
    });

    it('cambiar modo no llama a evaluate', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, 'MODE_DEG');
      expect(mockEvaluate).not.toHaveBeenCalled();
    });
  });

  // --- Tokens desconocidos ---

  describe('tokens desconocidos', () => {
    it('un token no reconocido no causa error y no altera el estado', () => {
      const { result } = renderHook(() => useCalculator());
      press(result, '5');
      expect(() => press(result, 'TOKEN_INEXISTENTE')).not.toThrow();
      expect(result.current.expression).toBe('5');
    });
  });

});
