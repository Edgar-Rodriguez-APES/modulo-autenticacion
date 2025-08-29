import { describe, it, expect, beforeEach, vi } from 'vitest'
import TokenManager from '../../utils/tokenManager'

describe('TokenManager', () => {
  let tokenManager

  beforeEach(() => {
    tokenManager = new TokenManager()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('setTokens', () => {
    it('should store tokens in localStorage', () => {
      const accessToken = 'access-token-123'
      const refreshToken = 'refresh-token-123'

      tokenManager.setTokens(accessToken, refreshToken)

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', accessToken)
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', refreshToken)
    })

    it('should handle null tokens gracefully', () => {
      tokenManager.setTokens(null, null)

      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('getTokens', () => {
    it('should retrieve stored tokens', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'stored-access-token'
        if (key === 'refreshToken') return 'stored-refresh-token'
        return null
      })

      const tokens = tokenManager.getTokens()

      expect(tokens.accessToken).toBe('stored-access-token')
      expect(tokens.refreshToken).toBe('stored-refresh-token')
    })

    it('should return null for missing tokens', () => {
      localStorage.getItem.mockReturnValue(null)

      const tokens = tokenManager.getTokens()

      expect(tokens.accessToken).toBeNull()
      expect(tokens.refreshToken).toBeNull()
    })
  })

  describe('clearTokens', () => {
    it('should clear all auth-related tokens', () => {
      tokenManager.clearTokens()

      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
    })
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 })
      
      expect(tokenManager.isTokenExpired(expiredToken)).toBe(true)
    })

    it('should return false for valid token', () => {
      // Create a token that expires in 1 hour
      const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 })
      
      expect(tokenManager.isTokenExpired(validToken)).toBe(false)
    })

    it('should return true for invalid token format', () => {
      expect(tokenManager.isTokenExpired('invalid-token')).toBe(true)
    })

    it('should return true for null token', () => {
      expect(tokenManager.isTokenExpired(null)).toBe(true)
    })
  })

  describe('getTokenExpiry', () => {
    it('should return expiry timestamp for valid token', () => {
      const expiry = Math.floor(Date.now() / 1000) + 3600
      const token = createMockJWT({ exp: expiry })
      
      expect(tokenManager.getTokenExpiry(token)).toBe(expiry)
    })

    it('should return null for invalid token', () => {
      expect(tokenManager.getTokenExpiry('invalid-token')).toBeNull()
    })
  })

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      const payload = { 
        sub: 'user-123', 
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }
      const token = createMockJWT(payload)
      
      const decoded = tokenManager.decodeToken(token)
      
      expect(decoded.sub).toBe(payload.sub)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.exp).toBe(payload.exp)
    })

    it('should return null for invalid token', () => {
      expect(tokenManager.decodeToken('invalid-token')).toBeNull()
    })
  })

  describe('shouldRefreshToken', () => {
    it('should return true when token expires within threshold', () => {
      // Token expires in 4 minutes (less than 5 minute threshold)
      const token = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 240 })
      
      expect(tokenManager.shouldRefreshToken(token)).toBe(true)
    })

    it('should return false when token has plenty of time left', () => {
      // Token expires in 10 minutes (more than 5 minute threshold)
      const token = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 600 })
      
      expect(tokenManager.shouldRefreshToken(token)).toBe(false)
    })

    it('should return true for expired token', () => {
      const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 })
      
      expect(tokenManager.shouldRefreshToken(expiredToken)).toBe(true)
    })
  })

  describe('ensureValidToken', () => {
    it('should return existing token if still valid', async () => {
      const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 })
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return validToken
        if (key === 'refreshToken') return 'refresh-token'
        return null
      })

      const result = await tokenManager.ensureValidToken()
      
      expect(result).toBe(validToken)
    })

    it('should refresh token if near expiry', async () => {
      const nearExpiryToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 240 })
      const newToken = 'new-access-token'
      
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return nearExpiryToken
        if (key === 'refreshToken') return 'refresh-token'
        return null
      })

      // Mock the refresh function
      tokenManager.refreshTokens = vi.fn().mockResolvedValue({
        success: true,
        data: { access_token: newToken }
      })

      const result = await tokenManager.ensureValidToken()
      
      expect(tokenManager.refreshTokens).toHaveBeenCalled()
      expect(result).toBe(newToken)
    })

    it('should return null if no tokens available', async () => {
      localStorage.getItem.mockReturnValue(null)

      const result = await tokenManager.ensureValidToken()
      
      expect(result).toBeNull()
    })
  })
})

// Helper function to create mock JWT tokens
function createMockJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = 'mock-signature'
  
  return `${encodedHeader}.${encodedPayload}.${signature}`
}