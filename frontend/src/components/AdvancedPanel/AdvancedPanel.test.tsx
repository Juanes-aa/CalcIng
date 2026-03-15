import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { AdvancedPanel } from './AdvancedPanel';

// ─── GRUPO 1: Render base ─────────────────────────────────────────────────────

describe('AdvancedPanel — render base', () => {

  test('renderiza el panel con data-testid="advanced-panel"', () => {
    render(<AdvancedPanel />)
    expect(screen.getByTestId('advanced-panel')).toBeInTheDocument()
  })

  test('renderiza tabs: Constantes, Estadística, Complejos, Matrices, Conversiones, Bases', () => {
    render(<AdvancedPanel />)
    expect(screen.getByTestId('tab-constants')).toBeInTheDocument()
    expect(screen.getByTestId('tab-stats')).toBeInTheDocument()
    expect(screen.getByTestId('tab-complex')).toBeInTheDocument()
    expect(screen.getByTestId('tab-matrix')).toBeInTheDocument()
    expect(screen.getByTestId('tab-convert')).toBeInTheDocument()
    expect(screen.getByTestId('tab-bases')).toBeInTheDocument()
  })

  test('tab Constantes activo por defecto', () => {
    render(<AdvancedPanel />)
    expect(screen.getByTestId('tab-constants').getAttribute('aria-selected')).toBe('true')
  })

  test('click en tab Estadística activa ese tab', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-stats'))
    expect(screen.getByTestId('tab-stats').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('tab-constants').getAttribute('aria-selected')).toBe('false')
  })

})

// ─── GRUPO 2: Tab Constantes ──────────────────────────────────────────────────

describe('AdvancedPanel — Tab Constantes', () => {

  test('muestra al menos 10 constantes en la lista', () => {
    render(<AdvancedPanel />)
    const items = screen.getAllByTestId(/^constant-item-/)
    expect(items.length).toBeGreaterThanOrEqual(10)
  })

  test('cada constante muestra símbolo y valor', () => {
    render(<AdvancedPanel />)
    const piItem = screen.getByTestId('constant-item-PI')
    expect(piItem).toBeInTheDocument()
    expect(piItem.textContent).toContain('π')
  })

  test('botón insertar de PI llama onInsert con el valor numérico de PI', () => {
    const onInsert = vi.fn()
    render(<AdvancedPanel onInsert={onInsert} />)
    fireEvent.click(screen.getByTestId('constant-insert-PI'))
    expect(onInsert).toHaveBeenCalledWith(String(Math.PI))
  })

})

// ─── GRUPO 3: Tab Estadística ─────────────────────────────────────────────────

describe('AdvancedPanel — Tab Estadística', () => {

  test('muestra input de datos con data-testid="stats-input"', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-stats'))
    expect(screen.getByTestId('stats-input')).toBeInTheDocument()
  })

  test('muestra selector de operación con data-testid="stats-op-select"', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-stats'))
    expect(screen.getByTestId('stats-op-select')).toBeInTheDocument()
  })

  test('mean de [1,2,3,4,5] retorna 3', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-stats'))
    fireEvent.change(screen.getByTestId('stats-input'), { target: { value: '1,2,3,4,5' } })
    fireEvent.change(screen.getByTestId('stats-op-select'), { target: { value: 'mean' } })
    fireEvent.click(screen.getByTestId('stats-calc-button'))
    expect(screen.getByTestId('stats-result').textContent).toBe('3')
  })

  test('stdDev de [2,4,4,4,5,5,7,9] retorna resultado cercano a 2', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-stats'))
    fireEvent.change(screen.getByTestId('stats-input'), { target: { value: '2,4,4,4,5,5,7,9' } })
    fireEvent.change(screen.getByTestId('stats-op-select'), { target: { value: 'stdDev' } })
    fireEvent.click(screen.getByTestId('stats-calc-button'))
    const result = parseFloat(screen.getByTestId('stats-result').textContent ?? '0')
    expect(result).toBeCloseTo(2, 1)
  })

})

// ─── GRUPO 4: Tab Complejos ───────────────────────────────────────────────────

