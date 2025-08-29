/**
 * Security utilities and configuration
 */

import { config } from './config'

/**
 * Content Security Policy configuration
 */
export const getCSPDirectives = () => {
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': [
      "'self'",
      config.auth.baseURL,
      config.tenant.baseURL,
      "https://api.stripe.com"
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }

  // Convert to CSP string
  return Object.entries(baseDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Security headers configuration
 */
export const getSecurityHeaders = () => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }

  // Add HSTS in production with HTTPS
  if (config.security.httpsOnly && config.app.env === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  // Add CSP header
  headers['Content-Security-Policy'] = getCSPDirectives()

  return headers
}

/**
 * Validate request origin for CSRF protection
 */
export const validateOrigin = (origin) => {
  if (!config.security.csrfProtection) {
    return true
  }

  const allowedOrigins = [
    'http://localhost:3000',
    'https://main.d3lhcnp00fedic.amplifyapp.com'
  ]

  // Add current origin if available
  if (typeof window !== 'undefined') {
    allowedOrigins.push(window.location.origin)
  }

  return allowedOrigins.includes(origin)
}

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input
  }

  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const checks = {
    length: password.length >= minLength,
    upperCase: hasUpperCase,
    lowerCase: hasLowerCase,
    numbers: hasNumbers,
    specialChar: hasSpecialChar
  }

  const score = Object.values(checks).filter(Boolean).length
  
  return {
    isValid: score >= 4, // Require at least 4 out of 5 criteria
    score,
    checks,
    strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong'
  }
}

/**
 * Generate CSRF token
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Secure token storage (legacy interface - use secureTokenStorage for new code)
 */
export const tokenStorage = {
  set: async (key, value) => {
    try {
      // Use secure storage if available
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const { secureTokenStorage } = await import('./secureStorage')
        await secureTokenStorage.setItem(key, value)
      } else {
        // Fallback to regular storage
        if (config.security.tokenStorageType === 'sessionStorage') {
          sessionStorage.setItem(key, value)
        } else {
          localStorage.setItem(key, value)
        }
      }
    } catch (error) {
      console.error('Failed to store token:', error)
    }
  },

  get: async (key) => {
    try {
      // Use secure storage if available
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const { secureTokenStorage } = await import('./secureStorage')
        return await secureTokenStorage.getItem(key)
      } else {
        // Fallback to regular storage
        if (config.security.tokenStorageType === 'sessionStorage') {
          return sessionStorage.getItem(key)
        } else {
          return localStorage.getItem(key)
        }
      }
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      return null
    }
  },

  remove: (key) => {
    try {
      if (config.security.tokenStorageType === 'sessionStorage') {
        sessionStorage.removeItem(key)
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  },

  clear: async () => {
    try {
      // Use secure storage if available
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const { secureTokenStorage } = await import('./secureStorage')
        await secureTokenStorage.clear()
      } else {
        // Fallback to regular storage
        if (config.security.tokenStorageType === 'sessionStorage') {
          sessionStorage.clear()
        } else {
          // Only clear auth-related items from localStorage
          const authKeys = ['accessToken', 'refreshToken', 'user', 'tenant']
          authKeys.forEach(key => localStorage.removeItem(key))
        }
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }
}

/**
 * Initialize security measures
 */
export const initializeSecurity = async () => {
  // Initialize security headers
  const { initializeSecurityHeaders } = await import('./securityHeaders')
  initializeSecurityHeaders()

  // Initialize CSRF protection
  const { csrfProtection } = await import('./csrfProtection')
  csrfProtection.getToken() // Initialize token

  // Perform security audit in development
  if (config.app.debugLogs) {
    const { quickSecurityCheck } = await import('./securityAudit')
    const securityCheck = quickSecurityCheck()
    
    console.group('🔒 Security Configuration')
    console.log('HTTPS Only:', config.security.httpsOnly)
    console.log('CSRF Protection:', config.security.csrfProtection)
    console.log('Token Storage:', config.security.tokenStorageType)
    console.log('Security Check:', securityCheck.secure ? '✅ Passed' : '❌ Issues found')
    
    if (!securityCheck.secure) {
      console.warn('Security Issues:', securityCheck.issues)
    }
    
    console.groupEnd()
  }

  // Run full security audit in development
  if (config.app.env === 'development' && config.app.debugLogs) {
    setTimeout(async () => {
      const { performSecurityAudit } = await import('./securityAudit')
      await performSecurityAudit()
    }, 1000)
  }
}

export default {
  getCSPDirectives,
  getSecurityHeaders,
  validateOrigin,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateCSRFToken,
  tokenStorage,
  initializeSecurity
}