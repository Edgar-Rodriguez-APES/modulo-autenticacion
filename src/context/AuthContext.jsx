import React, { createContext, useContext, useReducer, useEffect } from 'react'

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
        permissions: action.payload.permissions,
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
        // TODO: Validate token with backend
        // For now, just set loading to false
        dispatch({ type: 'SET_LOADING', payload: false })
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
      // TODO: Replace with actual API call
      const mockResponse = {
        user: { id: 1, email: credentials.email, name: 'Usuario Demo' },
        tenant: { id: 1, name: 'Empresa Demo' },
        subscription: { plan: 'pro', status: 'active' },
        permissions: ['access_agents', 'manage_users'],
        token: 'mock-jwt-token'
      }
      
      localStorage.setItem('accessToken', mockResponse.token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockResponse })
      return { success: true }
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message })
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const updateSubscription = (subscriptionData) => {
    dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: subscriptionData })
  }

  const value = {
    ...state,
    login,
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