import React, { useState } from 'react'
import { useAuthError } from '../../hooks/useAuthError'
import Button from '../ui/Button'
import Card from '../ui/Card'
import ErrorDisplay from '../ui/ErrorDisplay'
import NetworkStatus from '../ui/NetworkStatus'
import RateLimitHandler from '../ui/RateLimitHandler'
import ErrorRecovery from '../ui/ErrorRecovery'

/**
 * Example component demonstrating comprehensive error handling
 */
const ErrorHandlingExample = () => {
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('example')
  
  const [loading, setLoading] = useState(false)

  // Simulate different types of errors
  const simulateError = (errorType) => {
    const mockError = new Error('Simulated error')
    
    switch (errorType) {
      case 'network':
        // Network error
        mockError.response = null
        break
      case 'validation':
        // Validation error
        mockError.response = {
          status: 400,
          data: { error: { code: 'VALIDATION_ERROR', message: 'Los datos ingresados no son válidos' } }
        }
        break
      case 'credentials':
        // Invalid credentials
        mockError.response = {
          status: 401,
          data: { error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } }
        }
        break
      case 'rate-limit':
        // Rate limit exceeded
        mockError.response = {
          status: 429,
          data: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Demasiados intentos. Espera antes de intentar nuevamente.' } }
        }
        break
      case 'server':
        // Server error
        mockError.response = {
          status: 500,
          data: { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }
        }
        break
      default:
        mockError.response = {
          status: 400,
          data: { error: { code: 'UNKNOWN_ERROR', message: 'Error desconocido' } }
        }
    }
    
    handleError(mockError)
  }

  // Simulate a successful operation
  const simulateSuccess = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    clearError()
    alert('¡Operación exitosa!')
  }

  // Simulate retry operation
  const handleRetry = async () => {
    await retryOperation(simulateSuccess)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Demostración de Manejo de Errores
        </h2>
        
        <p className="text-sm text-slate-600 mb-6">
          Esta página demuestra el sistema completo de manejo de errores para autenticación.
        </p>

        {/* Error Simulation Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => simulateError('network')}
            variant="outline"
            size="sm"
          >
            Error de Red
          </Button>
          
          <Button
            onClick={() => simulateError('validation')}
            variant="outline"
            size="sm"
          >
            Error de Validación
          </Button>
          
          <Button
            onClick={() => simulateError('credentials')}
            variant="outline"
            size="sm"
          >
            Credenciales Inválidas
          </Button>
          
          <Button
            onClick={() => simulateError('rate-limit')}
            variant="outline"
            size="sm"
          >
            Límite de Intentos
          </Button>
          
          <Button
            onClick={() => simulateError('server')}
            variant="outline"
            size="sm"
          >
            Error del Servidor
          </Button>
          
          <Button
            onClick={simulateSuccess}
            loading={loading}
            disabled={loading}
          >
            Operación Exitosa
          </Button>
        </div>

        {/* Network Status */}
        <NetworkStatus onRetry={handleRetry} className="mb-4" />

        {/* Rate Limit Handler */}
        <RateLimitHandler 
          error={error} 
          onRetry={handleRetry}
          onDismiss={clearError}
          className="mb-4"
        />

        {/* Error Display */}
        <ErrorDisplay 
          error={error}
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
          className="mb-4"
        />

        {/* Error Recovery */}
        <ErrorRecovery 
          error={error}
          context="example"
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
        />

        {/* Clear Error Button */}
        {error && (
          <div className="mt-4 text-center">
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
            >
              Limpiar Error
            </Button>
          </div>
        )}
      </Card>

      {/* Error Information */}
      {error && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Información del Error
          </h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-700">Código:</span>
              <span className="ml-2 text-slate-600">{error.code}</span>
            </div>
            
            <div>
              <span className="font-medium text-slate-700">Mensaje:</span>
              <span className="ml-2 text-slate-600">{error.message}</span>
            </div>
            
            <div>
              <span className="font-medium text-slate-700">Reintentable:</span>
              <span className="ml-2 text-slate-600">{error.retryable ? 'Sí' : 'No'}</span>
            </div>
            
            {error.suggestions && error.suggestions.length > 0 && (
              <div>
                <span className="font-medium text-slate-700">Sugerencias:</span>
                <ul className="ml-2 mt-1 space-y-1">
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-slate-600">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default ErrorHandlingExample