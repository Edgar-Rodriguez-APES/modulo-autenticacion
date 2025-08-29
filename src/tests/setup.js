import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server'

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_AUTH_BASE_URL: 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth',
    VITE_TENANT_BASE_URL: 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/tenant',
    VITE_APP_ENV: 'test',
    VITE_DEV_MODE: 'true',
    VITE_ENABLE_HTTPS_ONLY: 'false',
    VITE_ENABLE_CSRF_PROTECTION: 'false',
    VITE_TOKEN_STORAGE_TYPE: 'localStorage'
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
}

// Mock crypto for token generation
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(32))
  }
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}