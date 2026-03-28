import { useState } from 'react'
import type { FormEvent } from 'react'
import { register, login } from '../../services/authService'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (email: string) => void
}

function mapError(message: string): string {
  if (message === 'EMAIL_ALREADY_EXISTS') return 'El correo ya está registrado'
  if (message === 'INVALID_CREDENTIALS') return 'Credenciales inválidas'
  return 'Ocurrió un error. Intenta de nuevo.'
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
        await login(email, password)
      }
      onSuccess(email)
    } catch (err) {
      if (err instanceof Error) {
        setError(mapError(err.message))
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={styles.backdrop}
      data-testid="auth-modal-backdrop"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Cerrar"
          className={styles.closeBtn}
          onClick={onClose}
        >
          ×
        </button>
        <h2 className={styles.title}>
          {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
        </h2>
        <form data-testid="auth-form" onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </form>
        <div className={styles.toggle}>
          {mode === 'login' ? (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                className={styles.toggleLink}
                onClick={() => { setMode('register'); setError('') }}
              >
                Regístrate
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                className={styles.toggleLink}
                onClick={() => { setMode('login'); setError('') }}
              >
                Inicia sesión
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
