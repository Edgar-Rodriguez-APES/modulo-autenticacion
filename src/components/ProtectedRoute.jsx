import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './ui/Loading'

/**
 * ProtectedRoute Component
 * Handles authentication and authorization for protected pages
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string|Array<string>} props.requiredRole - Required role(s) to access the route
 * @param {string|Array<string>} props.requiredPermission - Required permission(s) to access the route
 * @param {string} props.redirectTo - Where to redirect if not authorized (default: '/login')
 * @param {React.ReactNode} props.fallback - Custom fallback component for unauthorized access
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null,
  redirectTo = '/login',
  fallback = null
}) => {
  const { 
    isAuthenticated, 
    loading, 
    user, 
    hasRole, 
    hasPermission, 
    validateSession 
  } = useAuth()
  
  const location = useLocation()
  const [isValidating, setIsValidating] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Validate session on component mount and route changes
  useEffect(() => {
    const performValidation = async () => {
      setIsValidating(true)
      setAuthError(null)
      
      try {
        // If user appears authenticated, validate the session
        if (isAuthenticated && user) {
          await validateSession()
        }
      } catch (error) {
        console.error('Session validation error:', error)
        setAuthError('Session validation failed')
      } finally {
        setIsValidating(false)
      }
    }

    performValidation()
  }, [location.pathname, isAuthenticated, user, validateSession])

  // Show loading state during authentication check or session validation
  if (loading || isValidating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-slate-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // If authentication failed or session is invalid, redirect to login
  if (!isAuthenticated || authError) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location,
          message: authError || 'Debes iniciar sesión para acceder a esta página'
        }} 
        replace 
      />
    )
  }

  // Check role-based access control
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasRequiredRole = roles.some(role => hasRole(role))
    
    if (!hasRequiredRole) {
      if (fallback) {
        return fallback
      }
      
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Acceso Denegado
              </h3>
              <p className="text-slate-600 mb-4">
                No tienes permisos suficientes para acceder a esta página.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Rol requerido: {roles.join(' o ')}<br />
                Tu rol actual: {user?.role || 'No definido'}
              </p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // Check permission-based access control
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
    const hasRequiredPermission = permissions.some(permission => hasPermission(permission))
    
    if (!hasRequiredPermission) {
      if (fallback) {
        return fallback
      }
      
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Permisos Insuficientes
              </h3>
              <p className="text-slate-600 mb-4">
                No tienes los permisos necesarios para acceder a esta funcionalidad.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Permiso requerido: {permissions.join(' o ')}<br />
                Contacta a tu administrador si necesitas acceso.
              </p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  // User is authenticated and authorized, render the protected content
  return children
}

/**
 * Higher-order component for protecting routes
 * @param {React.Component} Component - The component to protect
 * @param {Object} options - Protection options
 * @returns {React.Component} Protected component
 */
export const withAuth = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

/**
 * Hook for checking authentication status in components
 * @returns {Object} Authentication status and helpers
 */
export const useAuthGuard = () => {
  const auth = useAuth()
  
  const requireAuth = (callback) => {
    if (!auth.isAuthenticated) {
      console.warn('Authentication required for this action')
      return false
    }
    if (callback) callback()
    return true
  }
  
  const requireRole = (role, callback) => {
    if (!auth.isAuthenticated) {
      console.warn('Authentication required for this action')
      return false
    }
    if (!auth.hasRole(role)) {
      console.warn(`Role '${role}' required for this action`)
      return false
    }
    if (callback) callback()
    return true
  }
  
  const requirePermission = (permission, callback) => {
    if (!auth.isAuthenticated) {
      console.warn('Authentication required for this action')
      return false
    }
    if (!auth.hasPermission(permission)) {
      console.warn(`Permission '${permission}' required for this action`)
      return false
    }
    if (callback) callback()
    return true
  }
  
  return {
    ...auth,
    requireAuth,
    requireRole,
    requirePermission
  }
}

export default ProtectedRoute