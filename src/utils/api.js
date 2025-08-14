import axios from 'axios'

// Get the current origin for CORS headers
const getCurrentOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://main.d3ihcnp00feclic.amplifyapp.com' // fallback to production URL
}

// Create axios instances for different services
const authClient = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BASE_URL || 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

const tenantClient = axios.create({
  baseURL: import.meta.env.VITE_TENANT_BASE_URL || 'https://f8u12wibf9.execute-api.us-east-1.amazonaws.com/dev/tenant',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add request interceptor to ensure correct origin
const addOriginInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      // Only set origin in production to avoid localhost issues
      if (import.meta.env.PROD) {
        config.headers['Origin'] = getCurrentOrigin()
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}

// Apply origin interceptor to both clients
addOriginInterceptor(authClient)
addOriginInterceptor(tenantClient)

// Request interceptor to add auth token for tenant client
tenantClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling and token refresh
const createResponseInterceptor = (client) => {
  return client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const response = await authClient.post('/refresh', {
              refresh_token: refreshToken
            })

            const { access_token, refresh_token: newRefreshToken } = response.data.data
            localStorage.setItem('accessToken', access_token)
            localStorage.setItem('refreshToken', newRefreshToken)

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            return client(originalRequest)
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }
        } else {
          // No refresh token, redirect to login
          localStorage.removeItem('accessToken')
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )
}

// Apply interceptors to both clients
createResponseInterceptor(authClient)
createResponseInterceptor(tenantClient)

// API methods matching the documented endpoints
export const api = {
  // Authentication endpoints
  auth: {
    register: (userData) => {
      // First register tenant, then user
      return tenantClient.post('/register', {
        company_name: userData.companyName,
        industry: userData.industry || 'technology',
        company_size: userData.companySize || 'small',
        country: userData.country || 'Colombia'
      }).then(tenantResponse => {
        // Then register user with tenant_id
        return authClient.post('/register', {
          tenant_id: tenantResponse.data.data.tenant.tenant_id,
          email: userData.email,
          password: userData.password,
          name: `${userData.firstName} ${userData.lastName}`,
          role: 'MASTER'
        })
      })
    },
    login: (credentials) => authClient.post('/login', {
      email: credentials.email,
      password: credentials.password
    }),
    logout: () => authClient.post('/logout'),
    refresh: (refreshToken) => authClient.post('/refresh', {
      refresh_token: refreshToken
    }),
    verifyEmail: (verificationToken) => authClient.post('/verify-email', {
      verification_token: verificationToken
    }),
    forgotPassword: (email) => authClient.post('/forgot-password', {
      email
    }),
    resetPassword: (token, newPassword) => authClient.post('/reset-password', {
      token,
      new_password: newPassword
    })
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

// Helper function to handle API errors consistently with ALL possible responses
export const handleApiError = (error) => {
  // Network or connection errors
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Verifica tu internet.',
      details: null,
      status: 0,
      type: 'network'
    }
  }

  const status = error.response.status
  const errorData = error.response.data

  // API returned structured error
  if (errorData?.error) {
    const apiError = errorData.error
    return {
      code: apiError.code,
      message: apiError.message,
      details: apiError.details || null,
      status: status,
      type: 'api'
    }
  }

  // Handle specific HTTP status codes according to API documentation
  switch (status) {
    case 400:
      return {
        code: 'BAD_REQUEST',
        message: 'Datos inválidos o malformados',
        details: errorData?.details || null,
        status: 400,
        type: 'validation'
      }

    case 401:
      return {
        code: 'UNAUTHORIZED',
        message: 'Token inválido o credenciales incorrectas',
        details: null,
        status: 401,
        type: 'auth'
      }

    case 403:
      return {
        code: 'FORBIDDEN',
        message: 'Sin permisos para realizar esta operación',
        details: null,
        status: 403,
        type: 'permission'
      }

    case 404:
      return {
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado',
        details: null,
        status: 404,
        type: 'not_found'
      }

    case 409:
      return {
        code: 'CONFLICT',
        message: 'Conflicto con el estado actual (ej: email duplicado)',
        details: null,
        status: 409,
        type: 'conflict'
      }

    case 422:
      return {
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Datos válidos pero lógicamente incorrectos',
        details: errorData?.details || null,
        status: 422,
        type: 'validation'
      }

    case 429:
      return {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes. Intenta más tarde.',
        details: null,
        status: 429,
        type: 'rate_limit'
      }

    case 500:
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
        details: null,
        status: 500,
        type: 'server'
      }

    case 502:
      return {
        code: 'BAD_GATEWAY',
        message: 'Error de servicio externo (Stripe, AWS)',
        details: null,
        status: 502,
        type: 'gateway'
      }

    case 503:
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Servicio temporalmente no disponible',
        details: null,
        status: 503,
        type: 'service'
      }

    default:
      return {
        code: 'UNKNOWN_ERROR',
        message: `Error HTTP ${status}: ${error.message || 'Error desconocido'}`,
        details: null,
        status: status,
        type: 'unknown'
      }
  }
}

// Helper to get user-friendly error messages based on endpoint and error
export const getErrorMessage = (error, endpoint = '') => {
  const { code, status, type } = error

  // Specific error messages for auth endpoints
  if (endpoint.includes('/auth/')) {
    switch (code) {
      case 'VALIDATION_ERROR':
        return 'Por favor verifica los datos ingresados'
      case 'AUTHENTICATION_ERROR':
        return 'Email o contraseña incorrectos'
      case 'TOKEN_INVALID':
        return 'Sesión expirada. Inicia sesión nuevamente'
      case 'VERIFICATION_ERROR':
        return 'Código de verificación inválido o expirado'
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

  // Specific error messages for payment endpoints
  if (endpoint.includes('/payment/')) {
    switch (code) {
      case 'SUBSCRIPTION_ERROR':
        return 'Error al procesar la suscripción'
      case 'PLAN_NOT_FOUND':
        return 'Plan de suscripción no encontrado'
      case 'CANCELLATION_ERROR':
        return 'No se puede cancelar la suscripción'
      default:
        break
    }
  }

  // Generic messages based on HTTP status
  switch (status) {
    case 429:
      return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente'
    case 500:
      return 'Error del servidor. Nuestro equipo ha sido notificado'
    case 502:
    case 503:
      return 'Servicio temporalmente no disponible. Intenta más tarde'
    default:
      return error.message || 'Ha ocurrido un error inesperado'
  }
}

export default { authClient, tenantClient }