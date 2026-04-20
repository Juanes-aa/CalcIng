import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import * as authService from './services/authService'

vi.mock('./services/authService', () => ({
  getStoredToken: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('./components/AuthModal/AuthModal', () => ({
  default: ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (e: string) => void }) => (
    <div data-testid="auth-modal">
      <button onClick={onClose}>close</button>
      <button onClick={() => onSuccess('user@test.com')}>success</button>
    </div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('App — auth', () => {
  // --- initial state — not logged in ---
  describe('initial state — not logged in', () => {
    it('shows "Acceso" button when no token in storage', () => {
      vi.mocked(authService.getStoredToken).mockReturnValue(null)
      render(<App />)
      expect(screen.getByRole('button', { name: 'Acceso' })).toBeInTheDocument()
    })

    it('does not show user email when not logged in', () => {
      vi.mocked(authService.getStoredToken).mockReturnValue(null)
      render(<App />)
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument()
    })

    it('does not show AuthModal initially', () => {
      vi.mocked(authService.getStoredToken).mockReturnValue(null)
      render(<App />)
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
    })
  })

  // --- initial state — already logged in ---
  describe('initial state — already logged in', () => {
    beforeEach(() => {
      vi.mocked(authService.getStoredToken).mockReturnValue('stored-token')
      localStorage.setItem('calcing_email', 'stored@example.com')
    })

    it('shows user email from localStorage when token exists', () => {
      render(<App />)
      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com')
    })

    it('shows "Cerrar sesión" button when already logged in', () => {
      render(<App />)
      expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    })

    it('does not show "Acceso" button when already logged in', () => {
      render(<App />)
      expect(screen.queryByRole('button', { name: 'Acceso' })).not.toBeInTheDocument()
    })
  })

  // --- login flow ---
  describe('login flow', () => {
    beforeEach(() => {
      vi.mocked(authService.getStoredToken).mockReturnValue(null)
    })

    it('clicking "Acceso" button opens AuthModal', () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Acceso' }))
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    })

    it('after onSuccess, hides AuthModal and shows user email in header', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Acceso' }))
      fireEvent.click(screen.getByRole('button', { name: 'success' }))
      await waitFor(() => {
        expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument()
        expect(screen.getByTestId('user-email')).toHaveTextContent('user@test.com')
      })
    })

    it('after onSuccess, shows "Cerrar sesión" button', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Acceso' }))
      fireEvent.click(screen.getByRole('button', { name: 'success' }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
      })
    })

    it('after onSuccess, saves email to localStorage key "calcing_email"', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Acceso' }))
      fireEvent.click(screen.getByRole('button', { name: 'success' }))
      await waitFor(() => {
        expect(localStorage.getItem('calcing_email')).toBe('user@test.com')
      })
    })
  })

  // --- logout flow ---
  describe('logout flow', () => {
    beforeEach(() => {
      vi.mocked(authService.getStoredToken).mockReturnValue('stored-token')
      localStorage.setItem('calcing_email', 'stored@example.com')
    })

    it('clicking "Cerrar sesión" calls authService.logout()', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled()
      })
    })

    it('after logout, shows "Acceso" button again', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Acceso' })).toBeInTheDocument()
      })
    })

    it('after logout, removes "calcing_email" from localStorage', async () => {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
      await waitFor(() => {
        expect(localStorage.getItem('calcing_email')).toBeNull()
      })
    })
  })
})