describe('AdvancedPanel — Tab Complejos', () => {

  test('muestra inputs para z1 y z2', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-complex'))
    expect(screen.getByTestId('complex-z1-real')).toBeInTheDocument()
    expect(screen.getByTestId('complex-z1-imag')).toBeInTheDocument()
    expect(screen.getByTestId('complex-z2-real')).toBeInTheDocument()
    expect(screen.getByTestId('complex-z2-imag')).toBeInTheDocument()
  })

  test('cAdd: (1+2i) + (3+4i) = 4+6i', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-complex'))
    fireEvent.change(screen.getByTestId('complex-z1-real'), { target: { value: '1' } })
    fireEvent.change(screen.getByTestId('complex-z1-imag'), { target: { value: '2' } })
    fireEvent.change(screen.getByTestId('complex-z2-real'), { target: { value: '3' } })
    fireEvent.change(screen.getByTestId('complex-z2-imag'), { target: { value: '4' } })
    fireEvent.change(screen.getByTestId('complex-op-select'), { target: { value: 'cAdd' } })
    fireEvent.click(screen.getByTestId('complex-calc-button'))
    expect(screen.getByTestId('complex-result').textContent).toContain('4')
    expect(screen.getByTestId('complex-result').textContent).toContain('6')
  })

  test('cModulus: |3+4i| = 5', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-complex'))
    fireEvent.change(screen.getByTestId('complex-z1-real'), { target: { value: '3' } })
    fireEvent.change(screen.getByTestId('complex-z1-imag'), { target: { value: '4' } })
    fireEvent.change(screen.getByTestId('complex-op-select'), { target: { value: 'cModulus' } })
    fireEvent.click(screen.getByTestId('complex-calc-button'))
    expect(screen.getByTestId('complex-result').textContent).toContain('5')
  })

})

// ─── GRUPO 5: Tab Matrices ────────────────────────────────────────────────────

describe('AdvancedPanel — Tab Matrices', () => {

  test('muestra textarea para matriz A con data-testid="matrix-a-input"', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-matrix'))
    expect(screen.getByTestId('matrix-a-input')).toBeInTheDocument()
  })

  test('matDet de [[1,2],[3,4]] = -2', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-matrix'))
    fireEvent.change(screen.getByTestId('matrix-a-input'), { target: { value: '1,2;3,4' } })
    fireEvent.change(screen.getByTestId('matrix-op-select'), { target: { value: 'matDet' } })
    fireEvent.click(screen.getByTestId('matrix-calc-button'))
    expect(screen.getByTestId('matrix-result').textContent).toContain('-2')
  })

  test('matTranspose de [[1,2],[3,4]] contiene resultado', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-matrix'))
    fireEvent.change(screen.getByTestId('matrix-a-input'), { target: { value: '1,2;3,4' } })
    fireEvent.change(screen.getByTestId('matrix-op-select'), { target: { value: 'matTranspose' } })
    fireEvent.click(screen.getByTestId('matrix-calc-button'))
    expect(screen.getByTestId('matrix-result')).toBeInTheDocument()
    expect(screen.getByTestId('matrix-result').textContent).not.toBe('')
  })

})

// ─── GRUPO 6: Tab Conversiones ────────────────────────────────────────────────

describe('AdvancedPanel — Tab Conversiones', () => {

  test('muestra selector de categoría con data-testid="convert-category"', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-convert'))
    expect(screen.getByTestId('convert-category')).toBeInTheDocument()
  })

  test('1 km = 1000 m', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-convert'))
    fireEvent.change(screen.getByTestId('convert-category'), { target: { value: 'longitud' } })
    fireEvent.change(screen.getByTestId('convert-from'), { target: { value: 'km' } })
    fireEvent.change(screen.getByTestId('convert-to'), { target: { value: 'm' } })
    fireEvent.change(screen.getByTestId('convert-value'), { target: { value: '1' } })
    expect(screen.getByTestId('convert-result').textContent).toContain('1000')
  })

  test('0°C = 32°F', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-convert'))
    fireEvent.change(screen.getByTestId('convert-category'), { target: { value: 'temperatura' } })
    fireEvent.change(screen.getByTestId('convert-from'), { target: { value: 'C' } })
    fireEvent.change(screen.getByTestId('convert-to'), { target: { value: 'F' } })
    fireEvent.change(screen.getByTestId('convert-value'), { target: { value: '0' } })
    expect(screen.getByTestId('convert-result').textContent).toContain('32')
  })

})

// ─── GRUPO 7: Tab Bases ───────────────────────────────────────────────────────

describe('AdvancedPanel — Tab Bases', () => {

  test('muestra input decimal con data-testid="bases-input"', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-bases'))
    expect(screen.getByTestId('bases-input')).toBeInTheDocument()
  })

  test('10 decimal = 1010 binario', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-bases'))
    fireEvent.change(screen.getByTestId('bases-input'), { target: { value: '10' } })
    expect(screen.getByTestId('bases-result-bin').textContent).toContain('1010')
  })

  test('255 decimal = FF hexadecimal', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-bases'))
    fireEvent.change(screen.getByTestId('bases-input'), { target: { value: '255' } })
    expect(screen.getByTestId('bases-result-hex').textContent).toContain('FF')
  })

  test('8 decimal = 10 octal', () => {
    render(<AdvancedPanel />)
    fireEvent.click(screen.getByTestId('tab-bases'))
    fireEvent.change(screen.getByTestId('bases-input'), { target: { value: '8' } })
    expect(screen.getByTestId('bases-result-oct').textContent).toContain('10')
  })

})