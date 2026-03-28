import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { register, login, logout, refresh, getStoredToken } from './authService'

const TEST_API_URL = 'https://calcing.onrender.com'

let store: Record<string, string>

const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value },
  removeItem: (key: string): void => { delete store[key] },
  clear: (): void => { Object.keys(store).forEach(k => delete store[k]) },
}

function mockFetch(status: number, data: object) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

beforeEach(() => {
  store = {}
  vi.stubEnv('VITE_API_URL', TEST_API_URL)
  vi.stubGlobal('localStorage', localStorageMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('authService', () => {
  // --- register ---
  describe('register', () => {
    it('calls POST /auth/register with correct body', async () => {
      const fetchMock = mockFetch(201, { id: 'u1', email: 'a@b.com' })
      vi.stubGlobal('fetch', fetchMock)

      await register('a@b.com', 'pass123')

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_API_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'pass123' }),
        })
      )
    })

    it('returns { id, email } on 201', async () => {
      vi.stubGlobal('fetch', mockFetch(201, { id: 'u1', email: 'a@b.com' }))

      const result = await register('a@b.com', 'pass123')

      expect(result).toEqual({ id: 'u1', email: 'a@b.com' })
    })

    it('throws Error("EMAIL_ALREADY_EXISTS") on 409', async () => {
      vi.stubGlobal('fetch', mockFetch(409, {}))

      await expect(register('a@b.com', 'pass123')).rejects.toThrow('EMAIL_ALREADY_EXISTS')
    })

    it('throws generic Error on other HTTP errors (500)', async () => {
      vi.stubGlobal('fetch', mockFetch(500, {}))

      await expect(register('a@b.com', 'pass123')).rejects.toThrow('HTTP_ERROR_500')
    })
  })

  // --- login ---
  describe('login', () => {
    it('calls POST /auth/login with correct body', async () => {
      const fetchMock = mockFetch(200, { access_token: 'at', refresh_token: 'rt', token_type: 'bearer' })
      vi.stubGlobal('fetch', fetchMock)

      await login('a@b.com', 'pass123')

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_API_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'pass123' }),
        })
      )
    })

    it('stores access_token in localStorage key "calcing_token" on success', async () => {
      vi.stubGlobal('fetch', mockFetch(200, { access_token: 'at-123', refresh_token: 'rt-456', token_type: 'bearer' }))

      await login('a@b.com', 'pass123')

      expect(store['calcing_token']).toBe('at-123')
    })

    it('stores refresh_token in localStorage key "calcing_refresh_token" on success', async () => {
      vi.stubGlobal('fetch', mockFetch(200, { access_token: 'at-123', refresh_token: 'rt-456', token_type: 'bearer' }))

      await login('a@b.com', 'pass123')

      expect(store['calcing_refresh_token']).toBe('rt-456')
    })

    it('returns { access_token, refresh_token, token_type } on 200', async () => {
      vi.stubGlobal('fetch', mockFetch(200, { access_token: 'at-123', refresh_token: 'rt-456', token_type: 'bearer' }))

      const result = await login('a@b.com', 'pass123')

      expect(result).toEqual({ access_token: 'at-123', refresh_token: 'rt-456', token_type: 'bearer' })
    })

    it('throws Error("INVALID_CREDENTIALS") on 401', async () => {
      vi.stubGlobal('fetch', mockFetch(401, {}))

      await expect(login('a@b.com', 'wrongpass')).rejects.toThrow('INVALID_CREDENTIALS')
    })
  })

  // --- logout ---
  describe('logout', () => {
    it('removes "calcing_token" from localStorage', async () => {
      store['calcing_token'] = 'at-123'

      await logout()

      expect(store['calcing_token']).toBeUndefined()
    })

    it('removes "calcing_refresh_token" from localStorage', async () => {
      store['calcing_refresh_token'] = 'rt-456'

      await logout()

      expect(store['calcing_refresh_token']).toBeUndefined()
    })
  })

  // --- refresh ---
  describe('refresh', () => {
    it('calls POST /auth/refresh with stored refresh_token', async () => {
      store['calcing_refresh_token'] = 'rt-stored'
      const fetchMock = mockFetch(200, { access_token: 'new-at', token_type: 'bearer' })
      vi.stubGlobal('fetch', fetchMock)

      await refresh()

      expect(fetchMock).toHaveBeenCalledWith(
        `${TEST_API_URL}/auth/refresh`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refresh_token: 'rt-stored' }),
        })
      )
    })

    it('updates "calcing_token" in localStorage on success', async () => {
      store['calcing_refresh_token'] = 'rt-stored'
      vi.stubGlobal('fetch', mockFetch(200, { access_token: 'new-at', token_type: 'bearer' }))

      await refresh()

      expect(store['calcing_token']).toBe('new-at')
    })

    it('throws Error("REFRESH_EXPIRED") on 401', async () => {
      store['calcing_refresh_token'] = 'expired-rt'
      vi.stubGlobal('fetch', mockFetch(401, {}))

      await expect(refresh()).rejects.toThrow('REFRESH_EXPIRED')
    })
  })

  // --- getStoredToken ---
  describe('getStoredToken', () => {
    it('returns value from localStorage key "calcing_token"', () => {
      store['calcing_token'] = 'my-token'

      expect(getStoredToken()).toBe('my-token')
    })

    it('returns null when "calcing_token" is not set', () => {
      expect(getStoredToken()).toBeNull()
    })
  })
})
