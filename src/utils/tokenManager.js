/**
 * Token Management Utility for Auth Service Integration
 * Handles secure token storage, validation, and automatic refresh
 */

import { tokenStorage } from './security'
import { config } from './config'

class TokenManager {
  constructor() {
    this.refreshPromise = null
    this.refreshThreshold = 5 * 60 // 5 minutes in seconds
  }

  /**
   * Store tokens securely using configured storage method
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   */
  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      tokenStorage.set('accessToken', accessToken)
    }
    if (refreshToken) {
      tokenStorage.set('refreshToken', refreshToken)
    }
  }

  /**
   * Retrieve stored tokens
   * @returns {Object} Object containing accessToken and refreshToken
   */
  getTokens() {
    return {
      accessToken: tokenStorage.get('accessToken'),
      refreshToken: tokenStorage.get('refreshToken')
    }
  }

  /**
   * Clear all stored tokens using secure storage
   */
  clearTokens() {
    tokenStorage.clear()
  }

  /**
   * Decode JWT token payload
   * @param {string} token - JWT token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    if (!token) return null

    try {
      const base64Url = token.split('.')[1]
      if (!base64Url) return null

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token is expired
   */
  isTokenExpired(token) {
    const payload = this.decodeToken(token)
    if (!payload || !payload.exp) return true

    const now = Math.floor(Date.now() / 1000)
    return payload.exp <= now
  }

  /**
   * Get token expiry timestamp
   * @param {string} token - JWT token
   * @returns {number|null} Expiry timestamp or null if invalid
   */
  getTokenExpiry(token) {
    const payload = this.decodeToken(token)
    return payload?.exp || null
  }

  /**
   * Check if token will expire soon (within refresh threshold)
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token expires soon
   */
  isTokenExpiringSoon(token) {
    const payload = this.decodeToken(token)
    if (!payload || !payload.exp) return true

    const now = Math.floor(Date.now() / 1000)
    return (payload.exp - now) <= this.refreshThreshold
  }

  /**
   * Check if token needs refresh (expired or expiring soon)
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token needs refresh
   */
  needsRefresh(token) {
    return this.isTokenExpired(token) || this.isTokenExpiringSoon(token)
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary
   * @returns {Promise<string|null>} Valid access token or null if refresh failed
   */
  async ensureValidToken() {
    const { accessToken, refreshToken } = this.getTokens()

    if (!accessToken) return null

    // Check if token is expired or will expire soon
    if (!this.isTokenExpired(accessToken) && !this.isTokenExpiringSoon(accessToken)) {
      return accessToken // Token is still valid
    }

    // Token needs refresh
    if (!refreshToken) {
      this.clearTokens()
      return null
    }

    // Prevent multiple simultaneous refresh requests
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken(refreshToken)
    }

    try {
      const refreshed = await this.refreshPromise
      this.refreshPromise = null
      
      if (refreshed) {
        const { accessToken: newAccessToken } = this.getTokens()
        return newAccessToken
      } else {
        this.clearTokens()
        return null
      }
    } catch (error) {
      this.refreshPromise = null
      this.clearTokens()
      return null
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<boolean>} True if refresh successful
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Import api here to avoid circular dependency
      const { api } = await import('./api.js')
      
      const response = await api.auth.refresh(refreshToken)
      
      if (response.data.success) {
        const { access_token, refresh_token } = response.data.data
        this.setTokens(access_token, refresh_token || refreshToken)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  /**
   * Schedule automatic token refresh
   * @param {string} accessToken - Current access token
   */
  scheduleTokenRefresh(accessToken) {
    const payload = this.decodeToken(accessToken)
    if (!payload || !payload.exp) return

    const now = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - now
    const refreshIn = Math.max(0, (expiresIn - this.refreshThreshold) * 1000)

    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }

    // Schedule refresh
    this.refreshTimeout = setTimeout(async () => {
      await this.ensureValidToken()
    }, refreshIn)
  }

  /**
   * Validate token format and structure
   * @param {string} token - Token to validate
   * @returns {boolean} True if token format is valid
   */
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false
    
    const parts = token.split('.')
    return parts.length === 3 && parts.every(part => part.length > 0)
  }

  /**
   * Get user information from access token
   * @param {string} accessToken - Access token
   * @returns {Object|null} User information or null
   */
  getUserFromToken(accessToken) {
    const payload = this.decodeToken(accessToken)
    if (!payload) return null

    return {
      user_id: payload.user_id,
      tenant_id: payload.tenant_id,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat
    }
  }

  /**
   * Check if user has required role
   * @param {string} accessToken - Access token
   * @param {string} requiredRole - Required role (MASTER, ADMIN, MEMBER)
   * @returns {boolean} True if user has required role or higher
   */
  hasRole(accessToken, requiredRole) {
    const user = this.getUserFromToken(accessToken)
    if (!user || !user.role) return false

    const roleHierarchy = {
      'MEMBER': 1,
      'ADMIN': 2,
      'MASTER': 3
    }

    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }

  /**
   * Store user and tenant data
   * @param {Object} user - User data from login response
   * @param {Object} tenant - Tenant data from login response
   */
  setUserData(user, tenant) {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
    if (tenant) {
      localStorage.setItem('tenant', JSON.stringify(tenant))
    }
  }

  /**
   * Get stored user data
   * @returns {Object|null} User data or null
   */
  getUserData() {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  /**
   * Get stored tenant data
   * @returns {Object|null} Tenant data or null
   */
  getTenantData() {
    try {
      const tenantData = localStorage.getItem('tenant')
      return tenantData ? JSON.parse(tenantData) : null
    } catch (error) {
      console.error('Error parsing tenant data:', error)
      return null
    }
  }

  /**
   * Clear refresh timeout
   */
  clearRefreshTimeout() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }

  /**
   * Cleanup method to clear timeouts and promises
   */
  cleanup() {
    this.clearRefreshTimeout()
    this.refreshPromise = null
  }
}

// Create singleton instance
const tokenManager = new TokenManager()

export default tokenManager
export { TokenManager }