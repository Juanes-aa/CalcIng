/**
 * App.test.tsx
 * Test de integración — renderiza App completo, sin mocks del engine.
 * Verifica la cadena real: Keypad → handleKeyPress → engine → Display.
 *
 * Nota: estos tests usan el engine real (mathjs), por lo que requieren
 * npm install. Se excluyen automáticamente del runner sin dependencias.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplay() {
  return {
    expression: screen.getByTestId('display-expression'),
    result:     screen.getByTestId('display-result'),
  };
}

function getKey(label: string) {
  return screen.getByRole('button', { name: label });
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('App — integración', () => {

  // --- Render inicial ---

  it('renderiza el display con expression y result vacíos', () => {
    render(<App />);
    const { expression, result } = getDisplay();
    expect(expression).toHaveTextContent('');
    expect(result).toHaveTextContent('');
  });

  it('renderiza el keypad con las teclas básicas visibles', () => {
    render(<App />);
    expect(getKey('1')).toBeInTheDocument();
    expect(getKey('+')).toBeInTheDocument();
    expect(getKey('=')).toBeInTheDocument();
    expect(getKey('C')).toBeInTheDocument();
  });

  // --- Flujo de entrada básico ---

  it('presionar dígitos actualiza el display de expresión', async () => {
    render(<App />);
    await userEvent.click(getKey('4'));
    await userEvent.click(getKey('2'));
    expect(getDisplay().expression).toHaveTextContent('42');
  });

  it('presionar operador se refleja en la expresión', async () => {
    render(<App />);
    await userEvent.click(getKey('5'));
    await userEvent.click(getKey('+'));
    expect(getDisplay().expression).toHaveTextContent('5+');
  });

  // --- Evaluación real ---

  it('2 + 3 = muestra resultado 5', async () => {
    render(<App />);
    await userEvent.click(getKey('2'));
    await userEvent.click(getKey('+'));
    await userEvent.click(getKey('3'));
    await userEvent.click(getKey('='));
    expect(getDisplay().result).toHaveTextContent('5');
  });

  it('9 × 9 = muestra resultado 81', async () => {
    render(<App />);
    await userEvent.click(getKey('9'));
    await userEvent.click(getKey('×'));
    await userEvent.click(getKey('9'));
    await userEvent.click(getKey('='));
    expect(getDisplay().result).toHaveTextContent('81');
  });

  it('la expresión permanece visible tras evaluar', async () => {
    render(<App />);
    await userEvent.click(getKey('6'));
    await userEvent.click(getKey('÷'));
    await userEvent.click(getKey('2'));
    await userEvent.click(getKey('='));
    expect(getDisplay().expression).toHaveTextContent('6/2');
    expect(getDisplay().result).toHaveTextContent('3');
  });

  // --- CLEAR y BACKSPACE ---

  it('C limpia expresión y resultado', async () => {
    render(<App />);
    await userEvent.click(getKey('7'));
    await userEvent.click(getKey('+'));
    await userEvent.click(getKey('C'));
    expect(getDisplay().expression).toHaveTextContent('');
    expect(getDisplay().result).toHaveTextContent('');
  });

  it('⌫ elimina el último carácter de la expresión', async () => {
    render(<App />);
    await userEvent.click(getKey('1'));
    await userEvent.click(getKey('2'));
    await userEvent.click(getKey('3'));
    await userEvent.click(getKey('⌫'));
    expect(getDisplay().expression).toHaveTextContent('12');
  });

  // --- Error handling ---

  it('expresión inválida muestra error en el display', async () => {
    render(<App />);
    // Expresión incompleta: solo un operador
    await userEvent.click(getKey('+'));
    await userEvent.click(getKey('='));
    const { result } = getDisplay();
    // El engine retorna "Error de Sintaxis" — el display lo muestra con clase error
    expect(result.className).toMatch(/error/i);
  });

  // --- angleMode ---

  it('cambiar a DEG no altera la expresión en curso', async () => {
    render(<App />);
    await userEvent.click(getKey('4'));
    await userEvent.click(getKey('5'));
    await userEvent.click(screen.getByRole('button', { name: 'DEG' }));
    expect(getDisplay().expression).toHaveTextContent('45');
  });

  it('RAD está activo por defecto (aria-pressed="true")', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'RAD' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  // --- CAS Panel toggle ---

  it('el botón CAS existe en el header con aria-pressed="false" por defecto', () => {
    render(<App />);
    const btn = screen.getByRole('button', { name: 'CAS' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking CAS toggle muestra el CASPanel', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'CAS' }));
    expect(screen.getByTestId('cas-panel')).toBeInTheDocument();
  });

  it('clicking CAS toggle dos veces oculta el CASPanel', async () => {
    render(<App />);
    const btn = screen.getByRole('button', { name: 'CAS' });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByTestId('cas-panel')).not.toBeInTheDocument();
  });

  it('cuando CAS está abierto, aria-pressed del botón es "true"', async () => {
    render(<App />);
    const btn = screen.getByRole('button', { name: 'CAS' });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('CASPanel oculto por defecto — no está en el DOM al renderizar', () => {
    render(<App />);
    expect(screen.queryByTestId('cas-panel')).not.toBeInTheDocument();
  });

});

// --- GraphViewer toggle ---

it('el botón Graficar existe en el header con aria-pressed="false" por defecto', () => {
  render(<App />);
  const btn = screen.getByRole('button', { name: 'Graficar' });
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveAttribute('aria-pressed', 'false');
});

it('clicking Graficar toggle muestra el GraphViewer', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Graficar' }));
  expect(screen.getByTestId('graph-viewer')).toBeInTheDocument();
});

it('clicking Graficar toggle dos veces oculta el GraphViewer', async () => {
  render(<App />);
  const btn = screen.getByRole('button', { name: 'Graficar' });
  await userEvent.click(btn);
  await userEvent.click(btn);
  expect(screen.queryByTestId('graph-viewer')).not.toBeInTheDocument();
});

it('GraphViewer oculto por defecto — no está en el DOM al renderizar', () => {
  render(<App />);
  expect(screen.queryByTestId('graph-viewer')).not.toBeInTheDocument();
});