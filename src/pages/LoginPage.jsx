import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthError } from '../hooks/useAuthError'
import { useFormExperience } from '../hooks/useFormExperience'
import { ToastProvider, useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import NetworkStatus from '../components/ui/NetworkStatus'
import RateLimitHandler from '../components/ui/RateLimitHandler'
import ErrorRecovery from '../components/ui/ErrorRecovery'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import SuccessAnimation from '../components/ui/SuccessAnimation'
import { PageTransition, LoadingTransition } from '../components/ui/Transitions'
import { 
  AccessibleFormField, 
  ScreenReaderAnnouncer, 
  LoadingAnnouncer,
  SkipLink 
} from '../components/ui/AccessibilityEnhanced'

const LoginPageContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { login, isAuthenticated } = useAuth()
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('login')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [validationErrors, setValidationErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Handle success message from location state (e.g., from email verification)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      if (location.state?.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }))
      }
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Clear auth errors when user makes changes
    if (error) {
      clearError()
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    }
    
    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const performLogin = async () => {
    const result = await login({
      email: formData.email,
      password: formData.password
    })
    
    if (result.success) {
      // Show success animation
      setShowSuccess(true)
      toast.success('¡Inicio de sesión exitoso! Redirigiendo...')
      
      // Wait for animation before redirecting
      setTimeout(() => {
        const redirectTo = location.state?.from?.pathname || '/dashboard'
        navigate(redirectTo, { replace: true })
      }, 1500)
      
      return result
    } else {
      // Handle login errors through error handler
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
    setSuccessMessage('')
    
    try {
      await performLogin()
    } catch (error) {
      handleError(error)
      
      // Mark form fields with errors for styling
      if (error.response?.data?.error?.code === 'INVALID_CREDENTIALS') {
        setValidationErrors({ 
          email: ' ', // Mark field as having error for styling
          password: ' '
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    await retryOperation(performLogin)
  }

  return (
    <PageTransition type="slideUp" duration={400}>
      <SkipLink />
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Loading Announcer for Screen Readers */}
        <LoadingAnnouncer 
          isLoading={loading || isRetrying} 
          loadingMessage="Iniciando sesión, por favor espera"
          completedMessage="Proceso de inicio de sesión completado"
        />
        
        {/* Success Announcer */}
        <ScreenReaderAnnouncer 
          message={showSuccess ? "Inicio de sesión exitoso, redirigiendo al panel de control" : ""}
          priority="assertive"
        />

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <Link to="/" className="text-2xl font-bold text-slate-900">
              Technoagentes
            </Link>
          </div>
          <h1 className="text-center text-3xl font-bold text-slate-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-center text-sm text-slate-600 mb-8">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            {/* Success Animation Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-lg">
                <SuccessAnimation
                  message="¡Inicio de sesión exitoso!"
                  size="lg"
                  showMessage={true}
                />
              </div>
            )}

            <LoadingTransition
              isLoading={loading || isRetrying}
              loadingComponent={
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingSpinner 
                    size="lg" 
                    showLabel={true}
                    label="Iniciando sesión..."
                  />
                </div>
              }
            >
              <form onSubmit={handleSubmit} className="space-y-6" id="main-content">
                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="alert">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

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
                
                <AccessibleFormField
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={validationErrors.email && validationErrors.email !== ' ' ? validationErrors.email : ''}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required={true}
                  helperText="Ingresa el email que usaste para registrarte"
                />
                
                <AccessibleFormField
                  id="password"
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={validationErrors.password && validationErrors.password !== ' ' ? validationErrors.password : ''}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required={true}
                  helperText="Mínimo 8 caracteres"
                />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-slate-700">
                  Recordarme
                </label>
              </div>
              
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            
                <Button
                  type="submit"
                  className="w-full"
                  loading={loading || isRetrying}
                  disabled={loading || isRetrying || showSuccess}
                  aria-describedby="login-button-help"
                >
                  {loading || isRetrying ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="sm" variant="white" className="mr-2" />
                      Iniciando sesión...
                    </span>
                  ) : showSuccess ? (
                    'Redirigiendo...'
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
                <p id="login-button-help" className="sr-only">
                  Presiona para iniciar sesión con las credenciales ingresadas
                </p>

            {/* Additional Help Links */}
            <div className="text-center space-y-2">
              <p className="text-xs text-slate-500">
                ¿Problemas para iniciar sesión?
              </p>
              <div className="flex justify-center space-x-4 text-xs">
                <Link 
                  to="/verify-email" 
                  className="text-primary-600 hover:text-primary-500"
                >
                  Verificar email
                </Link>
                <span className="text-slate-300">|</span>
                <Link 
                  to="/forgot-password" 
                  className="text-primary-600 hover:text-primary-500"
                >
                  Restablecer contraseña
                </Link>
              </div>
            </div>
              </form>
            </LoadingTransition>

            {/* Error Recovery */}
            <ErrorRecovery 
              error={error}
              context="login"
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
    </PageTransition>
  )
}

// Wrap with Toast Provider
const LoginPage = () => {
  return (
    <ToastProvider>
      <LoginPageContent />
    </ToastProvider>
  )
}

export default LoginPage