import React, { useState } from 'react'
import Button from './Button'

/**
 * Comprehensive error display component for authentication errors
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showRetry = true, 
  showSuggestions = true,
  className = '' 
}) => {
  const [isRetrying, setIsRetrying] = useState(false)

  if (!error) return null

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorIcon = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return (
          <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'RATE_LIMIT_EXCEEDED':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'EMAIL_NOT_VERIFIED':
        return (
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getErrorStyle = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return {
          container: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          button: 'bg-orange-100 hover:bg-orange-200 text-orange-800'
        }
      case 'RATE_LIMIT_EXCEEDED':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
        }
      case 'EMAIL_NOT_VERIFIED':
        return {
          container: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-100 hover:bg-blue-200 text-blue-800'
        }
      default:
        return {
          container: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          button: 'bg-red-100 hover:bg-red-200 text-red-800'
        }
    }
  }

  const style = getErrorStyle()

  return (
    <div className={`border rounded-lg p-4 ${style.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.text}`}>
            {error.message}
          </h3>
          
          {/* Error suggestions */}
          {showSuggestions && error.suggestions && error.suggestions.length > 0 && (
            <div className="mt-2">
              <p className={`text-xs ${style.text} opacity-75 mb-1`}>
                Sugerencias:
              </p>
              <ul className={`text-xs ${style.text} space-y-1`}>
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {showRetry && error.retryable && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                loading={isRetrying}
                disabled={isRetrying}
                className={`${style.button} text-xs`}
              >
                {isRetrying ? 'Reintentando...' : 'Reintentar'}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className={`${style.button} text-xs`}
              >
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorDisplay