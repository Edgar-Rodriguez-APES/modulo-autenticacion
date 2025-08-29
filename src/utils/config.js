/**
 * Environment configuration utility
 * Centralizes all environment variable access and provides validation
 */

// Environment variables with fallbacks
export const config = {
  // API Configuration
  auth: {
    baseURL: import.meta.env.VITE_AUTH_BASE_URL || 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth',
    timeout: 15000
  },
  
  tenant: {
    baseURL: import.meta.env.VITE_TENANT_BASE_URL || 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/tenant',
    timeout: 15000
  },

  // Environment
  app: {
    env: import.meta.env.VITE_APP_ENV || 'development',
    devMode: import.meta.env.VITE_DEV_MODE === 'true',
    debugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true'
  },

  // Security
  security: {
    httpsOnly: import.meta.env.VITE_ENABLE_HTTPS_ONLY === 'true',
    csrfProtection: import.meta.env.VITE_ENABLE_CSRF_PROTECTION === 'true',
    tokenStorageType: import.meta.env.VITE_TOKEN_STORAGE_TYPE || 'localStorage'
  },

  // Payment
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  },

  // Development
  dev: {
    mockApiResponses: import.meta.env.VITE_MOCK_API_RESPONSES === 'true'
  }
}

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const errors = []

  // Required variables
  const required = [
    { key: 'VITE_AUTH_BASE_URL', value: config.auth.baseURL },
    { key: 'VITE_TENANT_BASE_URL', value: config.tenant.baseURL }
  ]

  required.forEach(({ key, value }) => {
    if (!value || value.includes('undefined')) {
      errors.push(`Missing required environment variable: ${key}`)
    }
  })

  // URL validation
  try {
    new URL(config.auth.baseURL)
  } catch {
    errors.push('Invalid VITE_AUTH_BASE_URL format')
  }

  try {
    new URL(config.tenant.baseURL)
  } catch {
    errors.push('Invalid VITE_TENANT_BASE_URL format')
  }

  // HTTPS validation for production
  if (config.app.env === 'production') {
    if (!config.auth.baseURL.startsWith('https://')) {
      errors.push('VITE_AUTH_BASE_URL must use HTTPS in production')
    }
    if (!config.tenant.baseURL.startsWith('https://')) {
      errors.push('VITE_TENANT_BASE_URL must use HTTPS in production')
    }
  }

  return errors
}

/**
 * Get environment-specific configuration
 */
export const getEnvironmentConfig = () => {
  const env = config.app.env
  
  return {
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    
    // API endpoints based on environment
    apiEndpoints: {
      auth: config.auth.baseURL,
      tenant: config.tenant.baseURL
    },
    
    // Security settings based on environment
    security: {
      httpsOnly: config.security.httpsOnly,
      csrfProtection: config.security.csrfProtection,
      tokenStorage: config.security.tokenStorageType
    },
    
    // Debug settings
    debug: {
      enabled: config.app.debugLogs && env !== 'production',
      mockApi: config.dev.mockApiResponses && env === 'development'
    }
  }
}

/**
 * Log configuration status (for debugging)
 */
export const logConfigStatus = () => {
  if (!config.app.debugLogs) return

  console.group('🔧 Environment Configuration')
  console.log('Environment:', config.app.env)
  console.log('Dev Mode:', config.app.devMode)
  console.log('Auth URL:', config.auth.baseURL)
  console.log('Tenant URL:', config.tenant.baseURL)
  console.log('HTTPS Only:', config.security.httpsOnly)
  console.log('CSRF Protection:', config.security.csrfProtection)
  
  const errors = validateConfig()
  if (errors.length > 0) {
    console.error('Configuration Errors:', errors)
  } else {
    console.log('✅ Configuration is valid')
  }
  console.groupEnd()
}

/**
 * Initialize configuration validation
 */
export const initializeConfig = () => {
  const errors = validateConfig()
  
  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    
    if (config.app.env === 'production') {
      throw new Error('Invalid configuration in production environment')
    }
  }
  
  // Log configuration in development
  if (config.app.env === 'development') {
    logConfigStatus()
  }
  
  return config
}

// Auto-initialize on import
initializeConfig()

export default config