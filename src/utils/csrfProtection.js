/**
 * CSRF Protection Utility
 * Implements Cross-Site Request Forgery protection for authentication operations
 */

import { config } from './config'

class CSRFProtection {
  constructor() {
    this.tokenKey = 'csrf_token'
    this.headerName = 'X-CSRF-Token'
    this.cookieName = 'csrf_token'
  }

  /**
   * Generate a secure CSRF token
   */
  generateToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Get or create CSRF token
   */
  getToken() {
    if (!config.security.csrfProtection) {
      return null
    }

    let token = sessionStorage.getItem(this.tokenKey)
    
    if (!token) {
      token = this.generateToken()
      sessionStorage.setItem(this.tokenKey, token)
      
      // Also set as httpOnly cookie if possible (for server validation)
      this.setCookie(token)
    }
    
    return token
  }

  /**
   * Set CSRF token as cookie
   */
  setCookie(token) {
    try {
      // Set cookie with security flags
      const cookieOptions = [
        `${this.cookieName}=${token}`,
        'Path=/',
        'SameSite=Strict'
      ]

      // Add Secure flag in production
      if (config.security.httpsOnly) {
        cookieOptions.push('Secure')
      }

      document.cookie = cookieOptions.join('; ')
    } catch (error) {
      console.warn('Failed to set CSRF cookie:', error)
    }
  }

  /**
   * Validate CSRF token
   */
  validateToken(token) {
    if (!config.security.csrfProtection) {
      return true
    }

    const storedToken = sessionStorage.getItem(this.tokenKey)
    return storedToken && storedToken === token
  }

  /**
   * Get CSRF headers for requests
   */
  getHeaders() {
    if (!config.security.csrfProtection) {
      return {}
    }

    const token = this.getToken()
    return token ? { [this.headerName]: token } : {}
  }

  /**
   * Validate request origin
   */
  validateOrigin(origin) {
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
   * Clear CSRF token
   */
  clearToken() {
    sessionStorage.removeItem(this.tokenKey)
    
    // Clear cookie
    try {
      document.cookie = `${this.cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`
    } catch (error) {
      console.warn('Failed to clear CSRF cookie:', error)
    }
  }

  /**
   * Refresh CSRF token
   */
  refreshToken() {
    this.clearToken()
    return this.getToken()
  }
}

// Create singleton instance
const csrfProtection = new CSRFProtection()

/**
 * CSRF middleware for API requests
 */
export const csrfMiddleware = {
  /**
   * Add CSRF headers to request config
   */
  addHeaders: (config) => {
    if (!config.headers) {
      config.headers = {}
    }

    // Add CSRF headers
    Object.assign(config.headers, csrfProtection.getHeaders())

    // Validate origin for state-changing operations
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const origin = typeof window !== 'undefined' ? window.location.origin : null
      if (origin && !csrfProtection.validateOrigin(origin)) {
        throw new Error('Invalid request origin')
      }
    }

    return config
  },

  /**
   * Handle CSRF errors
   */
  handleError: (error) => {
    if (error.response?.status === 403 && error.response?.data?.error?.code === 'CSRF_TOKEN_MISMATCH') {
      // Refresh CSRF token and retry
      csrfProtection.refreshToken()
      throw new Error('CSRF token mismatch. Please try again.')
    }
    throw error
  }
}

export { csrfProtection }
export default csrfProtection