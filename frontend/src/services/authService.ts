export interface RegisterResponse {
  id: string
  email: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RefreshResponse {
  access_token: string
  token_type: string
}

export async function register(email: string, password: string): Promise<RegisterResponse> {
  const baseUrl: string = import.meta.env.VITE_API_URL ?? ''
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    if (response.status === 409) throw new Error('EMAIL_ALREADY_EXISTS')
    throw new Error(`HTTP_ERROR_${response.status}`)
  }
  const data: RegisterResponse = await response.json()
  return data
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
  return data
}

export async function logout(): Promise<void> {
  localStorage.removeItem('calcing_token')
  localStorage.removeItem('calcing_refresh_token')
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
