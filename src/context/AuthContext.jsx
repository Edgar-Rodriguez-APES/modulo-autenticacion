import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../utils/api'
import tokenManager from '../utils/tokenManager'
import tokenRefreshManager from '../utils/tokenRefreshManager'
import { handleAuthError } from '../utils/authErrors'

const AuthContext = createContext()

const initialState = {
  user: null,
  tenant: null,
  isAuthenticated: false,
  permissions: [],
  loading: true,
  error: null,
  tokens: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  },
  sessionValid: false
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null }
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tenant: action.payload.tenant,
        tokens: action.payload.tokens,
        permissions: action.payload.permissions || [],
        isAuthenticated: true,
        sessionValid: true,
        loading: false,
        error: null
      }
    
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        sessionValid: false
      }
    
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      }
    
    case 'SESSION_VALIDATED':
      return {
        ...state,
        user: action.payload.user,
        tenant: action.payload.tenant,
        tokens: action.payload.tokens,
        permissions: action.payload.permissions || [],
        isAuthenticated: true,
        sessionValid: true,
        loading: false,
        error: null
      }
    
    case 'SESSION_INVALID':
      return {
        ...initialState,
        loading: false
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    
    case 'UPDATE_TOKENS':
      return {
        ...state,
        tokens: action.payload
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Set up token refresh manager callbacks
    tokenRefreshManager.onRefreshSuccessCallback((newToken) => {
      // Update tokens in state when refresh succeeds
      const { refreshToken } = tokenManager.getTokens()
      dispatch({ 
        type: 'UPDATE_TOKENS', 
        payload: {
          accessToken: newToken,
          refreshToken,
          expiresAt: tokenManager.getTokenExpiry(newToken)
        }
      })
    })

    tokenRefreshManager.onRefreshFailureCallback((error) => {
      console.error('Token refresh failed in AuthContext:', error)
      // Force logout on refresh failure
      dispatch({ type: 'LOGOUT' })
    })

    tokenRefreshManager.onTokenExpiredCallback(() => {
      console.log('Token expired, logging out user')
      dispatch({ type: 'LOGOUT' })
    })

    // Check for existing session on app load
    validateSession()

    // Cleanup on unmount
    return () => {
      tokenRefreshManager.cleanup()
    }
  }, [])

  const validateSession = async () => {
    try {
      const { accessToken } = tokenManager.getTokens()
      
      if (!accessToken) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      // Use token manager to ensure we have a valid token
      const validToken = await tokenManager.ensureValidToken()
      if (!validToken) {
        dispatch({ type: 'SESSION_INVALID' })
        return
      }

      // Validate token with Auth Service
      try {
        const response = await api.auth.validateToken(validToken)
        
        if (response.success) {
          const user = response.data.user
          const tenant = response.data.tenant
          
          // Store user data if not already stored
          const currentUserData = tokenManager.getUserData()
          if (!currentUserData) {
            tokenManager.setUserData({ user, tenant })
          }
          
          const permissions = getPermissionsByRole(user.role)
          
          dispatch({ 
            type: 'SESSION_VALIDATED', 
            payload: {
              user: {
                user_id: user.user_id,
                tenant_id: user.tenant_id,
                email: user.email,
                name: user.name || user.email,
                role: user.role,
                email_verified: user.email_verified || true
              },
              tenant: tenant || {
                tenant_id: user.tenant_id,
                name: 'Default Tenant'
              },
              tokens: {
                accessToken: validToken,
                refreshToken: tokenManager.getTokens().refreshToken,
                expiresAt: tokenManager.getTokenExpiry(validToken)
              },
              permissions
            }
          })
          
          // Schedule automatic token refresh for validated session
          tokenRefreshManager.scheduleNextRefresh()
        } else {
          tokenManager.clearTokens()
          dispatch({ type: 'SESSION_INVALID' })
        }
      } catch (error) {
        const authError = handleAuthError(error, 'session-validation')
        if (authError.shouldLogout) {
          tokenManager.clearTokens()
          dispatch({ type: 'SESSION_INVALID' })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }
    } catch (error) {
      console.error('Session validation error:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (credentials) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await api.auth.login(credentials)
      
      if (response.success) {
        const { access_token, refresh_token, user, tenant } = response.data
        
        // Store tokens using token manager
        tokenManager.setTokens(access_token, refresh_token)
        
        // Store user and tenant data
        tokenManager.setUserData({ user, tenant })
        
        // Schedule automatic token refresh
        tokenRefreshManager.scheduleNextRefresh()
        
        // Extract permissions based on role
        const permissions = getPermissionsByRole(user.role)
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: {
            user: {
              user_id: user.user_id,
              tenant_id: user.tenant_id,
              email: user.email,
              name: user.name || user.email,
              role: user.role,
              email_verified: user.email_verified || true
            },
            tenant: tenant || {
              tenant_id: user.tenant_id,
              name: 'Default Tenant'
            },
            tokens: {
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresAt: tokenManager.getTokenExpiry(access_token)
            },
            permissions
          }
        })
        
        return { success: true, user, tenant }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'login')
      dispatch({ type: 'AUTH_ERROR', payload: authError })
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await api.auth.register(userData)
      
      if (response.success) {
        const registerData = response.data
        
        // Registration successful, user needs to verify email
        dispatch({ type: 'SET_LOADING', payload: false })
        
        return { 
          success: true, 
          requiresVerification: !registerData.email_verified,
          verificationToken: registerData.verification_token,
          user: {
            user_id: registerData.user_id,
            email: registerData.email,
            name: registerData.name,
            status: registerData.status
          }
        }
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'register')
      dispatch({ type: 'AUTH_ERROR', payload: authError })
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await api.auth.verifyEmail(verificationToken)
      
      if (response.success) {
        const verifyData = response.data
        
        return { 
          success: true, 
          user: {
            user_id: verifyData.user_id,
            email_verified: verifyData.email_verified,
            verified_at: verifyData.verified_at
          }
        }
      } else {
        throw new Error(response.message || 'Email verification failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'verify-email')
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const resendVerification = async (email) => {
    try {
      const response = await api.auth.resendVerification(email)
      
      if (response.success) {
        const resendData = response.data
        
        return { 
          success: true, 
          verificationToken: resendData.verification_token
        }
      } else {
        throw new Error(response.message || 'Resend verification failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'resend-verification')
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await api.auth.forgotPassword(email)
      
      if (response.success) {
        const forgotData = response.data
        
        return { 
          success: true, 
          resetToken: forgotData.reset_token
        }
      } else {
        throw new Error(response.message || 'Forgot password failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'forgot-password')
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.auth.resetPassword(token, newPassword)
      
      if (response.success) {
        const resetData = response.data
        
        return { 
          success: true, 
          user: {
            user_id: resetData.user_id,
            password_updated: resetData.password_updated,
            updated_at: resetData.updated_at
          }
        }
      } else {
        throw new Error(response.message || 'Password reset failed')
      }
    } catch (error) {
      const authError = handleAuthError(error, 'reset-password')
      return { 
        success: false, 
        error: authError.message,
        code: authError.code,
        suggestions: authError.suggestions,
        retryable: authError.retryable
      }
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate tokens on server
      await api.auth.logout()
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear tokens and cleanup
      tokenManager.clearTokens()
      tokenManager.cleanup()
      dispatch({ type: 'LOGOUT' })
    }
  }

  const refreshTokens = async () => {
    try {
      const validToken = await tokenManager.ensureValidToken()
      if (validToken) {
        const { refreshToken } = tokenManager.getTokens()
        dispatch({ 
          type: 'UPDATE_TOKENS', 
          payload: {
            accessToken: validToken,
            refreshToken,
            expiresAt: tokenManager.getTokenExpiry(validToken)
          }
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const updateUser = (userData) => {
    // Update local state
    dispatch({ type: 'UPDATE_USER', payload: userData })
    
    // Update stored user data
    const currentUserData = tokenManager.getUserData()
    if (currentUserData) {
      tokenManager.setUserData({ 
        ...currentUserData, 
        user: { ...currentUserData.user, ...userData }
      })
    }
  }

  // Helper function to get permissions based on role
  const getPermissionsByRole = (role) => {
    const permissions = {
      MASTER: [
        'manage_users',
        'manage_subscription', 
        'view_billing',
        'access_agents',
        'manage_payment_methods',
        'manage_tenant_settings'
      ],
      ADMIN: [
        'manage_users',
        'access_agents',
        'view_billing'
      ],
      MEMBER: [
        'access_agents'
      ]
    }
    
    return permissions[role] || permissions.MEMBER
  }

  const value = {
    ...state,
    login,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    refreshTokens,
    clearError,
    validateSession,
    // Utility methods
    hasPermission: (permission) => state.permissions.includes(permission),
    hasRole: (role) => {
      const roleHierarchy = { 'MEMBER': 1, 'ADMIN': 2, 'MASTER': 3 }
      const userLevel = roleHierarchy[state.user?.role] || 0
      const requiredLevel = roleHierarchy[role] || 0
      return userLevel >= requiredLevel
    },
    isTokenExpired: () => {
      const { accessToken } = tokenManager.getTokens()
      return !accessToken || tokenManager.isTokenExpired(accessToken)
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}