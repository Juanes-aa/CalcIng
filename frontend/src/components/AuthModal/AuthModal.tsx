import { useState } from 'react'
import type { FormEvent } from 'react'
import { register, login } from '../../services/authService'
import { useI18n } from '../../hooks/useI18n'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (email: string) => void
}

// mapError se reemplaza por mapErrorI18n dentro del componente

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function OAuthButton({ provider }: { provider: 'google' | 'github' }) {
  const isGoogle = provider === 'google'
  return (
    <button
      type="button"
      onClick={() => {
        // TODO: conectar con /auth/google o /auth/github en Fase 7
        console.log(`OAuth ${provider} — pendiente Fase 7`)
      }}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-outline/40 bg-surface-mid text-on-surface-dim text-sm font-medium hover:border-outline hover:text-on-surface hover:bg-surface-high transition-all"
    >
      {isGoogle ? (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      )}
      <span>{isGoogle ? 'Google' : 'GitHub'}</span>
    </button>
  )
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { t } = useI18n()
  const [mode, setMode]               = useState<'login' | 'register'>('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
    setConfirmPass('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    setError('')

    if (mode === 'register' && confirmPass !== '' && confirmPass !== password) {
      setError(t('auth.err.passwordMismatch'))
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, firstName.trim() || undefined, lastName.trim() || undefined)
        await login(email, password)
      }
      onSuccess(email)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg === 'EMAIL_ALREADY_EXISTS' ? t('auth.err.emailExists')
        : msg === 'INVALID_CREDENTIALS' ? t('auth.err.invalidCreds')
        : t('auth.err.generic')
      )
    } finally {
      setLoading(false)
    }
  }

  const inputBase =
    'w-full bg-surface-mid text-on-surface border border-outline/40 rounded-xl font-mono text-[0.9375rem] px-4 py-3 outline-none focus:border-primary-cta focus:ring-1 focus:ring-primary-cta/30 transition-all placeholder:text-outline'
  const labelBase =
    'text-[0.7rem] font-bold uppercase tracking-[0.12em] text-on-surface-dim'

  return (
    <div
      className="fixed inset-0 bg-surface-low/75 backdrop-blur-xl flex items-center justify-center z-[1000] p-4"
      data-testid="auth-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] bg-surface-high/90 backdrop-blur-2xl border border-outline/40 rounded-2xl p-8 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(180,197,255,0.04)] overflow-y-auto max-h-[calc(100dvh-2rem)]"
        data-testid="auth-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Cerrar ── */}
        <button
          type="button"
          aria-label={t('auth.close')}
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-on-surface-dim hover:text-on-surface hover:bg-primary/8 rounded-lg p-1.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* ── Logo ── */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <span className="font-mono font-bold text-2xl text-primary uppercase tracking-tighter">CalcIng</span>
          <span className="text-[10px] text-on-surface-dim uppercase tracking-[0.25em]">{t('auth.tagline')}</span>
        </div>

        {/* ── Tab pill switch ── */}
        <div className="flex w-full bg-surface-low p-1 rounded-xl gap-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            disabled={loading}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              mode === 'login' ? 'bg-primary-cta text-white shadow' : 'text-on-surface-dim hover:text-on-surface'
            }`}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            disabled={loading}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              mode === 'register' ? 'bg-primary-cta text-white shadow' : 'text-on-surface-dim hover:text-on-surface'
            }`}
          >
            {t('auth.register')}
          </button>
        </div>

        {/* ── Heading semántico — requerido por tests ── */}
        <h2 className="sr-only">
          {mode === 'login' ? t('auth.login') : t('auth.register')}
        </h2>

        {/* ── Formulario ── */}
        <form data-testid="auth-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* Nombre + Apellido — solo en registro */}
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-firstname" className={labelBase}>{t('auth.firstName')}</label>
                <input
                  id="auth-firstname"
                  type="text"
                  placeholder={t('auth.firstNamePh')}
                  className={inputBase}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-lastname" className={labelBase}>{t('auth.lastName')}</label>
                <input
                  id="auth-lastname"
                  type="text"
                  placeholder={t('auth.lastNamePh')}
                  className={inputBase}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-email" className={labelBase}>{t('auth.email')}</label>
            <input
              id="auth-email"
              type="email"
              placeholder={t('auth.emailPh')}
              className={inputBase}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              title={t('auth.emailTitle')}
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className={labelBase}>{t('auth.password')}</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className={`${inputBase} pr-11`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                aria-label={showPass ? t('auth.hide') : t('auth.show')}
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim hover:text-on-surface transition-colors"
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {/* Confirmar contraseña — solo en registro */}
          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-confirm" className={labelBase}>{t('auth.confirmPassword')}</label>
              <div className="relative">
                <input
                  id="auth-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11`}
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showConfirm ? t('auth.hide') : t('auth.show')}
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim hover:text-on-surface transition-colors"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p role="alert" className="text-error text-[0.8125rem] px-3 py-2 bg-error/6 border border-error/15 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-cta text-white rounded-xl font-display font-bold text-sm tracking-widest uppercase hover:brightness-110 active:scale-[0.97] disabled:opacity-55 disabled:cursor-not-allowed transition-all"
          >
            {loading
              ? t('auth.loading')
              : mode === 'login'
              ? t('auth.submitLogin')
              : t('auth.submitRegister')}
          </button>

          {/* Divisor OAuth */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline/30" />
            <span className="text-[11px] text-on-surface-dim uppercase tracking-widest">{t('auth.orContinue')}</span>
            <div className="flex-1 h-px bg-outline/30" />
          </div>

          {/* Botones OAuth */}
          <div className="flex gap-3">
            <OAuthButton provider="google" />
            <OAuthButton provider="github" />
          </div>
        </form>

        {/* ── Toggle secundario — nombres exactos requeridos por tests ── */}
        <div className="mt-5 text-center text-[0.8125rem] text-on-surface-dim">
          {mode === 'login' ? (
            <span>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                className="text-primary font-semibold hover:text-on-surface hover:underline transition-colors bg-transparent border-0 p-0 text-inherit cursor-pointer"
                onClick={() => switchMode('register')}
              >
                {t('auth.signUp')}
              </button>
            </span>
          ) : (
            <span>
              {t('auth.hasAccount')}{' '}
              <button
                type="button"
                className="text-primary font-semibold hover:text-on-surface hover:underline transition-colors bg-transparent border-0 p-0 text-inherit cursor-pointer"
                onClick={() => switchMode('login')}
              >
                {t('auth.signIn')}
              </button>
            </span>
          )}
        </div>

        {/* Línea decorativa */}
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-primary-cta/40 to-transparent" />
      </div>
    </div>
  )
}