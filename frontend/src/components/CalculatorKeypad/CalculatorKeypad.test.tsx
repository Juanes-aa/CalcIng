import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalculatorKeypad } from './CalculatorKeypad'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getKey(label: string) {
  return screen.getByRole('button', { name: label })
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('CalculatorKeypad', () => {

  // --- Render: teclas presentes ---

  describe('render — teclas numéricas', () => {
    it('renderiza los dígitos del 0 al 9', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        expect(getKey(digit)).toBeInTheDocument()
      }
    })

    it('renderiza el punto decimal', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('.')).toBeInTheDocument()
    })
  })

  describe('render — operadores básicos', () => {
    it('renderiza suma, resta, multiplicación y división', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('+')).toBeInTheDocument()
      expect(getKey('-')).toBeInTheDocument()
      expect(getKey('×')).toBeInTheDocument()
      expect(getKey('÷')).toBeInTheDocument()
    })

    it('renderiza la tecla de igual', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('=')).toBeInTheDocument()
    })

    it('renderiza paréntesis abierto y cerrado', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('(')).toBeInTheDocument()
      expect(getKey(')')).toBeInTheDocument()
    })
  })

  describe('render — acciones', () => {
    it('renderiza la tecla Clear (C)', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('C')).toBeInTheDocument()
    })

    it('renderiza la tecla de borrar (⌫)', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('⌫')).toBeInTheDocument()
    })
  })

  describe('render — funciones científicas', () => {
    it('renderiza funciones trigonométricas básicas', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('sin')).toBeInTheDocument()
      expect(getKey('cos')).toBeInTheDocument()
      expect(getKey('tan')).toBeInTheDocument()
    })

    it('renderiza log, ln y potencia', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('log')).toBeInTheDocument()
      expect(getKey('ln')).toBeInTheDocument()
      expect(getKey('xʸ')).toBeInTheDocument()
    })

    it('renderiza sqrt y pi', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(getKey('√')).toBeInTheDocument()
      expect(getKey('π')).toBeInTheDocument()
    })
  })

  // --- Callback: onKeyPress ---

  describe('onKeyPress — dígitos y operadores', () => {
    it('llama a onKeyPress con "1" al presionar el botón 1', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('1'))
      expect(onKeyPress).toHaveBeenCalledWith('1')
    })

    it('llama a onKeyPress con "0" al presionar el botón 0', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('0'))
      expect(onKeyPress).toHaveBeenCalledWith('0')
    })

    it('llama a onKeyPress con "+" al presionar suma', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('+'))
      expect(onKeyPress).toHaveBeenCalledWith('+')
    })

    it('llama a onKeyPress con "-" al presionar resta', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('-'))
      expect(onKeyPress).toHaveBeenCalledWith('-')
    })

    it('llama a onKeyPress con "*" al presionar ×', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('×'))
      expect(onKeyPress).toHaveBeenCalledWith('*')
    })

    it('llama a onKeyPress con "/" al presionar ÷', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('÷'))
      expect(onKeyPress).toHaveBeenCalledWith('/')
    })

    it('llama a onKeyPress con "=" al presionar igual', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('='))
      expect(onKeyPress).toHaveBeenCalledWith('=')
    })

    it('llama a onKeyPress con "." al presionar el punto decimal', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('.'))
      expect(onKeyPress).toHaveBeenCalledWith('.')
    })
  })

  describe('onKeyPress — acciones', () => {
    it('llama a onKeyPress con "CLEAR" al presionar C', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('C'))
      expect(onKeyPress).toHaveBeenCalledWith('CLEAR')
    })

    it('llama a onKeyPress con "BACKSPACE" al presionar ⌫', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('⌫'))
      expect(onKeyPress).toHaveBeenCalledWith('BACKSPACE')
    })
  })

  describe('onKeyPress — funciones científicas', () => {
    it('llama a onKeyPress con "sin(" al presionar sin', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('sin'))
      expect(onKeyPress).toHaveBeenCalledWith('sin(')
    })

    it('llama a onKeyPress con "cos(" al presionar cos', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('cos'))
      expect(onKeyPress).toHaveBeenCalledWith('cos(')
    })

    it('llama a onKeyPress con "tan(" al presionar tan', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('tan'))
      expect(onKeyPress).toHaveBeenCalledWith('tan(')
    })

    it('llama a onKeyPress con "log(" al presionar log', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('log'))
      expect(onKeyPress).toHaveBeenCalledWith('log(')
    })

    it('llama a onKeyPress con "ln(" al presionar ln', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('ln'))
      expect(onKeyPress).toHaveBeenCalledWith('ln(')
    })

    it('llama a onKeyPress con "sqrt(" al presionar √', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('√'))
      expect(onKeyPress).toHaveBeenCalledWith('sqrt(')
    })

    it('llama a onKeyPress con "^" al presionar xʸ', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('xʸ'))
      expect(onKeyPress).toHaveBeenCalledWith('^')
    })

    it('llama a onKeyPress con "pi" al presionar π', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('π'))
      expect(onKeyPress).toHaveBeenCalledWith('pi')
    })
  })

  describe('onKeyPress — exactamente una vez por click', () => {
    it('onKeyPress se llama exactamente una vez por click', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('5'))
      expect(onKeyPress).toHaveBeenCalledTimes(1)
    })

    it('clicks múltiples en teclas distintas producen llamadas distintas', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} />)
      await userEvent.click(getKey('3'))
      await userEvent.click(getKey('+'))
      await userEvent.click(getKey('4'))
      expect(onKeyPress).toHaveBeenCalledTimes(3)
      expect(onKeyPress).toHaveBeenNthCalledWith(1, '3')
      expect(onKeyPress).toHaveBeenNthCalledWith(2, '+')
      expect(onKeyPress).toHaveBeenNthCalledWith(3, '4')
    })
  })

  // --- Prop: disabled ---

  describe('prop disabled', () => {
    it('todos los botones están habilitados por defecto', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn: HTMLElement) => expect(btn).not.toBeDisabled())
    })

    it('todos los botones están deshabilitados cuando disabled=true', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} disabled={true} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn: HTMLElement) => expect(btn).toBeDisabled())
    })

    it('no llama a onKeyPress cuando está disabled', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} disabled={true} />)
      await userEvent.click(getKey('5'))
      expect(onKeyPress).not.toHaveBeenCalled()
    })
  })

  // --- Prop: angleMode ---

  describe('prop angleMode', () => {
    it('muestra "RAD" activo cuando angleMode es RAD', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} angleMode="RAD" />)
      const radButton = screen.getByRole('button', { name: 'RAD' })
      expect(radButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('muestra "DEG" activo cuando angleMode es DEG', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} angleMode="DEG" />)
      const degButton = screen.getByRole('button', { name: 'DEG' })
      expect(degButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('llama a onKeyPress con "MODE_RAD" al presionar RAD', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} angleMode="DEG" />)
      await userEvent.click(screen.getByRole('button', { name: 'RAD' }))
      expect(onKeyPress).toHaveBeenCalledWith('MODE_RAD')
    })

    it('llama a onKeyPress con "MODE_DEG" al presionar DEG', async () => {
      const onKeyPress = vi.fn()
      render(<CalculatorKeypad onKeyPress={onKeyPress} angleMode="RAD" />)
      await userEvent.click(screen.getByRole('button', { name: 'DEG' }))
      expect(onKeyPress).toHaveBeenCalledWith('MODE_DEG')
    })

    it('por defecto (sin prop angleMode) RAD está activo', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      const radButton = screen.getByRole('button', { name: 'RAD' })
      expect(radButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  // --- Accesibilidad ---

  describe('accesibilidad', () => {
    it('cada botón tiene un texto de nombre accesible (no vacío)', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn: HTMLElement) => {
        expect(btn.textContent?.trim().length).toBeGreaterThan(0)
      })
    })

    it('el contenedor del keypad tiene role="group"', () => {
      render(<CalculatorKeypad onKeyPress={vi.fn()} />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })
  })

})
