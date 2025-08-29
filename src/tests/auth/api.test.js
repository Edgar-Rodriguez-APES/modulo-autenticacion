import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  health,
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  resendVerification,
  validateToken
} from '../../utils/api'

describe('Auth API Client', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('health', () => {
    it('should return health status', async () => {
      const result = await health()
      
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('healthy')
    })
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        tenant_id: 'test-tenant',
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
        role: 'MASTER'
      }

      const result = await register(userData)
      
      expect(result.success).toBe(true)
      expect(result.data.user.email).toBe(userData.email)
      expect(result.data.user.name).toBe(userData.name)
      expect(result.data.verification_token).toBeDefined()
    })

    it('should handle validation errors', async () => {
      const userData = {
        tenant_id: 'test-tenant',
        // Missing email and password
        name: 'New User',
        role: 'MASTER'
      }

      const result = await register(userData)
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('VALIDATION_ERROR')
    })

    it('should handle email conflicts', async () => {
      const userData = {
        tenant_id: 'test-tenant',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Existing User',
        role: 'MASTER'
      }

      const result = await register(userData)
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('RESOURCE_CONFLICT')
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const result = await verifyEmail('valid-token')
      
      expect(result.success).toBe(true)
      expect(result.data.user.email_verified).toBe(true)
    })

    it('should handle invalid tokens', async () => {
      const result = await verifyEmail('invalid-token')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_TOKEN')
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await login('test@example.com', 'password123')
      
      expect(result.success).toBe(true)
      expect(result.data.access_token).toBeDefined()
      expect(result.data.refresh_token).toBeDefined()
      expect(result.data.user.email).toBe('test@example.com')
    })

    it('should handle invalid credentials', async () => {
      const result = await login('wrong@example.com', 'wrongpassword')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_CREDENTIALS')
    })

    it('should handle unverified email', async () => {
      const result = await login('unverified@example.com', 'password123')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('EMAIL_NOT_VERIFIED')
    })

    it('should handle account locked', async () => {
      const result = await login('locked@example.com', 'password123')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('ACCOUNT_LOCKED')
    })

    it('should handle rate limiting', async () => {
      const result = await login('ratelimited@example.com', 'password123')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const result = await refreshToken('valid-refresh-token')
      
      expect(result.success).toBe(true)
      expect(result.data.access_token).toBe('new-access-token-123')
    })

    it('should handle invalid refresh token', async () => {
      const result = await refreshToken('invalid-refresh-token')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_TOKEN')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await logout('valid-refresh-token')
      
      expect(result.success).toBe(true)
    })
  })

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const result = await forgotPassword('test@example.com')
      
      expect(result.success).toBe(true)
      expect(result.data.reset_token).toBeDefined()
    })

    it('should handle rate limiting', async () => {
      const result = await forgotPassword('ratelimited@example.com')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const result = await resetPassword('valid-reset-token', 'NewPassword123!')
      
      expect(result.success).toBe(true)
    })

    it('should handle invalid reset token', async () => {
      const result = await resetPassword('invalid-reset-token', 'NewPassword123!')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_TOKEN')
    })
  })

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const result = await resendVerification('test@example.com')
      
      expect(result.success).toBe(true)
      expect(result.data.verification_token).toBeDefined()
    })

    it('should handle rate limiting', async () => {
      const result = await resendVerification('ratelimited@example.com')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const result = await validateToken('valid-token')
      
      expect(result.success).toBe(true)
      expect(result.data.user).toBeDefined()
      expect(result.data.tenant).toBeDefined()
    })

    it('should handle invalid token', async () => {
      const result = await validateToken('invalid-token')
      
      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_TOKEN')
    })
  })
})