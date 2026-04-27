/**
 * App.test.tsx
 * Test de integración — renderiza App completo, sin mocks del engine.
 * Verifica la cadena real: Keypad → handleKeyPress → engine → Display.
 *
 * Nota: estos tests usan el engine real (mathjs), por lo que requieren
 * npm install. Se excluyen automáticamente del runner sin dependencias.
 */

import { describe, it, expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(getKey('AC')).toBeInTheDocument();
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

  it('9 * 9 = muestra resultado 81', async () => {
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

  it('AC limpia expresión y resultado', async () => {
    render(<App />);
    await userEvent.click(getKey('7'));
    await userEvent.click(getKey('+'));
    await userEvent.click(getKey('AC'));
    expect(getDisplay().expression).toHaveTextContent('');
    expect(getDisplay().result).toHaveTextContent('');
  });

  it('DEL elimina el último carácter de la expresión', async () => {
    render(<App />);
    await userEvent.click(getKey('1'));
    await userEvent.click(getKey('2'));
    await userEvent.click(getKey('3'));
    await userEvent.click(getKey('DEL'));
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

  // --- CAS Panel — siempre visible ---

  it('CASPanel visible por defecto — está en el DOM al renderizar', () => {
    render(<App />);
    expect(screen.getByTestId('cas-panel')).toBeInTheDocument();
  });

});

// --- GraphViewer nav ---

it('el botón Gráficos existe en el header con aria-pressed="false" por defecto', () => {
  render(<App />);
  const btn = screen.getByTestId('nav-graficos');
  expect(btn).toBeInTheDocument();
  expect(btn).toHaveAttribute('aria-pressed', 'false');
});

it('clicking Gráficos nav muestra el GraphViewer', async () => {
  render(<App />);
  await userEvent.click(screen.getByTestId('nav-graficos'));
  expect(screen.getByTestId('graph-viewer')).toBeInTheDocument();
});

it('volver a Calculadora desde Gráficos oculta el GraphViewer', async () => {
  render(<App />);
  await userEvent.click(screen.getByTestId('nav-graficos'));
  await userEvent.click(screen.getByTestId('nav-calculadora'));
  expect(screen.queryByTestId('graph-viewer')).not.toBeInTheDocument();
});

it('GraphViewer oculto por defecto — no está en el DOM al renderizar', () => {
  render(<App />);
  expect(screen.queryByTestId('graph-viewer')).not.toBeInTheDocument();
});

// ─── AdvancedPanel — toggle desde sidebar ────────────────────────────────────

describe('App — AdvancedPanel', () => {

  test('AdvancedPanel oculto por defecto', () => {
    render(<App />)
    expect(screen.queryByTestId('advanced-panel')).not.toBeInTheDocument()
  })

  test('clicking Avanzado en sidebar muestra el AdvancedPanel', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('sidebar-avanzado'))
    expect(screen.getByTestId('advanced-panel')).toBeInTheDocument()
  })

  test('volver a Cálculo desde Avanzado oculta el AdvancedPanel', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('sidebar-avanzado'))
    fireEvent.click(screen.getByTestId('nav-calculadora'))
    expect(screen.queryByTestId('advanced-panel')).not.toBeInTheDocument()
  })

})