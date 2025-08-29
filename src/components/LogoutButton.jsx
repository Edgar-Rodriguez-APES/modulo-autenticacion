import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from './ui/Button'

const LogoutButton = ({ variant = 'outline', className = '', showConfirmation = true }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = async () => {
    if (showConfirmation && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    
    try {
      await logout()
      // Redirect to login page after successful logout
      navigate('/login', { 
        state: { 
          message: 'Has cerrado sesión exitosamente.' 
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, redirect to login for security
      navigate('/login')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50">
          <h4 className="text-sm font-medium text-slate-900 mb-2">
            ¿Cerrar sesión?
          </h4>
          <p className="text-xs text-slate-600 mb-4">
            ¿Estás seguro de que quieres cerrar sesión?
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="danger"
              onClick={handleLogout}
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              Sí, cerrar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleCancel}
        />
        
        {/* Original button */}
        <Button 
          variant={variant} 
          className={className}
          onClick={handleLogout}
          loading={loading}
          disabled={loading}
        >
          Cerrar Sesión
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant={variant} 
      className={className}
      onClick={handleLogout}
      loading={loading}
      disabled={loading}
    >
      {loading ? 'Cerrando...' : 'Cerrar Sesión'}
    </Button>
  )
}

export default LogoutButton