import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../../context/AuthContext'
import LoginPage from '../../pages/LoginPage'
import RegisterPage from '../../pages/RegisterPage'
import VerifyEmailPage from '../../pages/VerifyEmailPage'
import ForgotPasswordPage from '../../pages/ForgotPasswordPage'
import ResetPasswordPage from '../../pages/ResetPasswordPage'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: vi.fn() }
  })
}))

// Test wrapper with all necessary providers
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Authentication Flows Integration Tests', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      render(<RegisterPage />, { wrapper: TestWrapper })

      // Step 1: Company Information
      await user.type(screen.getByLabelText(/nombre de la empresa/i), 'Test Company')
      await user.selectOptions(screen.getByLabelText(/tamaño de la empresa/i), '11-50')
      await user.selectOptions(screen.getByLabelText(/industria/i), 'technology')
      await user.type(screen.getByLabelText(/país/i), 'España')
      
      await user.click(screen.getByRole('button', { name: /siguiente/i }))

      // Step 2: User Information
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/nombre/i), 'Test')
      await user.type(screen.getByLabelText(/apellido/i), 'User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/teléfono/i), '+34 600 123 456')
      await user.type(screen.getByLabelText(/contraseña/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'SecurePass123!')

      await user.click(screen.getByRole('button', { name: /siguiente/i }))

      // Step 3: Plan Selection (skip for now)
      await waitFor(() => {
        expect(screen.getByText(/selección de plan/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /siguiente/i }))

      // Step 4: Payment Information
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del titular/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/nombre del titular/i), 'Test User')
      await user.type(screen.getByLabelText(/número de tarjeta/i), '4242424242424242')
      await user.type(screen.getByLabelText(/fecha de vencimiento/i), '12/25')
      await user.type(screen.getByLabelText(/cvv/i), '123')

      // Complete registration
      await user.click(screen.getByRole('button', { name: /completar registro/i }))

      // Should redirect to email verification
      await waitFor(() => {
        expect(window.location.pathname).toBe('/verify-email')
      })
    })

    it('should handle registration errors', async () => {
      render(<RegisterPage />, { wrapper: TestWrapper })

      // Navigate to user info step
      await user.type(screen.getByLabelText(/nombre de la empresa/i), 'Test Company')
      await user.selectOptions(screen.getByLabelText(/tamaño de la empresa/i), '11-50')
      await user.selectOptions(screen.getByLabelText(/industria/i), 'technology')
      await user.type(screen.getByLabelText(/país/i), 'España')
      await user.click(screen.getByRole('button', { name: /siguiente/i }))

      // Try to register with existing email
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/nombre/i), 'Test')
      await user.type(screen.getByLabelText(/apellido/i), 'User')
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'SecurePass123!')
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'SecurePass123!')

      // Skip to final step and submit
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      await user.click(screen.getByRole('button', { name: /siguiente/i }))
      
      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del titular/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/nombre del titular/i), 'Test User')
      await user.type(screen.getByLabelText(/número de tarjeta/i), '4242424242424242')
      await user.type(screen.getByLabelText(/fecha de vencimiento/i), '12/25')
      await user.type(screen.getByLabelText(/cvv/i), '123')

      await user.click(screen.getByRole('button', { name: /completar registro/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      render(<LoginPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard')
      })
    })

    it('should handle invalid credentials', async () => {
      render(<LoginPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })
    })

    it('should handle unverified email', async () => {
      render(<LoginPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/email/i), 'unverified@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/please verify your email/i)).toBeInTheDocument()
      })

      // Should show recovery options
      expect(screen.getByText(/verificar email/i)).toBeInTheDocument()
    })

    it('should handle rate limiting', async () => {
      render(<LoginPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/email/i), 'ratelimited@example.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument()
      })

      // Should show rate limit handler
      expect(screen.getByText(/límite de intentos alcanzado/i)).toBeInTheDocument()
    })
  })

  describe('Email Verification Flow', () => {
    beforeEach(() => {
      // Set up pending verification data
      localStorage.setItem('pendingVerificationEmail', 'test@example.com')
      localStorage.setItem('pendingUserName', 'Test User')
    })

    it('should verify email with valid code', async () => {
      render(<VerifyEmailPage />, { wrapper: TestWrapper })

      const codeInput = screen.getByLabelText(/código de verificación/i)
      await user.type(codeInput, '123456')
      
      await user.click(screen.getByRole('button', { name: /verificar email/i }))

      await waitFor(() => {
        expect(screen.getByText(/email verificado exitosamente/i)).toBeInTheDocument()
      })

      // Should redirect to login after delay
      setTimeout(() => {
        expect(window.location.pathname).toBe('/login')
      }, 2100)
    })

    it('should handle invalid verification code', async () => {
      render(<VerifyEmailPage />, { wrapper: TestWrapper })

      const codeInput = screen.getByLabelText(/código de verificación/i)
      await user.type(codeInput, 'invalid')
      
      await user.click(screen.getByRole('button', { name: /verificar email/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired verification token/i)).toBeInTheDocument()
      })
    })

    it('should resend verification code', async () => {
      render(<VerifyEmailPage />, { wrapper: TestWrapper })

      await user.click(screen.getByRole('button', { name: /reenviar código/i }))

      await waitFor(() => {
        expect(screen.getByText(/código de verificación reenviado exitosamente/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Reset Flow', () => {
    it('should complete password reset flow', async () => {
      // Step 1: Request password reset
      render(<ForgotPasswordPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /enviar enlace de recuperación/i }))

      await waitFor(() => {
        expect(screen.getByText(/email enviado/i)).toBeInTheDocument()
      })

      // Step 2: Reset password with token
      // Mock URL with reset token
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?token=valid-reset-token'
        }
      })

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewSecurePass123!')
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewSecurePass123!')
      
      await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

      await waitFor(() => {
        expect(screen.getByText(/contraseña restablecida/i)).toBeInTheDocument()
      })
    })

    it('should handle invalid reset token', async () => {
      // Mock URL with invalid token
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?token=invalid-reset-token'
        }
      })

      render(<ResetPasswordPage />, { wrapper: TestWrapper })

      await user.type(screen.getByLabelText(/nueva contraseña/i), 'NewSecurePass123!')
      await user.type(screen.getByLabelText(/confirmar nueva contraseña/i), 'NewSecurePass123!')
      
      await user.click(screen.getByRole('button', { name: /restablecer contraseña/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired reset token/i)).toBeInTheDocument()
      })
    })
  })

  describe('Token Management', () => {
    it('should handle automatic token refresh', async () => {
      // Set up near-expiry token
      const nearExpiryToken = createMockJWT({ 
        exp: Math.floor(Date.now() / 1000) + 240 // 4 minutes
      })
      
      localStorage.setItem('accessToken', nearExpiryToken)
      localStorage.setItem('refreshToken', 'valid-refresh-token')

      render(<LoginPage />, { wrapper: TestWrapper })

      // Token should be automatically refreshed
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('new-access-token-123')
      })
    })

    it('should handle refresh token failure', async () => {
      // Set up expired token with invalid refresh token
      const expiredToken = createMockJWT({ 
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      })
      
      localStorage.setItem('accessToken', expiredToken)
      localStorage.setItem('refreshToken', 'invalid-refresh-token')

      render(<LoginPage />, { wrapper: TestWrapper })

      // Should clear tokens and redirect to login
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
      })
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