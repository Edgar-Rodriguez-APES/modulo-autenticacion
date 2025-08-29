import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthError } from '../hooks/useAuthError'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'
import ErrorDisplay from '../components/ui/ErrorDisplay'

const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const { verifyEmail, resendVerification } = useAuth()
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('verify-email')
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [autoVerifying, setAutoVerifying] = useState(false)

  useEffect(() => {
    const pendingEmail = localStorage.getItem('pendingVerificationEmail')
    const pendingUserName = localStorage.getItem('pendingUserName')
    
    if (pendingEmail) {
      setEmail(pendingEmail)
      setUserName(pendingUserName || '')
    }

    const token = searchParams.get('token') || searchParams.get('verification_token')
    if (token) {
      setAutoVerifying(true)
      handleAutoVerification(token)
    } else if (!pendingEmail) {
      navigate('/register')
    }
  }, [searchParams, navigate])

  const performVerification = async (token) => {
    const result = await verifyEmail(token)
    
    if (result.success) {
      setSuccess('¡Email verificado exitosamente! Redirigiendo al login...')
      localStorage.removeItem('pendingVerificationEmail')
      localStorage.removeItem('pendingUserName')
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
            email: email 
          }
        })
      }, 2000)
      return result
    } else {
      const error = new Error(result.error)
      error.response = {
        status: result.status || 400,
        data: { error: { code: result.code, message: result.error } }
      }
      throw error
    }
  }

  const handleAutoVerification = async (token) => {
    try {
      await performVerification(token)
    } catch (error) {
      handleError(error)
    } finally {
      setAutoVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!code) {
      handleError(new Error('El código de verificación es requerido'))
      return
    }
    
    if (code.length !== 6) {
      handleError(new Error('El código debe tener 6 dígitos'))
      return
    }

    setLoading(true)
    clearError()
    setSuccess('')
    
    try {
      await performVerification(code)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    if (code) {
      await retryOperation(() => performVerification(code))
    }
  }

  const performResend = async () => {
    if (!email) {
      throw new Error('No se encontró el email para reenviar la verificación')
    }
    
    const result = await resendVerification(email)
    
    if (result.success) {
      setSuccess('Código de verificación reenviado exitosamente. Revisa tu email.')
      return result
    } else {
      const error = new Error(result.error)
      error.response = {
        status: result.status || 400,
        data: { error: { code: result.code, message: result.error } }
      }
      throw error
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    clearError()
    setSuccess('')
    
    try {
      await performResend()
    } catch (error) {
      handleError(error)
    } finally {
      setResendLoading(false)
    }
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
          Verificar Email
        </h2>
        {email && (
          <p className="text-center text-sm text-slate-600 mb-8">
            Hemos enviado un código de verificación a <strong>{email}</strong>
            {userName && <span><br />para <strong>{userName}</strong></span>}
          </p>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {autoVerifying && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Verificando tu email automáticamente...</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          <ErrorDisplay 
            error={error}
            onRetry={canRetry ? handleRetry : null}
            onDismiss={clearError}
            className="mb-4"
          />

          {!autoVerifying && !success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código de Verificación
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-lg tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Ingresa el código de 6 dígitos que enviamos a tu email
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                loading={loading || isRetrying}
                disabled={loading || isRetrying || code.length !== 6}
              >
                Verificar Email
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-600">
                  ¿No recibiste el código?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  loading={resendLoading || isRetrying}
                  disabled={resendLoading || isRetrying}
                >
                  Reenviar Código
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link 
              to="/register" 
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ← Volver al registro
            </Link>
          </div>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

export { VerifyEmailPage }exp
ort default VerifyEmailPage