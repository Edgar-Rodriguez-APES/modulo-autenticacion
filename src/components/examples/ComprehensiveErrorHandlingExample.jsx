import React, { useState } from 'react'
import { useAuthError } from '../../hooks/useAuthError'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ErrorDisplay from '../ui/ErrorDisplay'
import NetworkStatus from '../ui/NetworkStatus'
import RateLimitHandler from '../ui/RateLimitHandler'
import ErrorRecovery from '../ui/ErrorRecovery'

/**
 * Comprehensive example showing how to use all error handling components together
 * This demonstrates the complete error handling pattern for authentication pages
 */
const ComprehensiveErrorHandlingExample = () => {
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('example')
  
  const [loading, setLoading] = useState(false)

  // Simulate different types of errors for demonstration
  const simulateError = (errorType) => {
    const errors = {
      network: () => {
        const error = new Error('Network connection failed')
        error.response = {
          status: 0,
          data: { error: { code: 'NETWORK_ERROR', message: 'Network connection failed' } }
        }
        return error
      },
      rateLimit: () => {
        const error = new Error('Too many requests')
        error.response = {
          status: 429,
          data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } }
        }
        return error
      },
      invalidCredentials: () => {
        const error = new Error('Invalid credentials')
        error.response = {
          status: 401,
          data: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }
        }
        return error
      },
      emailNotVerified: () => {
        const error = new Error('Email not verified')
        error.response = {
          status: 403,
          data: { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first' } }
        }
        return error
      },
      accountLocked: () => {
        const error = new Error('Account locked')
        error.response = {
          status: 423,
          data: { error: { code: 'ACCOUNT_LOCKED', message: 'Account temporarily locked' } }
        }
        return error
      },
      serverError: () => {
        const error = new Error('Internal server error')
        error.response = {
          status: 500,
          data: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }
        }
        return error
      }
    }
    
    handleError(errors[errorType]())
  }

  // Simulate a successful operation
  const simulateSuccess = async () => {
    setLoading(true)
    clearError()
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate success
      console.log('Operation completed successfully!')
      
      return { success: true }
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  // Simulate retry operation
  const handleRetry = async () => {
    await retryOperation(simulateSuccess)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Comprehensive Error Handling Example
        </h2>
        <p className="text-slate-600">
          This example demonstrates all error handling components working together
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Error Simulation Controls
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('network')}
            >
              Network Error
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('rateLimit')}
            >
              Rate Limit Error
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('invalidCredentials')}
            >
              Invalid Credentials
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('emailNotVerified')}
            >
              Email Not Verified
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('accountLocked')}
            >
              Account Locked
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => simulateError('serverError')}
            >
              Server Error
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={simulateSuccess}
              loading={loading || isRetrying}
              disabled={loading || isRetrying}
            >
              Simulate Success
            </Button>
            
            <Button
              variant="outline"
              onClick={clearError}
              disabled={!error}
            >
              Clear Error
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Handling Components */}
      <div className="space-y-4">
        {/* Network Status Component */}
        <NetworkStatus onRetry={handleRetry} />

        {/* Rate Limit Handler Component */}
        <RateLimitHandler 
          error={error} 
          onRetry={handleRetry}
          onDismiss={clearError}
        />

        {/* Main Error Display Component */}
        <ErrorDisplay 
          error={error}
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
        />

        {/* Error Recovery Component */}
        <ErrorRecovery 
          error={error}
          context="example"
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
        />
      </div>

      {/* Error State Information */}
      {error && (
        <Card>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">Error State Information</h4>
            <div className="text-sm space-y-1">
              <p><strong>Code:</strong> {error.code}</p>
              <p><strong>Message:</strong> {error.message}</p>
              <p><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</p>
              <p><strong>Should Logout:</strong> {error.shouldLogout ? 'Yes' : 'No'}</p>
              {error.suggestions && error.suggestions.length > 0 && (
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside ml-4">
                    {error.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-900">How to Use This Pattern</h4>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>1. Import the hook:</strong> Use <code>useAuthError('context')</code> 
              where context describes the page/component (e.g., 'login', 'register').
            </p>
            <p>
              <strong>2. Add error components:</strong> Include NetworkStatus, RateLimitHandler, 
              ErrorDisplay, and ErrorRecovery components in your JSX.
            </p>
            <p>
              <strong>3. Handle errors:</strong> Call <code>handleError(error)</code> in your 
              catch blocks to process and display errors appropriately.
            </p>
            <p>
              <strong>4. Implement retry:</strong> Use <code>retryOperation(operation)</code> 
              for automatic retry with exponential backoff.
            </p>
            <p>
              <strong>5. Clear errors:</strong> Call <code>clearError()</code> when users 
              make changes or want to dismiss errors.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ComprehensiveErrorHandlingExample