import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthError } from '../hooks/useAuthError'
import { useFormExperience } from '../hooks/useFormExperience'
import { ToastProvider, useToast } from '../components/ui/Toast'
import { validatePasswordRealTime, getPasswordRequirementsList } from '../utils/passwordValidation'
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
import { PageTransition, StaggeredAnimation } from '../components/ui/Transitions'
import { 
  AccessibleFormField, 
  AccessibleProgress, 
  ScreenReaderAnnouncer, 
  LoadingAnnouncer,
  SkipLink 
} from '../components/ui/AccessibilityEnhanced'

const RegisterPageContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const { register } = useAuth()
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('register')
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    companyName: '',
    companySize: '',
    industry: '',
    country: '',
    
    // Step 2: User Info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Step 3: Plan Selection
    selectedPlan: 'professional',
    
    // Step 4: Payment Info
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    zipCode: ''
  })

  // Real-time password validation
  const [passwordValidation, setPasswordValidation] = useState(null)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)

  const steps = [
    { id: 1, title: 'Información de la Empresa' },
    { id: 2, title: 'Información Personal' },
    { id: 3, title: 'Selección de Plan' },
    { id: 4, title: 'Información de Pago' }
  ]

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      description: 'Perfecto para equipos pequeños',
      features: [
        'Hasta 2 usuarios',
        'Acceso a Feedo y Forecaster',
        '1,000 consultas/mes',
        'Soporte por email'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 149,
      description: 'Ideal para empresas en crecimiento',
      popular: true,
      features: [
        'Hasta 10 usuarios',
        'Todos los agentes AI',
        '10,000 consultas/mes',
        'Soporte prioritario',
        'Dashboards avanzados'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'custom',
      description: 'Solución completa para grandes empresas',
      features: [
        'Usuarios ilimitados',
        'Agentes personalizados',
        'Consultas ilimitadas',
        'Soporte 24/7'
      ]
    }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear auth errors when user makes changes
    if (error) {
      clearError()
    }

    // Real-time password validation
    if (field === 'password' || field === 'confirmPassword') {
      const newFormData = { ...formData, [field]: value }
      const validation = validatePasswordRealTime(
        newFormData.password, 
        newFormData.confirmPassword
      )
      setPasswordValidation(validation)
      
      if (field === 'password') {
        setShowPasswordRequirements(value.length > 0)
      }
    }
  }

  // Initialize password validation on component mount
  useEffect(() => {
    if (formData.password || formData.confirmPassword) {
      const validation = validatePasswordRealTime(formData.password, formData.confirmPassword)
      setPasswordValidation(validation)
    }
  }, [formData.password, formData.confirmPassword])

  const validateStep = (step) => {
    const newErrors = {}
    
    switch (step) {
      case 1:
        if (!formData.companyName) newErrors.companyName = 'El nombre de la empresa es requerido'
        if (!formData.companySize) newErrors.companySize = 'El tamaño de la empresa es requerido'
        if (!formData.industry) newErrors.industry = 'La industria es requerida'
        if (!formData.country) newErrors.country = 'El país es requerido'
        break
        
      case 2:
        if (!formData.firstName) newErrors.firstName = 'El nombre es requerido'
        if (!formData.lastName) newErrors.lastName = 'El apellido es requerido'
        if (!formData.email) newErrors.email = 'El email es requerido'
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El email no es válido'
        
        // Use password validation utility
        if (passwordValidation) {
          if (!passwordValidation.password.isValid) {
            newErrors.password = passwordValidation.password.errors[0]
          }
          if (passwordValidation.confirmation && !passwordValidation.confirmation.isValid) {
            newErrors.confirmPassword = passwordValidation.confirmation.errors[0]
          }
        } else {
          if (!formData.password) newErrors.password = 'La contraseña es requerida'
          if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña'
        }
        break
        
      case 4:
        if (!formData.cardNumber) newErrors.cardNumber = 'El número de tarjeta es requerido'
        if (!formData.expiryDate) newErrors.expiryDate = 'La fecha de vencimiento es requerida'
        if (!formData.cvv) newErrors.cvv = 'El CVV es requerido'
        if (!formData.cardholderName) newErrors.cardholderName = 'El nombre del titular es requerido'
        break
    }
    
    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
        toast.success(`Paso ${currentStep} completado`)
      } else {
        handleSubmit()
      }
    } else {
      toast.error('Por favor completa todos los campos requeridos')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const performRegistration = async () => {
    // Generate tenant_id from company name (simplified approach)
    const tenantId = formData.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20) + '_' + Date.now().toString().slice(-6)

    // Prepare registration data for Auth Service
    const registrationData = {
      tenant_id: tenantId,
      email: formData.email,
      password: formData.password,
      name: `${formData.firstName} ${formData.lastName}`,
      role: 'MASTER' // First user is always MASTER
    }

    const result = await register(registrationData)
    
    if (result.success) {
      // Show success animation
      setShowSuccess(true)
      toast.success('¡Registro completado exitosamente!')
      
      if (result.requiresVerification) {
        // Store email and user info for verification page
        localStorage.setItem('pendingVerificationEmail', formData.email)
        localStorage.setItem('pendingUserName', `${formData.firstName} ${formData.lastName}`)
        
        // Wait for animation before redirecting
        setTimeout(() => {
          navigate('/verify-email')
        }, 2000)
      } else {
        // Direct login (shouldn't happen with current API)
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
      return result
    } else {
      // Handle registration errors through error handler
      const error = new Error(result.error)
      error.response = {
        status: result.status || 400,
        data: { error: { code: result.code, message: result.error } }
      }
      throw error
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    clearError()
    
    try {
      await performRegistration()
    } catch (error) {
      handleError(error)
      
      // Mark email field with error for styling if conflict
      if (error.response?.data?.error?.code === 'RESOURCE_CONFLICT') {
        setValidationErrors({ email: ' ' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    await retryOperation(performRegistration)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep 
          formData={formData} 
          errors={validationErrors} 
          onChange={handleInputChange} 
        />
      case 2:
        return <UserInfoStep 
          formData={formData} 
          errors={validationErrors} 
          onChange={handleInputChange}
          passwordValidation={passwordValidation}
          showPasswordRequirements={showPasswordRequirements}
        />
      case 3:
        return <PlanSelectionStep 
          formData={formData} 
          plans={plans}
          onChange={handleInputChange} 
        />
      case 4:
        return <PaymentInfoStep 
          formData={formData} 
          errors={validationErrors} 
          onChange={handleInputChange} 
        />
      default:
        return null
    }
  }

  return (
    <PageTransition type="slideUp" duration={400}>
      <SkipLink />
      <div className="min-h-screen bg-slate-50 py-12">
        {/* Loading Announcer for Screen Readers */}
        <LoadingAnnouncer 
          isLoading={loading || isRetrying} 
          loadingMessage="Procesando registro, por favor espera"
          completedMessage="Registro procesado"
        />
        
        {/* Success Announcer */}
        <ScreenReaderAnnouncer 
          message={showSuccess ? "Registro completado exitosamente, redirigiendo a verificación de email" : ""}
          priority="assertive"
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggeredAnimation staggerDelay={150} animation="fadeUp">
            <div className="text-center mb-8">
              <Link to="/" className="text-2xl font-bold text-slate-900">
                Technoagentes
              </Link>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                Crear Cuenta
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8">
              <AccessibleProgress
                steps={steps}
                currentStep={currentStep - 1}
                showLabels={true}
              />
            </div>
          </StaggeredAnimation>

          <Card>
            {/* Success Animation Overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-10 rounded-lg">
                <SuccessAnimation
                  message="¡Registro completado!"
                  size="lg"
                  showMessage={true}
                />
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

            <div id="main-content">
              {renderStep()}
            </div>
            
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || loading || isRetrying || showSuccess}
                aria-label={`Volver al paso ${currentStep - 1}`}
              >
                Anterior
              </Button>
              
              <Button
                onClick={handleNext}
                loading={loading || isRetrying}
                disabled={loading || isRetrying || showSuccess}
                aria-describedby="next-button-help"
              >
                {loading || isRetrying ? (
                  <span className="flex items-center justify-center">
                    <LoadingSpinner size="sm" variant="white" className="mr-2" />
                    {currentStep === 4 ? 'Completando...' : 'Procesando...'}
                  </span>
                ) : showSuccess ? (
                  'Redirigiendo...'
                ) : (
                  currentStep === 4 ? 'Completar Registro' : 'Siguiente'
                )}
              </Button>
              <p id="next-button-help" className="sr-only">
                {currentStep === 4 
                  ? 'Presiona para completar el registro y crear tu cuenta'
                  : `Presiona para continuar al paso ${currentStep + 1}`
                }
              </p>
            </div>
          </Card>

          {/* Error Recovery */}
          <ErrorRecovery 
            error={error}
            context="register"
            onRetry={canRetry ? handleRetry : null}
            onDismiss={clearError}
            className="mt-4"
          />

          <div className="mt-6 flex justify-center">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

// Wrap with Toast Provider
const RegisterPage = () => {
  return (
    <ToastProvider>
      <RegisterPageContent />
    </ToastProvider>
  )
}

// Step Components
const CompanyInfoStep = ({ formData, errors, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">Información de la Empresa</h3>
        <p className="text-sm text-slate-600">Cuéntanos sobre tu empresa</p>
      </div>
      
      <Input
        label="Nombre de la Empresa"
        value={formData.companyName}
        onChange={(e) => onChange('companyName', e.target.value)}
        error={errors.companyName}
        placeholder="Acme Corp"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tamaño de la Empresa
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => onChange('companySize', e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecciona el tamaño</option>
            <option value="1-10">1-10 empleados</option>
            <option value="11-50">11-50 empleados</option>
            <option value="51-200">51-200 empleados</option>
            <option value="201-1000">201-1000 empleados</option>
            <option value="1000+">1000+ empleados</option>
          </select>
          {errors.companySize && <p className="mt-1 text-sm text-danger-600">{errors.companySize}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Industria
          </label>
          <select
            value={formData.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecciona la industria</option>
            <option value="logistics">Logística y Transporte</option>
            <option value="retail">Retail y E-commerce</option>
            <option value="manufacturing">Manufactura</option>
            <option value="healthcare">Salud</option>
            <option value="technology">Tecnología</option>
            <option value="other">Otro</option>
          </select>
          {errors.industry && <p className="mt-1 text-sm text-danger-600">{errors.industry}</p>}
        </div>
      </div>
      
      <Input
        label="País"
        value={formData.country}
        onChange={(e) => onChange('country', e.target.value)}
        error={errors.country}
        placeholder="España"
      />
    </div>
  )
}

const UserInfoStep = ({ formData, errors, onChange, passwordValidation, showPasswordRequirements }) => {
  const requirements = getPasswordRequirementsList(formData.password)
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">Información Personal</h3>
        <p className="text-sm text-slate-600">Crea tu cuenta de usuario</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
          placeholder="Juan"
        />
        
        <Input
          label="Apellido"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="Pérez"
        />
      </div>
      
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        error={errors.email}
        placeholder="juan@empresa.com"
      />
      
      <Input
        label="Teléfono"
        type="tel"
        value={formData.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        error={errors.phone}
        placeholder="+34 600 123 456"
      />
      
      <div>
        <Input
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={(e) => onChange('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
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
        label="Confirmar Contraseña"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => onChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        placeholder="••••••••"
      />
    </div>
  )
}

const PlanSelectionStep = ({ formData, plans, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">Selección de Plan</h3>
        <p className="text-sm text-slate-600">Elige el plan que mejor se adapte a tu empresa</p>
      </div>
      
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              formData.selectedPlan === plan.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => onChange('selectedPlan', plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-4">
                <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Más Popular
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={formData.selectedPlan === plan.id}
                  onChange={() => onChange('selectedPlan', plan.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {typeof plan.price === 'number' ? `€${plan.price}` : 'Personalizado'}
                </div>
                {typeof plan.price === 'number' && (
                  <div className="text-sm text-slate-600">/mes</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-slate-600">
                  <svg className="h-4 w-4 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PaymentInfoStep = ({ formData, errors, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">Información de Pago</h3>
        <p className="text-sm text-slate-600">Completa tu información de facturación</p>
      </div>
      
      <Input
        label="Nombre del Titular"
        value={formData.cardholderName}
        onChange={(e) => onChange('cardholderName', e.target.value)}
        error={errors.cardholderName}
        placeholder="Juan Pérez"
      />
      
      <Input
        label="Número de Tarjeta"
        value={formData.cardNumber}
        onChange={(e) => onChange('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
        error={errors.cardNumber}
        placeholder="1234 5678 9012 3456"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha de Vencimiento"
          value={formData.expiryDate}
          onChange={(e) => onChange('expiryDate', e.target.value)}
          error={errors.expiryDate}
          placeholder="MM/YY"
        />
        
        <Input
          label="CVV"
          value={formData.cvv}
          onChange={(e) => onChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
          error={errors.cvv}
          placeholder="123"
        />
      </div>
      
      <Input
        label="Dirección de Facturación"
        value={formData.billingAddress}
        onChange={(e) => onChange('billingAddress', e.target.value)}
        error={errors.billingAddress}
        placeholder="Calle Principal 123"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ciudad"
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          error={errors.city}
          placeholder="Madrid"
        />
        
        <Input
          label="Código Postal"
          value={formData.zipCode}
          onChange={(e) => onChange('zipCode', e.target.value)}
          error={errors.zipCode}
          placeholder="28001"
        />
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-medium">€149.00</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-600">IVA (21%):</span>
          <span className="font-medium">€31.29</span>
        </div>
        <div className="border-t border-slate-200 mt-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total:</span>
            <span className="font-bold text-lg text-slate-900">€180.29</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage