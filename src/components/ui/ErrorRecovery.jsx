import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from './Button'

/**
 * Error recovery component that provides guided recovery flows
 */
const ErrorRecovery = ({ 
  error, 
  context, 
  onRetry, 
  onDismiss,
  className = '' 
}) => {
  const navigate = useNavigate()

  if (!error) return null

  const getRecoveryActions = () => {
    const actions = []

    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        if (context === 'login') {
          actions.push({
            type: 'link',
            to: '/forgot-password',
            text: 'Restablecer contraseña',
            variant: 'primary'
          })
          actions.push({
            type: 'link',
            to: '/register',
            text: 'Crear nueva cuenta',
            variant: 'ghost'
          })
        }
        break

      case 'EMAIL_NOT_VERIFIED':
        actions.push({
          type: 'link',
          to: '/verify-email',
          text: 'Verificar email',
          variant: 'primary'
        })
        actions.push({
          type: 'button',
          onClick: () => navigate('/verify-email'),
          text: 'Reenviar código',
          variant: 'ghost'
        })
        break

      case 'RESOURCE_CONFLICT':
        if (context === 'register') {
          actions.push({
            type: 'link',
            to: '/login',
            text: 'Iniciar sesión',
            variant: 'primary'
          })
          actions.push({
            type: 'link',
            to: '/forgot-password',
            text: '¿Olvidaste tu contraseña?',
            variant: 'ghost'
          })
        }
        break

      case 'ACCOUNT_LOCKED':
        actions.push({
          type: 'link',
          to: '/forgot-password',
          text: 'Restablecer contraseña',
          variant: 'primary'
        })
        actions.push({
          type: 'button',
          onClick: () => window.open('mailto:soporte@technoagentes.com', '_blank'),
          text: 'Contactar soporte',
          variant: 'ghost'
        })
        break

      case 'NETWORK_ERROR':
        if (onRetry) {
          actions.push({
            type: 'button',
            onClick: onRetry,
            text: 'Reintentar',
            variant: 'primary'
          })
        }
        actions.push({
          type: 'button',
          onClick: () => window.location.reload(),
          text: 'Recargar página',
          variant: 'ghost'
        })
        break

      case 'SERVICE_UNAVAILABLE':
      case 'INTERNAL_ERROR':
        actions.push({
          type: 'button',
          onClick: () => window.open('https://status.technoagentes.com', '_blank'),
          text: 'Ver estado del servicio',
          variant: 'primary'
        })
        if (onRetry) {
          actions.push({
            type: 'button',
            onClick: onRetry,
            text: 'Reintentar',
            variant: 'ghost'
          })
        }
        break

      default:
        if (error.retryable && onRetry) {
          actions.push({
            type: 'button',
            onClick: onRetry,
            text: 'Reintentar',
            variant: 'primary'
          })
        }
        break
    }

    return actions
  }

  const getRecoveryMessage = () => {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return '¿Necesitas ayuda para acceder a tu cuenta?'
      case 'EMAIL_NOT_VERIFIED':
        return 'Verifica tu email para continuar'
      case 'RESOURCE_CONFLICT':
        return '¿Ya tienes una cuenta con este email?'
      case 'ACCOUNT_LOCKED':
        return 'Tu cuenta está temporalmente bloqueada'
      case 'NETWORK_ERROR':
        return 'Problema de conexión detectado'
      case 'SERVICE_UNAVAILABLE':
        return 'El servicio está temporalmente no disponible'
      case 'RATE_LIMIT_EXCEEDED':
        return 'Demasiados intentos realizados'
      default:
        return 'Opciones de recuperación disponibles'
    }
  }

  const actions = getRecoveryActions()

  if (actions.length === 0) return null

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-4 ${className}`}>
      <div className="text-center">
        <div className="mb-3">
          <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h4 className="text-sm font-medium text-slate-900 mb-2">
          {getRecoveryMessage()}
        </h4>
        
        <div className="space-y-2">
          {actions.map((action, index) => {
            if (action.type === 'link') {
              return (
                <Link
                  key={index}
                  to={action.to}
                  className={`block w-full ${
                    action.variant === 'primary'
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  } px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                >
                  {action.text}
                </Link>
              )
            } else {
              return (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant}
                  size="sm"
                  className="w-full"
                >
                  {action.text}
                </Button>
              )
            }
          })}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-3 text-xs text-slate-500 hover:text-slate-700"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorRecovery