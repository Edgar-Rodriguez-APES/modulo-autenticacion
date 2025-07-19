import React, { createContext, useContext, useReducer } from 'react'

const AppContext = createContext()

const initialState = {
  language: 'es',
  theme: 'light',
  loading: false,
  error: null,
  notifications: []
}

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    default:
      return state
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setLanguage = (language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
    localStorage.setItem('language', language)
  }

  const setTheme = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
    localStorage.setItem('theme', theme)
  }

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const addNotification = (notification) => {
    const id = Date.now()
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { ...notification, id }
    })
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
    }, 5000)
  }

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }

  const value = {
    ...state,
    setLanguage,
    setTheme,
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}