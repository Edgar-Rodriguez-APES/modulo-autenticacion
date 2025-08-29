import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthError } from '../../hooks/useAuthError'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Wrapper component for router context
const wrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useAuthError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
  })

  describe('handleError', () => {
    it('should process network errors correctly', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const networkError = new Error('Network Error')
      networkError.response = {
        status: 0,
        data: { error: { code: 'NETWORK_ERROR', message: 'Network connection failed' } }
      }

      act(() => {
        result.current.handleError(networkError)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error.code).toBe('NETWORK_ERROR')
      expect(result.current.error.retryable).toBe(true)
    })

    it('should process authentication errors correctly', () => {
      const { result } = renderHook(() => useAuthError('login'), { wrapper })
      
      const authError = new Error('Invalid credentials')
      authError.response = {
        status: 401,
        data: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }
      }

      act(() => {
        result.current.handleError(authError)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error.code).toBe('INVALID_CREDENTIALS')
      expect(result.current.error.retryable).toBe(false)
    })

    it('should process rate limit errors correctly', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.response = {
        status: 429,
        data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
      }

      act(() => {
        result.current.handleError(rateLimitError)
      })

      expect(result.current.error).toBeDefined()
      expect(result.current.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(result.current.error.retryable).toBe(true)
    })

    it('should handle errors that require logout', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const tokenError = new Error('Token expired')
      tokenError.response = {
        status: 401,
        data: { error: { code: 'AUTHENTICATION_ERROR', message: 'Token expired' } }
      }

      act(() => {
        result.current.handleError(tokenError)
      })

      expect(result.current.error.shouldLogout).toBe(true)
      
      // Should navigate to login after timeout
      setTimeout(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
          state: { message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' }
        })
      }, 2100)
    })
  })

  describe('clearError', () => {
    it('should clear the current error', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      // Set an error first
      const error = new Error('Test error')
      act(() => {
        result.current.handleError(error)
      })
      
      expect(result.current.error).toBeDefined()
      
      // Clear the error
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('retryOperation', () => {
    it('should retry operation successfully', async () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const mockOperation = vi.fn().mockResolvedValue({ success: true })
      
      await act(async () => {
        await result.current.retryOperation(mockOperation)
      })
      
      expect(mockOperation).toHaveBeenCalledTimes(1)
      expect(result.current.error).toBeNull()
    })

    it('should retry operation with exponential backoff on failure', async () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const mockOperation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true })
      
      await act(async () => {
        await result.current.retryOperation(mockOperation, 3)
      })
      
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('should not retry if error is not retryable', async () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      // Set a non-retryable error
      const nonRetryableError = new Error('Invalid credentials')
      nonRetryableError.response = {
        status: 401,
        data: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }
      }
      
      act(() => {
        result.current.handleError(nonRetryableError)
      })
      
      const mockOperation = vi.fn()
      
      await act(async () => {
        await result.current.retryOperation(mockOperation)
      })
      
      expect(mockOperation).not.toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('should return correct error information', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      const error = new Error('Test error')
      error.response = {
        status: 400,
        data: { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Validation failed',
            suggestions: ['Check your input', 'Try again']
          } 
        }
      }
      
      act(() => {
        result.current.handleError(error)
      })
      
      expect(result.current.getErrorCode()).toBe('VALIDATION_ERROR')
      expect(result.current.getErrorMessage()).toBe('Validation failed')
      expect(result.current.getErrorSuggestions()).toEqual(['Check your input', 'Try again'])
      expect(result.current.isRetryable()).toBe(false)
      expect(result.current.hasError).toBe(true)
    })

    it('should return correct values when no error', () => {
      const { result } = renderHook(() => useAuthError('test'), { wrapper })
      
      expect(result.current.getErrorCode()).toBeNull()
      expect(result.current.getErrorMessage()).toBeNull()
      expect(result.current.getErrorSuggestions()).toEqual([])
      expect(result.current.isRetryable()).toBe(false)
      expect(result.current.hasError).toBe(false)
    })
  })
})