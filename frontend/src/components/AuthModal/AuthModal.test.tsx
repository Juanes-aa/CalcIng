import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthModal from './AuthModal'
import * as authService from '../../services/authService'
import type { LoginResponse } from '../../services/authService'

vi.mock('../../services/authService')

const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function renderModal() {
  render(<AuthModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
}

describe('AuthModal', () => {
  // --- rendering ---
  describe('rendering', () => {
    it('renders email and password fields', () => {
      renderModal()
      expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    })

    it('renders "Iniciar sesión" heading in login mode', () => {
      renderModal()
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })

    it('renders "Registrarse" heading in register mode', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
      expect(screen.getByRole('heading', { name: 'Registrarse' })).toBeInTheDocument()
    })

    it('renders close button with aria-label="Cerrar"', () => {
      renderModal()
      expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    })
  })

  // --- mode toggle ---
  describe('mode toggle', () => {
    it('clicking toggle link switches from login to register mode', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
      expect(screen.getByRole('heading', { name: 'Registrarse' })).toBeInTheDocument()
    })

    it('clicking toggle link switches from register to login mode', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
      fireEvent.click(screen.getByRole('button', { name: 'Inicia sesión' }))
      expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })
  })

  // --- login flow ---
  describe('login flow', () => {
    it('submitting login form calls authService.login with email and password', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'at', refresh_token: 'rt', token_type: 'bearer',
        first_name: null, last_name: null, plan: 'free',
      })
      renderModal()
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass123' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('test@example.com', 'pass123')
      })
    })

    it('on login success calls onSuccess with the email', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'at', refresh_token: 'rt', token_type: 'bearer',
        first_name: null, last_name: null, plan: 'free',
      })
      renderModal()
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'user@example.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('user@example.com')
      })
    })

    it('on login error (INVALID_CREDENTIALS) shows "Credenciales inválidas"', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('INVALID_CREDENTIALS'))
      renderModal()
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
      })
    })

    it('submit button is disabled while login is in flight', async () => {
      let resolveLogin!: (val: LoginResponse) => void
      vi.mocked(authService.login).mockReturnValue(
        new Promise<LoginResponse>(resolve => { resolveLogin = resolve })
      )
      renderModal()
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled()
      resolveLogin({ access_token: 'at', refresh_token: 'rt', token_type: 'bearer', first_name: null, last_name: null, plan: 'free' })
      await waitFor(() => expect(screen.getByRole('button', { name: 'Iniciar sesión' })).not.toBeDisabled())
    })
  })

  // --- register flow ---
  describe('register flow', () => {
    it('submitting register form calls authService.register then authService.login', async () => {
      vi.mocked(authService.register).mockResolvedValue({ id: 'u1', email: 'a@b.com' })
      vi.mocked(authService.login).mockResolvedValue({
        access_token: 'at', refresh_token: 'rt', token_type: 'bearer',
        first_name: null, last_name: null, plan: 'free',
      })
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass123' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith('a@b.com', 'pass123', undefined, undefined)
        expect(authService.login).toHaveBeenCalledWith('a@b.com', 'pass123')
      })
    })

    it('on register error (EMAIL_ALREADY_EXISTS) shows "El correo ya está registrado"', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('EMAIL_ALREADY_EXISTS'))
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }))
      fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pass' } })
      fireEvent.submit(screen.getByTestId('auth-form'))
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('El correo ya está registrado')
      })
    })
  })

  // --- close behavior ---
  describe('close behavior', () => {
    it('clicking close button calls onClose', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('clicking backdrop calls onClose', () => {
      renderModal()
      fireEvent.click(screen.getByTestId('auth-modal-backdrop'))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
