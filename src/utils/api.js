import axios from 'axios'
import { config, getEnvironmentConfig } from './config'
import { csrfMiddleware } from './csrfProtection'
import { sanitizeAuthFormData } from './inputSanitization'

// Get environment configuration
const envConfig = getEnvironmentConfig()

// Get the current origin for CORS headers
const getCurrentOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://main.d3lhcnp00fedic.amplifyapp.com' // fallback to production URL
}

// Create axios instances for different services
const authClient = axios.create({
  baseURL: config.auth.baseURL,
  timeout: config.auth.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(envConfig.security.httpsOnly && { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' })
  }
})

const tenantClient = axios.create({
  baseURL: config.tenant.baseURL,
  timeout: config.tenant.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(envConfig.security.httpsOnly && { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' })
  }
})

// Add security interceptors
const addSecurityInterceptors = (client) => {
  // Request interceptor for security headers and CSRF protection
  client.interceptors.request.use(
    (config) => {
      // Add origin header in production
      if (import.meta.env.PROD) {
        config.headers['Origin'] = getCurrentOrigin()
      }

      // Add CSRF protection
      try {
        config = csrfMiddleware.addHeaders(config)
      } catch (error) {
        return Promise.reject(error)
      }

      // Sanitize request data for auth endpoints
      if (config.data && typeof config.data === 'object') {
        config.data = sanitizeAuthFormData(config.data)
      }

      // Add security headers
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
      
      // Add referrer policy
      if (envConfig.security.httpsOnly) {
        config.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for security validation
  client.interceptors.response.use(
    (response) => {
      // Validate response headers in production
      if (envConfig.isProduction) {
        const securityHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection'
        ]

        securityHeaders.forEach(header => {
          if (!response.headers[header]) {
            console.warn(`Missing security header: ${header}`)
          }
        })
      }

      return response
    },
    (error) => {
      // Handle CSRF errors
      try {
        csrfMiddleware.handleError(error)
      } catch (csrfError) {
        return Promise.reject(csrfError)
      }

      return Promise.reject(error)
    }
  )
}

// Apply origin interceptor to both clients
addSecurityInterceptors(authClient)
addSecurityInterceptors(tenantClient)

// Request interceptor to add auth token for protected endpoints
const addAuthTokenInterceptor = (client) => {
  client.interceptors.request.use(
    async (config) => {
      // List of endpoints that require authentication
      const protectedEndpoints = ['/logout', '/validate-token', '/refresh-token/revoke']
      const requiresAuth = protectedEndpoints.some(endpoint => config.url?.includes(endpoint))
      
      if (requiresAuth) {
        try {
          // Import token refresh manager dynamically to avoid circular dependency
          const { default: tokenRefreshManager } = await import('./tokenRefreshManager.js')
          
          // Ensure we have a valid token before making the request
          const validToken = await tokenRefreshManager.ensureValidToken()
          
          if (validToken) {
            config.headers.Authorization = `Bearer ${validToken}`
          }
        } catch (error) {
          console.warn('Failed to ensure valid token for request:', error)
          // Fallback to stored token if refresh fails
          const token = localStorage.getItem('accessToken')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

// Request interceptor to add auth token for all tenant client requests
tenantClient.interceptors.request.use(
  async (config) => {
    try {
      // Import token refresh manager dynamically to avoid circular dependency
      const { default: tokenRefreshManager } = await import('./tokenRefreshManager.js')
      
      // Ensure we have a valid token before making the request
      const validToken = await tokenRefreshManager.ensureValidToken()
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`
      }
    } catch (error) {
      console.warn('Failed to ensure valid token for request:', error)
      // Fallback to stored token if refresh fails
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Apply auth token interceptor to auth client for protected endpoints
addAuthTokenInterceptor(authClient)

// Response interceptor for error handling and token refresh
const createResponseInterceptor = (client) => {
  return client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // Handle token expiration with enhanced refresh system
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          // Import token refresh manager dynamically to avoid circular dependency
          const { default: tokenRefreshManager } = await import('./tokenRefreshManager.js')
          
          // If token is currently being refreshed, queue this request
          if (tokenRefreshManager.getStatus().isRefreshing) {
            return await tokenRefreshManager.queueRequest((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return client(originalRequest)
            })
          }
          
          // Otherwise, attempt to refresh the token
          const newAccessToken = await tokenRefreshManager.refreshToken()
          if (newAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            return client(originalRequest)
          } else {
            throw new Error('Token refresh failed')
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          const tokenManager = await import('./tokenManager.js')
          tokenManager.default.clearTokens()
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    }
  )
}

// Apply interceptors to both clients
createResponseInterceptor(authClient)
createResponseInterceptor(tenantClient)

// API methods matching the Auth Service documentation
export const api = {
  // Authentication endpoints
  auth: {
    // Health check endpoint
    health: () => authClient.get('/health'),
    
    // User registration - Auth Service handles both tenant and user creation
    register: (userData) => authClient.post('/register', {
      tenant_id: userData.tenant_id,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || 'MASTER'
    }),
    
    // User login
    login: (credentials) => authClient.post('/login', {
      email: credentials.email,
      password: credentials.password
    }),
    
    // User logout with optional refresh token
    logout: (refreshToken = null) => {
      const token = localStorage.getItem('accessToken')
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      const body = refreshToken ? { refresh_token: refreshToken } : {}
      return authClient.post('/logout', body, config)
    },
    
    // Token refresh
    refresh: (refreshToken) => authClient.post('/refresh', {
      refresh_token: refreshToken
    }),
    
    // Email verification
    verifyEmail: (verificationToken) => authClient.post('/verify-email', {
      verification_token: verificationToken
    }),
    
    // Resend verification email
    resendVerification: (email) => authClient.post('/resend-verification', {
      email
    }),
    
    // Forgot password
    forgotPassword: (email) => authClient.post('/forgot-password', {
      email
    }),
    
    // Reset password
    resetPassword: (token, newPassword) => authClient.post('/reset-password', {
      token,
      new_password: newPassword
    }),
    
    // Token validation
    validateToken: (token) => authClient.post('/validate-token', {
      token
    }),
    
    // Activate registration
    activateRegistration: (tenantId, subscriptionId) => authClient.post('/activate-registration', {
      tenant_id: tenantId,
      subscription_id: subscriptionId
    }),
    
    // Revoke refresh token
    revokeRefreshToken: (refreshToken) => {
      const token = localStorage.getItem('accessToken')
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      return authClient.post('/refresh-token/revoke', {
        refresh_token: refreshToken
      }, config)
    }
  },

  // Tenant management endpoints
  tenant: {
    getProfile: () => tenantClient.get('/profile'),
    updateSettings: (settings) => tenantClient.put('/settings', settings),
    inviteUser: (email, firstName, lastName, role) => tenantClient.post('/invite', {
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      send_email: true
    }),
    acceptInvitation: (token, password, firstName, lastName) => tenantClient.post('/invitation/accept', {
      invitation_token: token,
      password,
      first_name: firstName,
      last_name: lastName
    }),
    getUsers: (params = {}) => {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.page_size) queryParams.append('page_size', params.page_size)
      if (params.role) queryParams.append('role', params.role)
      if (params.status) queryParams.append('status', params.status)

      const queryString = queryParams.toString()
      return tenantClient.get(`/users${queryString ? `?${queryString}` : ''}`)
    },
    getUsageStats: (params = {}) => {
      const queryParams = new URLSearchParams()
      if (params.period) queryParams.append('period', params.period)
      if (params.include_details) queryParams.append('include_details', params.include_details)
      if (params.metric_type) queryParams.append('metric_type', params.metric_type)

      const queryString = queryParams.toString()
      return tenantClient.get(`/usage${queryString ? `?${queryString}` : ''}`)
    }
  }
}

// Helper function to handle API responses consistently
export const handleApiResponse = (response) => {
  if (response.data.success) {
    return response.data.data
  } else {
    throw new Error(response.data.error?.message || 'API Error')
  }
}

// Enhanced error handling for Auth Service API responses
export const handleApiError = (error) => {
  // Network or connection errors
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifica tu internet.',
      details: null,
      status: 0,
      type: 'network',
      retryable: true
    }
  }

  const status = error.response.status
  const errorData = error.response.data

  // Auth Service structured error response
  if (errorData?.error) {
    const apiError = errorData.error
    return {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details || null,
      status: status,
      type: 'api',
      retryable: ['RATE_LIMIT_EXCEEDED', 'INTERNAL_ERROR', 'SERVICE_UNAVAILABLE'].includes(apiError.code)
    }
  }

  // Handle specific HTTP status codes according to Auth Service documentation
  switch (status) {
    case 400:
      return {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos o malformados',
        details: errorData?.details || null,
        status: 400,
        type: 'validation',
        retryable: false
      }

    case 401:
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales inválidas o token expirado',
        details: null,
        status: 401,
        type: 'auth',
        retryable: false
      }

    case 403:
      return {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email no verificado. Por favor verifica tu email antes de continuar.',
        details: null,
        status: 403,
        type: 'permission',
        retryable: false
      }

    case 404:
      return {
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado',
        details: null,
        status: 404,
        type: 'not_found',
        retryable: false
      }

    case 409:
      return {
        code: 'RESOURCE_CONFLICT',
        message: 'El email ya está registrado',
        details: null,
        status: 409,
        type: 'conflict',
        retryable: false
      }

    case 422:
      return {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Datos válidos pero lógicamente incorrectos',
        details: errorData?.details || null,
        status: 422,
        type: 'validation',
        retryable: false
      }

    case 423:
      return {
        code: 'ACCOUNT_LOCKED',
        message: 'Cuenta bloqueada debido a múltiples intentos fallidos. Intenta más tarde.',
        details: null,
        status: 423,
        type: 'locked',
        retryable: true
      }

    case 429:
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        details: null,
        status: 429,
        type: 'rate_limit',
        retryable: true
      }

    case 500:
      return {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        details: null,
        status: 500,
        type: 'server',
        retryable: true
      }

    case 502:
      return {
        code: 'BAD_GATEWAY',
        message: 'Error de servicio externo',
        details: null,
        status: 502,
        type: 'gateway',
        retryable: true
      }

    case 503:
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Servicio temporalmente no disponible',
        details: null,
        status: 503,
        type: 'service',
        retryable: true
      }

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: `Error HTTP ${status}: ${error.message || 'Error desconocido'}`,
        details: null,
        status: status,
        type: 'unknown',
        retryable: false
      }
  }
}

// Enhanced error message mapping for Auth Service
export const getErrorMessage = (error, endpoint = '') => {
  const { code, status, type } = error

  // Auth Service specific error messages
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Por favor verifica los datos ingresados'
    case 'INVALID_CREDENTIALS':
      return 'Email o contraseña incorrectos'
    case 'AUTHENTICATION_ERROR':
      return 'Token inválido o sesión expirada'
    case 'AUTHORIZATION_REQUIRED':
      return 'Se requiere autenticación para acceder a este recurso'
    case 'TOKEN_EXPIRED':
      return 'Sesión expirada. Por favor inicia sesión nuevamente'
    case 'ACCOUNT_LOCKED':
      return 'Cuenta bloqueada temporalmente. Intenta más tarde'
    case 'EMAIL_NOT_VERIFIED':
      return 'Por favor verifica tu email antes de continuar'
    case 'RESOURCE_CONFLICT':
      return 'El email ya está registrado'
    case 'RATE_LIMIT_EXCEEDED':
      return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente'
    case 'INTERNAL_ERROR':
      return 'Error del servidor. Nuestro equipo ha sido notificado'
    case 'NETWORK_ERROR':
      return 'Error de conexión. Verifica tu internet'
    case 'SERVICE_UNAVAILABLE':
      return 'Servicio temporalmente no disponible. Intenta más tarde'
    case 'BAD_GATEWAY':
      return 'Error de servicio externo. Intenta más tarde'
    default:
      break
  }

  // Specific error messages for auth endpoints
  if (endpoint.includes('/auth/')) {
    switch (code) {
      case 'VERIFICATION_ERROR':
        return 'Código de verificación inválido o expirado'
      case 'TOKEN_INVALID':
        return 'Token de verificación inválido'
      default:
        break
    }
  }

  // Specific error messages for tenant endpoints
  if (endpoint.includes('/tenant/')) {
    switch (code) {
      case 'AUTHORIZATION_ERROR':
        return 'No tienes permisos para realizar esta acción'
      case 'INVITATION_ERROR':
        return 'Invitación inválida o expirada'
      default:
        break
    }
  }

  // Generic messages based on HTTP status
  switch (status) {
    case 400:
      return 'Solicitud inválida. Verifica los datos ingresados'
    case 401:
      return 'Credenciales inválidas'
    case 403:
      return 'No tienes permisos para realizar esta acción'
    case 404:
      return 'Recurso no encontrado'
    case 409:
      return 'Conflicto con datos existentes'
    case 422:
      return 'Datos inválidos'
    case 429:
      return 'Demasiadas solicitudes. Espera un momento'
    case 500:
      return 'Error del servidor'
    case 502:
    case 503:
      return 'Servicio temporalmente no disponible'
    default:
      return error.message || 'Ha ocurrido un error inesperado'
  }
}

export default { authClient, tenantClient }