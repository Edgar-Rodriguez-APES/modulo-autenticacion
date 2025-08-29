import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuthError, AuthErrorHandler } from '../utils/authErrors'

/**
 * Custom hook for comprehensive authentication error handling
 */
export const useAuthError = (context = '') => {
  const [error, setError] = useState(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const navigate = useNavigate()

  /**
   * Handle an authentication error
   */
  const handleError = useCallback((rawError, errorContext = context) => {
    const processedError = handleAuthError(rawError, errorContext)
    setError(processedError)

    // Handle automatic redirects based on error type
    if (processedError.shouldLogout) {
      // Clear auth state and redirect to login
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' 
          }
        })
      }, 2000)
    } else if (processedError.shouldRedirectToVerification) {
      // Redirect to email verification
      setTimeout(() => {
        navigate('/verify-email')
      }, 2000)
    }

    return processedError
  }, [context, navigate])

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Retry a failed operation with exponential backoff
   */
  const retryOperation = useCallback(async (operation, maxAttempts = 3) => {
    if (!error?.retryable || isRetrying) return

    setIsRetrying(true)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Wait for retry delay if not first attempt
        if (attempt > 0) {
          const delay = AuthErrorHandler.getRetryDelay(error, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const result = await operation()
        
        // If successful, clear error and return result
        if (result?.success !== false) {
          clearError()
          setIsRetrying(false)
          return result
        }
        
        // If still failing, update error for next attempt
        if (attempt < maxAttempts - 1) {
          handleError(new Error(result?.error || 'Operation failed'))
        }
      } catch (retryError) {
        // If this is the last attempt, handle the error
        if (attempt === maxAttempts - 1) {
          handleError(retryError)
        }
      }
    }
    
    setIsRetrying(false)
  }, [error, isRetrying, handleError, clearError])

  /**
   * Get retry delay for current error
   */
  const getRetryDelay = useCallback((attempt = 0) => {
    if (!error) return 0
    return AuthErrorHandler.getRetryDelay(error, attempt)
  }, [error])

  /**
   * Check if error should trigger logout
   */
  const shouldLogout = useCallback(() => {
    if (!error) return false
    return AuthErrorHandler.shouldLogout(error)
  }, [error])

  /**
   * Check if error should redirect to verification
   */
  const shouldRedirectToVerification = useCallback(() => {
    if (!error) return false
    return AuthErrorHandler.shouldRedirectToVerification(error)
  }, [error])

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback(() => {
    return error?.message || null
  }, [error])

  /**
   * Get error suggestions
   */
  const getErrorSuggestions = useCallback(() => {
    return error?.suggestions || []
  }, [error])

  /**
   * Check if error is retryable
   */
  const isRetryable = useCallback(() => {
    return error?.retryable || false
  }, [error])

  /**
   * Get error code
   */
  const getErrorCode = useCallback(() => {
    return error?.code || null
  }, [error])

  return {
    // State
    error,
    isRetrying,
    
    // Actions
    handleError,
    clearError,
    retryOperation,
    
    // Utilities
    getRetryDelay,
    shouldLogout,
    shouldRedirectToVerification,
    getErrorMessage,
    getErrorSuggestions,
    isRetryable,
    getErrorCode,
    
    // Computed properties
    hasError: !!error,
    canRetry: error?.retryable && !isRetrying
  }
}

export default useAuthError