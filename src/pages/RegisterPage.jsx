import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'

const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
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

  const steps = [
    { id: 1, title: t('register.step1.title') },
    { id: 2, title: t('register.step2.title') },
    { id: 3, title: t('register.step3.title') },
    { id: 4, title: t('register.step4.title') }
  ]

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      description: t('pricing.starter.description'),
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
      description: t('pricing.professional.description'),
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
      description: t('pricing.enterprise.description'),
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    switch (step) {
      case 1:
        if (!formData.companyName) newErrors.companyName = t('register.errors.companyNameRequired')
        if (!formData.companySize) newErrors.companySize = t('register.errors.companySizeRequired')
        if (!formData.industry) newErrors.industry = t('register.errors.industryRequired')
        if (!formData.country) newErrors.country = t('register.errors.countryRequired')
        break
        
      case 2:
        if (!formData.firstName) newErrors.firstName = t('register.errors.firstNameRequired')
        if (!formData.lastName) newErrors.lastName = t('register.errors.lastNameRequired')
        if (!formData.email) newErrors.email = t('register.errors.emailRequired')
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('register.errors.emailInvalid')
        if (!formData.password) newErrors.password = t('register.errors.passwordRequired')
        else if (formData.password.length < 8) newErrors.password = t('register.errors.passwordTooShort')
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('register.errors.passwordMismatch')
        break
        
      case 4:
        if (!formData.cardNumber) newErrors.cardNumber = t('register.errors.cardNumberRequired')
        if (!formData.expiryDate) newErrors.expiryDate = t('register.errors.expiryDateRequired')
        if (!formData.cvv) newErrors.cvv = t('register.errors.cvvRequired')
        if (!formData.cardholderName) newErrors.cardholderName = t('register.errors.cardholderNameRequired')
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      // Redirect to verify email or dashboard
      navigate('/verify-email')
    }, 2000)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep 
          formData={formData} 
          errors={errors} 
          onChange={handleInputChange} 
        />
      case 2:
        return <UserInfoStep 
          formData={formData} 
          errors={errors} 
          onChange={handleInputChange} 
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
          errors={errors} 
          onChange={handleInputChange} 
        />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-slate-900">
            Technoagentes
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {t('auth.register')}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              {t('auth.login')}
            </Link>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.id <= currentStep 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <span className="ml-3 font-medium text-sm text-slate-700 hidden sm:block">
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-primary-600' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <Card>
          {renderStep()}
          
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              {t('common.previous')}
            </Button>
            
            <Button
              onClick={handleNext}
              loading={loading}
              disabled={loading}
            >
              {currentStep === 4 ? t('register.completeRegistration') : t('common.next')}
            </Button>
          </div>
        </Card>

        <div className="mt-6 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

// Step Components
const CompanyInfoStep = ({ formData, errors, onChange }) => {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">{t('register.step1.title')}</h3>
        <p className="text-sm text-slate-600">{t('register.step1.description')}</p>
      </div>
      
      <Input
        label={t('register.companyName')}
        value={formData.companyName}
        onChange={(e) => onChange('companyName', e.target.value)}
        error={errors.companyName}
        placeholder="Acme Corp"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('register.companySize')}
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => onChange('companySize', e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('register.selectCompanySize')}</option>
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
            {t('register.industry')}
          </label>
          <select
            value={formData.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('register.selectIndustry')}</option>
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
        label={t('register.country')}
        value={formData.country}
        onChange={(e) => onChange('country', e.target.value)}
        error={errors.country}
        placeholder="España"
      />
    </div>
  )
}

const UserInfoStep = ({ formData, errors, onChange }) => {
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">{t('register.step2.title')}</h3>
        <p className="text-sm text-slate-600">{t('register.step2.description')}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('register.firstName')}
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          error={errors.firstName}
          placeholder="Juan"
        />
        
        <Input
          label={t('register.lastName')}
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="Pérez"
        />
      </div>
      
      <Input
        label={t('auth.email')}
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        error={errors.email}
        placeholder="juan@empresa.com"
      />
      
      <Input
        label={t('register.phone')}
        type="tel"
        value={formData.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        error={errors.phone}
        placeholder="+34 600 123 456"
      />
      
      <Input
        label={t('auth.password')}
        type="password"
        value={formData.password}
        onChange={(e) => onChange('password', e.target.value)}
        error={errors.password}
        placeholder="••••••••"
        helperText={t('register.passwordHelper')}
      />
      
      <Input
        label={t('auth.confirmPassword')}
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
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">{t('register.step3.title')}</h3>
        <p className="text-sm text-slate-600">{t('register.step3.description')}</p>
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
                  {t('pricing.mostPopular')}
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
                  {typeof plan.price === 'number' ? `$${plan.price}` : t('pricing.custom')}
                </div>
                {typeof plan.price === 'number' && (
                  <div className="text-sm text-slate-600">/{t('pricing.monthly').toLowerCase()}</div>
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
  const { t } = useTranslation()
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-slate-900">{t('register.step4.title')}</h3>
        <p className="text-sm text-slate-600">{t('register.step4.description')}</p>
      </div>
      
      <Input
        label={t('register.cardholderName')}
        value={formData.cardholderName}
        onChange={(e) => onChange('cardholderName', e.target.value)}
        error={errors.cardholderName}
        placeholder="Juan Pérez"
      />
      
      <Input
        label={t('register.cardNumber')}
        value={formData.cardNumber}
        onChange={(e) => onChange('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
        error={errors.cardNumber}
        placeholder="1234 5678 9012 3456"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('register.expiryDate')}
          value={formData.expiryDate}
          onChange={(e) => onChange('expiryDate', e.target.value)}
          error={errors.expiryDate}
          placeholder="MM/YY"
        />
        
        <Input
          label={t('register.cvv')}
          value={formData.cvv}
          onChange={(e) => onChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
          error={errors.cvv}
          placeholder="123"
        />
      </div>
      
      <Input
        label={t('register.billingAddress')}
        value={formData.billingAddress}
        onChange={(e) => onChange('billingAddress', e.target.value)}
        error={errors.billingAddress}
        placeholder="Calle Principal 123"
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('register.city')}
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          error={errors.city}
          placeholder="Madrid"
        />
        
        <Input
          label={t('register.zipCode')}
          value={formData.zipCode}
          onChange={(e) => onChange('zipCode', e.target.value)}
          error={errors.zipCode}
          placeholder="28001"
        />
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-medium">$149.00</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-600">IVA (21%):</span>
          <span className="font-medium">$31.29</span>
        </div>
        <div className="border-t border-slate-200 mt-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Total:</span>
            <span className="font-bold text-lg text-slate-900">$180.29</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage