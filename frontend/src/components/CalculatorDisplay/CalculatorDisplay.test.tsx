import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalculatorDisplay } from './CalculatorDisplay'

describe('CalculatorDisplay', () => {

  // --- Render básico ---

  it('muestra la expresión recibida por props', () => {
    render(<CalculatorDisplay expression="2 + 3" result="" isError={false} />)
    expect(screen.getByTestId('display-expression')).toHaveTextContent('2 + 3')
  })

  it('muestra el resultado recibido por props', () => {
    render(<CalculatorDisplay expression="" result="5" isError={false} />)
    expect(screen.getByTestId('display-result')).toHaveTextContent('5')
  })

  it('muestra expresión y resultado simultáneamente', () => {
    render(<CalculatorDisplay expression="12 × 4" result="48" isError={false} />)
    expect(screen.getByTestId('display-expression')).toHaveTextContent('12 × 4')
    expect(screen.getByTestId('display-result')).toHaveTextContent('48')
  })

  // --- Estado de error ---

  it('aplica clase de error al resultado cuando isError es true', () => {
    render(<CalculatorDisplay expression="1 / 0" result="Error" isError={true} />)
    const result = screen.getByTestId('display-result')
    expect(result.className).toMatch(/error/i)
  })

  it('NO aplica clase de error cuando isError es false', () => {
    render(<CalculatorDisplay expression="2 + 2" result="4" isError={false} />)
    const result = screen.getByTestId('display-result')
    expect(result.className).not.toMatch(/error/i)
  })

  // --- Strings vacíos ---

  it('renderiza sin crashear con expresión vacía', () => {
    render(<CalculatorDisplay expression="" result="0" isError={false} />)
    expect(screen.getByTestId('display-expression')).toBeInTheDocument()
    expect(screen.getByTestId('display-result')).toHaveTextContent('0')
  })

  it('renderiza sin crashear con ambos strings vacíos', () => {
    render(<CalculatorDisplay expression="" result="" isError={false} />)
    expect(screen.getByTestId('display-expression')).toBeInTheDocument()
    expect(screen.getByTestId('display-result')).toBeInTheDocument()
  })

  // --- Componente puro: no tiene estado interno ---

  it('actualiza el display cuando cambian las props', () => {
    const { rerender } = render(
      <CalculatorDisplay expression="1 + 1" result="2" isError={false} />
    )
    expect(screen.getByTestId('display-result')).toHaveTextContent('2')

    rerender(<CalculatorDisplay expression="9 × 9" result="81" isError={false} />)
    expect(screen.getByTestId('display-result')).toHaveTextContent('81')
    expect(screen.getByTestId('display-expression')).toHaveTextContent('9 × 9')
  })

})
