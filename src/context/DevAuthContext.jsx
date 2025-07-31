import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Mock user data for development
const mockUser = {
  user_id: 'dev-user-123',
  tenant_id: 'dev-tenant-123',
  email: 'developer@test.com',
  name: 'Developer User',
  role: 'MASTER',
  status: 'active'
}

const mockTenant = {
  tenant_id: 'dev-tenant-123',
  name: 'Development Tenant',
  status: 'active'
}

const mockSubscription = {
  plan_id: 'dev-plan',
  plan_name: 'Development Plan',
  status: 'active'
}

const mockPermissions = [
  'manage_users',
  'manage_subscription', 
  'view_billing',
  'access_agents',
  'manage_payment_methods',
  'manage_tenant_settings'
]

export const DevAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Always authenticated in dev
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Simulate loading on mount
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      console.log('🔧 Development Auth: User automatically logged in')
    }, 1000)
  }, [])

  const login = async (credentials) => {
    setLoading(true)
    setError(null)
    
    // Simulate API call
    setTimeout(() => {
      setIsAuthenticated(true)
      setLoading(false)
      console.log('🔧 Development Auth: Login successful')
    }, 1000)
    
    return { success: true }
  }

  const register = async (userData) => {
    setLoading(true)
    setError(null)
    
    // Simulate API call
    setTimeout(() => {
      setIsAuthenticated(true)
      setLoading(false)
      console.log('🔧 Development Auth: Registration successful')
    }, 1000)
    
    return { success: true }
  }

  const logout = async () => {
    setIsAuthenticated(false)
    console.log('🔧 Development Auth: Logout successful')
  }

  const verifyEmail = async (token, email) => {
    return { success: true }
  }

  const forgotPassword = async (email) => {
    return { success: true }
  }

  const resetPassword = async (token, password) => {
    return { success: true }
  }

  const value = {
    // State
    user: isAuthenticated ? mockUser : null,
    tenant: isAuthenticated ? mockTenant : null,
    subscription: isAuthenticated ? mockSubscription : null,
    permissions: isAuthenticated ? mockPermissions : [],
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    
    // Helpers
    hasPermission: (permission) => mockPermissions.includes(permission),
    isMaster: () => mockUser.role === 'MASTER',
    isAdmin: () => ['MASTER', 'ADMIN'].includes(mockUser.role)
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
    throw new Error('useAuth must be used within a DevAuthProvider')
  }
  return context
}

export default AuthContext