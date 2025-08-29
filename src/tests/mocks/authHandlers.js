import { http, HttpResponse } from 'msw'

const AUTH_BASE_URL = 'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth'

// Mock user data
const mockUser = {
  user_id: 'test-user-123',
  tenant_id: 'test-tenant-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MASTER',
  status: 'active',
  email_verified: true,
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-01-01T00:00:00Z'
}

const mockTenant = {
  tenant_id: 'test-tenant-123',
  name: 'Test Company',
  plan: 'PROFESSIONAL',
  status: 'ACTIVE'
}

const mockTokens = {
  access_token: 'mock-access-token-123',
  refresh_token: 'mock-refresh-token-123',
  expires_in: 3600,
  token_type: 'Bearer'
}

export const authHandlers = [
  // Health check
  http.get(`${AUTH_BASE_URL}/health`, () => {
    return HttpResponse.json({
      success: true,
      data: { status: 'healthy' },
      message: 'Auth service is healthy',
      timestamp: new Date().toISOString()
    })
  }),

  // Register
  http.post(`${AUTH_BASE_URL}/register`, async ({ request }) => {
    const body = await request.json()
    
    // Simulate validation errors
    if (!body.email || !body.password) {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Simulate email conflict
    if (body.email === 'existing@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'RESOURCE_CONFLICT',
          message: 'Email already exists'
        },
        timestamp: new Date().toISOString()
      }, { status: 409 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: { ...mockUser, email: body.email, name: body.name },
        tenant: mockTenant,
        verification_token: 'mock-verification-token'
      },
      message: 'Registration successful. Please verify your email.',
      timestamp: new Date().toISOString()
    })
  }),

  // Verify email
  http.post(`${AUTH_BASE_URL}/verify-email`, async ({ request }) => {
    const body = await request.json()
    
    if (body.verification_token === 'invalid-token') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: { ...mockUser, email_verified: true },
        tenant: mockTenant
      },
      message: 'Email verified successfully',
      timestamp: new Date().toISOString()
    })
  }),

  // Login
  http.post(`${AUTH_BASE_URL}/login`, async ({ request }) => {
    const body = await request.json()
    
    // Simulate invalid credentials
    if (body.email === 'wrong@example.com' || body.password === 'wrongpassword') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    // Simulate unverified email
    if (body.email === 'unverified@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before logging in'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }

    // Simulate account locked
    if (body.email === 'locked@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account temporarily locked due to multiple failed attempts'
        },
        timestamp: new Date().toISOString()
      }, { status: 423 })
    }

    // Simulate rate limiting
    if (body.email === 'ratelimited@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many login attempts. Please try again later.'
        },
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        ...mockTokens,
        user: { ...mockUser, email: body.email },
        tenant: mockTenant
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    })
  }),

  // Refresh token
  http.post(`${AUTH_BASE_URL}/refresh`, async ({ request }) => {
    const body = await request.json()
    
    if (body.refresh_token === 'invalid-refresh-token') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired refresh token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        ...mockTokens,
        access_token: 'new-access-token-123',
        user: mockUser,
        tenant: mockTenant
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    })
  }),

  // Logout
  http.post(`${AUTH_BASE_URL}/logout`, () => {
    return HttpResponse.json({
      success: true,
      data: {},
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    })
  }),

  // Forgot password
  http.post(`${AUTH_BASE_URL}/forgot-password`, async ({ request }) => {
    const body = await request.json()
    
    // Simulate rate limiting
    if (body.email === 'ratelimited@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please try again later.'
        },
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        reset_token: 'mock-reset-token'
      },
      message: 'Password reset email sent',
      timestamp: new Date().toISOString()
    })
  }),

  // Reset password
  http.post(`${AUTH_BASE_URL}/reset-password`, async ({ request }) => {
    const body = await request.json()
    
    if (body.reset_token === 'invalid-reset-token') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    return HttpResponse.json({
      success: true,
      data: {},
      message: 'Password reset successful',
      timestamp: new Date().toISOString()
    })
  }),

  // Resend verification
  http.post(`${AUTH_BASE_URL}/resend-verification`, async ({ request }) => {
    const body = await request.json()
    
    // Simulate rate limiting
    if (body.email === 'ratelimited@example.com') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification requests. Please try again later.'
        },
        timestamp: new Date().toISOString()
      }, { status: 429 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        verification_token: 'new-verification-token'
      },
      message: 'Verification email sent',
      timestamp: new Date().toISOString()
    })
  }),

  // Validate token
  http.post(`${AUTH_BASE_URL}/validate-token`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || authHeader === 'Bearer invalid-token') {
      return HttpResponse.json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser,
        tenant: mockTenant
      },
      message: 'Token is valid',
      timestamp: new Date().toISOString()
    })
  })
]