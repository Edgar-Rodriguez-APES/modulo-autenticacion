import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LanguageSelector from '../components/ui/LanguageSelector'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
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
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const result = await login(formData)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setErrors({ general: result.error })
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
          {t('auth.login')}
        </h2>
        <p className="text-center text-sm text-slate-600 mb-8">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.register')}
          </Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-sm text-danger-600">{errors.general}</p>
              </div>
            )}
            
            <Input
              label={t('auth.email')}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="tu@email.com"
              autoComplete="email"
            />
            
            <Input
              label={t('auth.password')}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="current-password"
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
                  {t('auth.rememberMe')}
                </label>
              </div>
              
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {t('auth.loginButton')}
            </Button>
          </form>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <LanguageSelector />
        </div>
      </div>
    </div>
  )
}

export default LoginPage