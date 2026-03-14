import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isBackendEnabled,
  solveExpression,
  differentiateExpression,
  integrateExpression,
} from './mathService'

const BASE_URL = 'http://localhost:8001'

function mockFetchOk(data: object) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

function mockFetchError() {
  return vi.fn().mockRejectedValue(new Error('Network error'))
}

function mockFetchNotOk() {
  return vi.fn().mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({}),
  })
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

// --- isBackendEnabled ---

describe('mathService', () => {
  describe('isBackendEnabled', () => {
    it('retorna false cuando VITE_USE_BACKEND no está definido', () => {
      expect(isBackendEnabled()).toBe(false)
    })

    it('retorna false cuando VITE_USE_BACKEND === "false"', () => {
      vi.stubEnv('VITE_USE_BACKEND', 'false')
      expect(isBackendEnabled()).toBe(false)
    })

    it('retorna true cuando VITE_USE_BACKEND === "true"', () => {
      vi.stubEnv('VITE_USE_BACKEND', 'true')
      expect(isBackendEnabled()).toBe(true)
    })
  })

  // --- solveExpression ---

  describe('solveExpression', () => {
    it('llama a fetch con la URL correcta y método POST', async () => {
      const fetchMock = mockFetchOk({ result: '4', steps: [] })
      vi.stubGlobal('fetch', fetchMock)

      await solveExpression('2+2')

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/solve`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('llama a fetch con Content-Type application/json', async () => {
      const fetchMock = mockFetchOk({ result: '4', steps: [] })
      vi.stubGlobal('fetch', fetchMock)

      await solveExpression('2+2')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('llama a fetch con body { expression } serializado', async () => {
      const fetchMock = mockFetchOk({ result: '4', steps: [] })
      vi.stubGlobal('fetch', fetchMock)

      await solveExpression('2+2')

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ expression: '2+2' }),
        })
      )
    })

    it('retorna { result, steps } cuando fetch responde ok', async () => {
      vi.stubGlobal('fetch', mockFetchOk({ result: '4', steps: ['2+2=4'] }))

      const res = await solveExpression('2+2')

      expect(res).toEqual({ result: '4', steps: ['2+2=4'] })
    })

    it('retorna error "Network error" cuando fetch lanza excepción', async () => {
      vi.stubGlobal('fetch', mockFetchError())

      const res = await solveExpression('2+2')

      expect(res).toEqual({ result: '', steps: [], error: 'Network error' })
    })

    it('retorna error "Server error" cuando response.ok es false', async () => {
      vi.stubGlobal('fetch', mockFetchNotOk())

      const res = await solveExpression('2+2')

      expect(res).toEqual({ result: '', steps: [], error: 'Server error' })
    })
  })

  // --- differentiateExpression ---

  describe('differentiateExpression', () => {
    it('llama a POST /differentiate con body { expression, variable, order: 1 }', async () => {
      const fetchMock = mockFetchOk({ result: 'cos(x)', steps: [] })
      vi.stubGlobal('fetch', fetchMock)

      await differentiateExpression('sin(x)', 'x')

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/differentiate`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ expression: 'sin(x)', variable: 'x', order: 1 }),
        })
      )
    })

    it('retorna { result, steps } cuando fetch responde ok', async () => {
      vi.stubGlobal('fetch', mockFetchOk({ result: 'cos(x)', steps: ['d/dx(sin(x)) = cos(x)'] }))

      const res = await differentiateExpression('sin(x)', 'x')

      expect(res).toEqual({ result: 'cos(x)', steps: ['d/dx(sin(x)) = cos(x)'] })
    })

    it('retorna error "Network error" cuando fetch lanza excepción', async () => {
      vi.stubGlobal('fetch', mockFetchError())

      const res = await differentiateExpression('sin(x)', 'x')

      expect(res).toEqual({ result: '', steps: [], error: 'Network error' })
    })

    it('retorna error "Server error" cuando response.ok es false', async () => {
      vi.stubGlobal('fetch', mockFetchNotOk())

      const res = await differentiateExpression('sin(x)', 'x')

      expect(res).toEqual({ result: '', steps: [], error: 'Server error' })
    })
  })

  // --- integrateExpression ---

  describe('integrateExpression', () => {
    it('llama a POST /integrate con body { expression, variable }', async () => {
      const fetchMock = mockFetchOk({ result: 'x**3/3', steps: [] })
      vi.stubGlobal('fetch', fetchMock)

      await integrateExpression('x**2', 'x')

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/integrate`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ expression: 'x**2', variable: 'x' }),
        })
      )
    })

    it('retorna { result, steps } cuando fetch responde ok', async () => {
      vi.stubGlobal('fetch', mockFetchOk({ result: 'x**3/3', steps: ['∫x²dx = x³/3 + C'] }))

      const res = await integrateExpression('x**2', 'x')

      expect(res).toEqual({ result: 'x**3/3', steps: ['∫x²dx = x³/3 + C'] })
    })

    it('retorna error "Network error" cuando fetch lanza excepción', async () => {
      vi.stubGlobal('fetch', mockFetchError())

      const res = await integrateExpression('x**2', 'x')

      expect(res).toEqual({ result: '', steps: [], error: 'Network error' })
    })

    it('retorna error "Server error" cuando response.ok es false', async () => {
      vi.stubGlobal('fetch', mockFetchNotOk())

      const res = await integrateExpression('x**2', 'x')

      expect(res).toEqual({ result: '', steps: [], error: 'Server error' })
    })
  })
})