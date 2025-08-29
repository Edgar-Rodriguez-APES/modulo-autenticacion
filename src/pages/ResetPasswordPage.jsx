import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthError } from '../hooks/useAuthError'
import { validatePasswordRealTime, getPasswordRequirementsList } from '../utils/passwordValidation'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import NetworkStatus from '../components/ui/NetworkStatus'
import RateLimitHandler from '../components/ui/RateLimitHandler'
import ErrorRecovery from '../components/ui/ErrorRecovery'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('reset-password')
  const [searchParams] = useSearchParams()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState(null)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  useEffect(() => {
    // Get reset token from URL parameters
    const resetToken = searchParams.get('token') || searchParams.get('reset_token')
    if (resetToken) {
      setToken(resetToken)
    } else {
      // If no token, redirect to forgot password page
      navigate('/forgot-password')
    }
  }, [searchParams, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Clear auth errors when user makes changes
    if (error) {
      clearError()
    }

    // Real-time password validation
    if (name === 'password' || name === 'confirmPassword') {
      const newFormData = { ...formData, [name]: value }
      const validation = validatePasswordRealTime(
        newFormData.password, 
        newFormData.confirmPassword
      )
      setPasswordValidation(validation)
      
      if (name === 'password') {
        setShowPasswordRequirements(value.length > 0)
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Use password validation utility
    if (passwordValidation) {
      if (!passwordValidation.password.isValid) {
        newErrors.password = passwordValidation.password.errors[0]
      }
      if (passwordValidation.confirmation && !passwordValidation.confirmation.isValid) {
        newErrors.confirmPassword = passwordValidation.confirmation.errors[0]
      }
    } else {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida'
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña'
      }
    }
    
    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const performResetPassword = async () => {
    const result = await resetPassword(token, formData.password)
    
    if (result.success) {
      setSuccess(true)
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
          }
        })
      }, 3000)
      return result
    } else {
      // Handle reset password errors through error handler
      const error = new Error(result.error)
      error.response = {
        status: result.status || 400,
        data: { error: { code: result.code, message: result.error } }
      }
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    clearError()
    
    try {
      await performResetPassword()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    await retryOperation(performResetPassword)
  }

  // Success state
  if (success) {
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
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                ¡Contraseña Restablecida!
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login en unos segundos.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Ir al Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const requirements = getPasswordRequirementsList(formData.password)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Technoagentes
          </Link>
        </div>
        <h2 className="text-center text-3xl font-bold text-slate-900 mb-2">
          Nueva Contraseña
        </h2>
        <p className="text-center text-sm text-slate-600 mb-8">
          Ingresa tu nueva contraseña para completar el restablecimiento
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
            
            <div>
              <Input
                label="Nueva Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              
              {/* Password Strength Indicator */}
              {passwordValidation && passwordValidation.strength.showIndicator && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Fortaleza de la contraseña:</span>
                    <span 
                      className="font-medium"
                      style={{ color: passwordValidation.strength.color }}
                    >
                      {passwordValidation.strength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${passwordValidation.strength.percentage}%`,
                        backgroundColor: passwordValidation.strength.color
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              {showPasswordRequirements && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">Requisitos de contraseña:</p>
                  <div className="space-y-1">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className={`w-4 h-4 rounded-full mr-2 flex items-center justify-center ${
                          req.met ? 'bg-green-500' : 'bg-slate-300'
                        }`}>
                          {req.met && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={req.met ? 'text-green-700' : 'text-slate-600'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={validationErrors.confirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            
            <Button
              type="submit"
              className="w-full"
              loading={loading || isRetrying}
              disabled={loading || isRetrying || !passwordValidation?.isFormValid}
            >
              {loading || isRetrying ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </Button>
            
            <div className="text-center space-y-2">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Volver al login
              </Link>
              <p className="text-xs text-slate-500">
                ¿Enlace expirado?{' '}
                <Link 
                  to="/forgot-password" 
                  className="text-primary-600 hover:text-primary-500"
                >
                  Solicitar nuevo enlace
                </Link>
              </p>
            </div>
          </form>

          {/* Error Recovery */}
          <ErrorRecovery 
            error={error}
            context="reset-password"
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

export default ResetPasswordPage