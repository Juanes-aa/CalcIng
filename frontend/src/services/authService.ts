export interface RegisterResponse {
  id: string
  email: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  first_name: string | null
  last_name: string | null
  plan: string
}

export interface RefreshResponse {
  access_token: string
  token_type: string
}

export async function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
): Promise<RegisterResponse> {
  const baseUrl: string = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, first_name: firstName || null, last_name: lastName || null }),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('EMAIL_ALREADY_EXISTS')
    if (response.status === 422) throw new Error('PASSWORD_POLICY')
    throw new Error(`HTTP_ERROR_${response.status}`)
  }
  const data: RegisterResponse = await response.json()
  return data
}

function decodePlan(token: string): string {
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1]))
    if (payload && typeof payload === 'object' && 'plan' in payload && typeof (payload as Record<string, unknown>).plan === 'string') {
      return (payload as Record<string, string>).plan
    }
  } catch { /* ignore */ }
  return 'free'
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const baseUrl: string = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('INVALID_CREDENTIALS')
    throw new Error(`HTTP_ERROR_${response.status}`)
  }
  const data: LoginResponse = await response.json()
  localStorage.setItem('calcing_token', data.access_token)
  localStorage.setItem('calcing_refresh_token', data.refresh_token)
  localStorage.setItem('calcing_plan', data.plan ?? decodePlan(data.access_token))
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
  if (fullName) localStorage.setItem('calcing_name', fullName)
  return data
}

export async function logout(): Promise<void> {
  localStorage.removeItem('calcing_token')
  localStorage.removeItem('calcing_refresh_token')
  localStorage.removeItem('calcing_plan')
  localStorage.removeItem('calcing_name')
}

export async function refresh(): Promise<RefreshResponse> {
  const baseUrl: string = import.meta.env.VITE_API_URL ?? ''
  const storedRefreshToken = localStorage.getItem('calcing_refresh_token')
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: storedRefreshToken }),
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('REFRESH_EXPIRED')
    throw new Error(`HTTP_ERROR_${response.status}`)
  }
  const data: RefreshResponse = await response.json()
  localStorage.setItem('calcing_token', data.access_token)
  return data
}

export function getStoredToken(): string | null {
  return localStorage.getItem('calcing_token')
}

export function getStoredPlan(): string {
  return localStorage.getItem('calcing_plan') ?? 'free'
}

export function getStoredName(): string {
  return localStorage.getItem('calcing_name') ?? ''
}
