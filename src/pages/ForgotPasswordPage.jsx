import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError(t('auth.emailRequired'))
      return
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('auth.invalidEmail'))
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await forgotPassword(email)
      
      // Always show success message for security (as per API documentation)
      setLoading(false)
      setIsSubmitted(true)
    } catch (error) {
      setLoading(false)
      setIsSubmitted(true) // Still show success for security
    }
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
                {t('auth.emailSent')}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('auth.emailSentDescription', { email })}
              </p>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  {t('auth.sendAnotherEmail')}
                </Button>
                <Link
                  to="/login"
                  className="block text-sm text-primary-600 hover:text-primary-500"
                >
                  {t('auth.backToLogin')}
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
          {t('auth.resetPassword')}
        </h2>
        <p className="text-center text-sm text-slate-600 mb-8">
          {t('auth.resetPasswordDescription')}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-sm text-danger-600">{error}</p>
              </div>
            )}
            
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {t('auth.sendRecoveryLink')}
            </Button>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage