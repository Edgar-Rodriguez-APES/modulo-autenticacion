/**
 * Enhanced Token Refresh Manager
 * Handles automatic token refresh with request queuing and retry logic
 */

import tokenManager from './tokenManager.js'
import { api } from './api.js'

class TokenRefreshManager {
  constructor() {
    this.isRefreshing = false
    this.refreshPromise = null
    this.requestQueue = []
    this.refreshTimer = null
    this.retryCount = 0
    this.maxRetries = 3
    this.refreshBuffer = 5 * 60 * 1000 // 5 minutes in milliseconds
    
    // Callbacks
    this.onRefreshSuccess = null
    this.onRefreshFailure = null
    this.onTokenExpired = null
    
    // Track last refresh attempt to prevent excessive refreshing
    this.lastRefreshAttempt = 0
    this.minRefreshInterval = 30 * 1000 // 30 seconds minimum between refresh attempts
  }

  /**
   * Initialize the token refresh manager
   */
  initialize() {
    this.scheduleNextRefresh()
    
    // Listen for visibility changes to refresh tokens when app becomes active
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
    }
  }

  /**
   * Handle visibility change events
   */
  handleVisibilityChange() {
    if (!document.hidden) {
      // App became visible, check if token needs refresh
      this.checkAndRefreshToken()
    }
  }

  /**
   * Handle online events
   */
  handleOnline() {
    // Device came back online, check if token needs refresh
    this.checkAndRefreshToken()
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  async checkAndRefreshToken() {
    const { accessToken } = tokenManager.getTokens()
    
    if (!accessToken) {
      return false
    }
    
    if (tokenManager.needsRefresh(accessToken)) {
      return await this.refreshToken()
    }
    
    return true
  }

  /**
   * Schedule the next automatic token refresh
   */
  scheduleNextRefresh() {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    const { accessToken } = tokenManager.getTokens()
    if (!accessToken) {
      return
    }
    
    const expiry = tokenManager.getTokenExpiry(accessToken)
    if (!expiry) {
      return
    }
    
    const now = Date.now()
    const timeUntilRefresh = expiry - now - this.refreshBuffer
    
    // Only schedule if refresh time is in the future
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken()
      }, timeUntilRefresh)
      
      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`)
    }
  }

  /**
   * Refresh the access token
   * @returns {Promise<string|null>} New access token or null if failed
   */
  async refreshToken() {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }
    
    // Check if we're trying to refresh too frequently
    const now = Date.now()
    if (now - this.lastRefreshAttempt < this.minRefreshInterval) {
      console.log('Refresh attempt too soon, skipping')
      return null
    }
    
    const { refreshToken } = tokenManager.getTokens()
    if (!refreshToken) {
      this.handleRefreshFailure(new Error('No refresh token available'))
      return null
    }
    
    // Check if refresh token is expired
    if (tokenManager.isTokenExpired(refreshToken)) {
      this.handleRefreshFailure(new Error('Refresh token expired'))
      return null
    }
    
    this.lastRefreshAttempt = now
    this.isRefreshing = true
    this.refreshPromise = this.performRefresh(refreshToken)
    
    try {
      const newAccessToken = await this.refreshPromise
      this.handleRefreshSuccess(newAccessToken)
      return newAccessToken
    } catch (error) {
      this.handleRefreshFailure(error)
      return null
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform the actual token refresh
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<string>} New access token
   */
  async performRefresh(refreshToken) {
    try {
      const response = await api.auth.refresh(refreshToken)
      
      if (response.data.success) {
        const { access_token } = response.data.data
        
        // Update tokens in storage
        tokenManager.setTokens(access_token, refreshToken)
        
        // Process queued requests
        this.processRequestQueue(access_token)
        
        // Schedule next refresh
        this.scheduleNextRefresh()
        
        // Reset retry count on success
        this.retryCount = 0
        
        return access_token
      } else {
        throw new Error(response.message || 'Token refresh failed')
      }
    } catch (error) {
      // Increment retry count
      this.retryCount++
      
      // If we haven't exceeded max retries and it's a retryable error, try again
      if (this.retryCount < this.maxRetries && this.isRetryableError(error)) {
        console.warn(`Token refresh failed, retrying (${this.retryCount}/${this.maxRetries})...`)
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return this.performRefresh(refreshToken)
      }
      
      throw error
    }
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} True if retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return true
    }
    
    // Server errors (5xx) are retryable
    if (error.response?.status >= 500) {
      return true
    }
    
    // Rate limiting is retryable
    if (error.response?.status === 429) {
      return true
    }
    
    return false
  }

  /**
   * Handle successful token refresh
   * @param {string} newAccessToken - The new access token
   */
  handleRefreshSuccess(newAccessToken) {
    console.log('Token refreshed successfully')
    
    if (this.onRefreshSuccess) {
      this.onRefreshSuccess(newAccessToken)
    }
  }

  /**
   * Handle failed token refresh
   * @param {Error} error - The refresh error
   */
  handleRefreshFailure(error) {
    console.error('Token refresh failed:', error)
    
    // Clear tokens on failure
    tokenManager.clearTokens()
    
    // Clear retry count
    this.retryCount = 0
    
    // Reject all queued requests
    this.rejectRequestQueue(error)
    
    if (this.onRefreshFailure) {
      this.onRefreshFailure(error)
    }
    
    if (this.onTokenExpired) {
      this.onTokenExpired()
    }
  }

  /**
   * Add a request to the queue while token is being refreshed
   * @param {Function} requestFunction - Function that makes the API request
   * @returns {Promise} Promise that resolves when request is processed
   */
  queueRequest(requestFunction) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request: requestFunction,
        resolve,
        reject
      })
    })
  }

  /**
   * Process all queued requests with the new token
   * @param {string} newAccessToken - The new access token
   */
  processRequestQueue(newAccessToken) {
    const queue = [...this.requestQueue]
    this.requestQueue = []
    
    queue.forEach(({ request, resolve, reject }) => {
      try {
        // Execute the request with the new token
        const result = request(newAccessToken)
        
        // Handle both sync and async requests
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject)
        } else {
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Reject all queued requests
   * @param {Error} error - The error to reject with
   */
  rejectRequestQueue(error) {
    const queue = [...this.requestQueue]
    this.requestQueue = []
    
    queue.forEach(({ reject }) => {
      reject(error)
    })
  }

  /**
   * Set callback for successful token refresh
   * @param {Function} callback - Callback function
   */
  onRefreshSuccessCallback(callback) {
    this.onRefreshSuccess = callback
  }

  /**
   * Set callback for failed token refresh
   * @param {Function} callback - Callback function
   */
  onRefreshFailureCallback(callback) {
    this.onRefreshFailure = callback
  }

  /**
   * Set callback for token expiration
   * @param {Function} callback - Callback function
   */
  onTokenExpiredCallback(callback) {
    this.onTokenExpired = callback
  }

  /**
   * Ensure we have a valid token before making API requests
   * This is the main method that should be called before any authenticated API request
   * @returns {Promise<string|null>} Valid access token or null if refresh failed
   */
  async ensureValidToken() {
    const { accessToken } = tokenManager.getTokens()
    
    if (!accessToken) {
      return null
    }
    
    // If token doesn't need refresh, return it
    if (!tokenManager.needsRefresh(accessToken)) {
      return accessToken
    }
    
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          request: (newToken) => newToken,
          resolve,
          reject
        })
      })
    }
    
    // Refresh the token
    return await this.refreshToken()
  }

  /**
   * Get refresh status
   * @returns {Object} Refresh status information
   */
  getStatus() {
    return {
      isRefreshing: this.isRefreshing,
      queueLength: this.requestQueue.length,
      retryCount: this.retryCount,
      hasRefreshTimer: !!this.refreshTimer,
      lastRefreshAttempt: this.lastRefreshAttempt
    }
  }

  /**
   * Cleanup the token refresh manager
   */
  cleanup() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    this.rejectRequestQueue(new Error('Token refresh manager cleanup'))
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this))
    }
  }
}

// Create singleton instance
const tokenRefreshManager = new TokenRefreshManager()

// Initialize on module load
if (typeof window !== 'undefined') {
  tokenRefreshManager.initialize()
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    tokenRefreshManager.cleanup()
  })
}

export default tokenRefreshManager
export { TokenRefreshManager }