import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api, handleApiResponse, handleApiError, getErrorMessage } from '../utils/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  tenant: null,
  subscription: null,
  isAuthenticated: false,
  permissions: [],
  loading: true,
  error: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tenant: action.payload.tenant,
        subscription: action.payload.subscription,
        permissions: action.payload.permissions || [],
        isAuthenticated: true,
        loading: false,
        error: null
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false
      }
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    case 'LOAD_PROFILE_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tenant: action.payload.tenant,
        subscription: action.payload.subscription,
        isAuthenticated: true,
        loading: false,
        error: null
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check for existing session on app load
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        // Validate token by fetching tenant profile
        try {
          const response = await api.tenant.getProfile()
          const profileData = handleApiResponse(response)
          
          // Extract user info from tenant profile
          const user = {
            user_id: profileData.tenant_id, // Will be updated when user endpoint is available
            email: profileData.email,
            name: profileData.name,
            role: 'MASTER', // Default role, will be updated from actual user data
            status: profileData.status
          }
          
          dispatch({ 
            type: 'LOAD_PROFILE_SUCCESS', 
            payload: {
              user,
              tenant: {
                tenant_id: profileData.tenant_id,
                name: profileData.name,
                status: profileData.status,
                settings: profileData.settings
              },
              subscription: profileData.subscription
            }
          })
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await api.auth.login(credentials)
      const loginData = handleApiResponse(response)
      
      // Store tokens
      localStorage.setItem('accessToken', loginData.tokens.access_token)
      localStorage.setItem('refreshToken', loginData.tokens.refresh_token)
      
      // Extract permissions based on role
      const permissions = getPermissionsByRole(loginData.user.role)
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: loginData.user,
          tenant: loginData.tenant,
          subscription: null, // Will be loaded separately if needed
          permissions
        }
      })
      
      return { success: true }
    } catch (error) {
      const apiError = handleApiError(error)
      const userMessage = getErrorMessage(apiError, '/auth/login')
      dispatch({ type: 'LOGIN_ERROR', payload: userMessage })
      return { 
        success: false, 
        error: userMessage,
        code: apiError.code,
        status: apiError.status,
        type: apiError.type
      }
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await api.auth.register(userData)
      const registerData = handleApiResponse(response)
      
      // Registration successful, but user needs to verify email
      return { 
        success: true, 
        requiresVerification: registerData.verification_required,
        userId: registerData.user_id,
        email: registerData.email
      }
    } catch (error) {
      const apiError = handleApiError(error)
      const userMessage = getErrorMessage(apiError, '/auth/register')
      dispatch({ type: 'LOGIN_ERROR', payload: userMessage })
      return { 
        success: false, 
        error: userMessage, 
        details: apiError.details,
        code: apiError.code,
        status: apiError.status,
        type: apiError.type
      }
    }
  }

  const verifyEmail = async (token, email) => {
    try {
      const response = await api.auth.verifyEmail(token, email)
      const verifyData = handleApiResponse(response)
      
      return { success: true, data: verifyData }
    } catch (error) {
      const apiError = handleApiError(error)
      const userMessage = getErrorMessage(apiError, '/auth/verify-email')
      return { 
        success: false, 
        error: userMessage,
        code: apiError.code,
        status: apiError.status,
        type: apiError.type
      }
    }
  }

  const forgotPassword = async (email) => {
    try {
      const response = await api.auth.forgotPassword(email)
      handleApiResponse(response)
      
      return { success: true }
    } catch (error) {
      const apiError = handleApiError(error)
      const userMessage = getErrorMessage(apiError, '/auth/forgot-password')
      return { 
        success: false, 
        error: userMessage,
        code: apiError.code,
        status: apiError.status,
        type: apiError.type
      }
    }
  }

  const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
      const response = await api.auth.resetPassword(token, newPassword, confirmPassword)
      handleApiResponse(response)
      
      return { success: true }
    } catch (error) {
      const apiError = handleApiError(error)
      const userMessage = getErrorMessage(apiError, '/auth/reset-password')
      return { 
        success: false, 
        error: userMessage, 
        details: apiError.details,
        code: apiError.code,
        status: apiError.status,
        type: apiError.type
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
      // Always clear local storage and state
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const updateSubscription = (subscriptionData) => {
    dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: subscriptionData })
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
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    updateSubscription
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