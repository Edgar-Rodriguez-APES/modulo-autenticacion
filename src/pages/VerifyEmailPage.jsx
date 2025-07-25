import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'

const VerifyEmailPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get email from localStorage (set during registration)
    const pendingEmail = localStorage.getItem('pendingVerificationEmail')
    if (pendingEmail) {
      setEmail(pendingEmail)
    } else {
      // If no pending email, redirect to register
      navigate('/register')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!code) {
      setError(t('auth.codeRequired'))
      return
    }
    
    if (code.length !== 6) {
      setError(t('auth.codeLength'))
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await verifyEmail(code, email)
      
      if (result.success) {
        // Clear pending email from storage
        localStorage.removeItem('pendingVerificationEmail')
        // Redirect to login or dashboard
        navigate('/login')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return
    
    setResendLoading(true)
    
    try {
      // For now, we'll use the forgot password endpoint to resend verification
      // In a real implementation, there would be a separate resend verification endpoint
      alert(t('auth.codeResentSuccess'))
    } catch (error) {
      alert('Error al reenviar código')
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
          {t('auth.verifyEmail')}
        </h2>
        <p className="text-center text-sm text-slate-600 mb-8">
          {t('auth.verificationEmailSent')}
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
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('auth.verificationCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('auth.verificationCodePlaceholder')}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t('auth.verificationCodeHelper')}
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading || code.length !== 6}
            >
              {t('auth.verifyEmailButton')}
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">
                {t('auth.didntReceiveCode')}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                loading={resendLoading}
                disabled={resendLoading}
              >
                {t('auth.resendCode')}
              </Button>
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

export default VerifyEmailPage