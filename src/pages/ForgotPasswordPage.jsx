import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthError } from '../hooks/useAuthError'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import NetworkStatus from '../components/ui/NetworkStatus'
import RateLimitHandler from '../components/ui/RateLimitHandler'
import ErrorRecovery from '../components/ui/ErrorRecovery'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const { forgotPassword } = useAuth()
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('forgot-password')
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const performForgotPassword = async () => {
    const result = await forgotPassword(email)
    
    if (result.success) {
      setIsSubmitted(true)
      return result
    } else {
      // Handle specific error cases
      if (result.code === 'RATE_LIMIT_EXCEEDED') {
        const error = new Error(result.error)
        error.response = {
          status: result.status || 429,
          data: { error: { code: result.code, message: result.error } }
        }
        throw error
      } else {
        // For security, always show success message even if user not found
        setIsSubmitted(true)
        return result
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      handleError(new Error('El email es requerido'))
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      handleError(new Error('Email inválido'))
      return
    }

    setLoading(true)
    clearError()
    
    try {
      await performForgotPassword()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    await retryOperation(performForgotPassword)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Link to="/" className="text-2xl font-bold text-slate-900">
              Technoagentes
            </Link>
          </div>
          
          <Card>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Email Enviado
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Si existe una cuenta con el email <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña en unos minutos.
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Enviar otro email
                </Button>
                <Link
                  to="/login"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  Volver al login
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Technoagentes
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold text-slate-900 mb-2">
          Restablecer Contraseña
        </h2>
        <p className="text-center text-sm text-slate-600 mb-8">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            
            <Button
              type="submit"
              className="w-full"
              loading={loading || isRetrying}
              disabled={loading || isRetrying}
            >
              {loading || isRetrying ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Volver al login
              </Link>
            </div>
          </form>

          {/* Error Recovery */}
          <ErrorRecovery 
            error={error}
            context="forgot-password"
            onRetry={canRetry ? handleRetry : null}
            onDismiss={clearError}
            className="mt-4"
          />
        </Card>
        
        <div className="mt-6 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage