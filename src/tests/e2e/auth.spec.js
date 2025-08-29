import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Should show user info
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User')
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Fill with invalid credentials
      await page.fill('[data-testid="email-input"]', 'wrong@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email or password')
      
      // Should stay on login page
      await expect(page).toHaveURL('/login')
    })

    test('should handle unverified email', async ({ page }) => {
      await page.goto('/login')
      
      // Fill with unverified email
      await page.fill('[data-testid="email-input"]', 'unverified@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Should show email verification error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Please verify your email')
      
      // Should show recovery options
      await expect(page.locator('[data-testid="verify-email-link"]')).toBeVisible()
    })

    test('should handle rate limiting', async ({ page }) => {
      await page.goto('/login')
      
      // Fill with rate limited email
      await page.fill('[data-testid="email-input"]', 'ratelimited@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-message"]')).toContainText('Too many login attempts')
      
      // Should show countdown
      await expect(page.locator('[data-testid="rate-limit-countdown"]')).toBeVisible()
    })
  })

  test.describe('Registration Flow', () => {
    test('should complete full registration flow', async ({ page }) => {
      await page.goto('/register')
      
      // Step 1: Company Information
      await page.fill('[data-testid="company-name"]', 'Test Company')
      await page.selectOption('[data-testid="company-size"]', '11-50')
      await page.selectOption('[data-testid="industry"]', 'technology')
      await page.fill('[data-testid="country"]', 'España')
      
      await page.click('[data-testid="next-button"]')
      
      // Step 2: User Information
      await page.fill('[data-testid="first-name"]', 'Test')
      await page.fill('[data-testid="last-name"]', 'User')
      await page.fill('[data-testid="email"]', 'newuser@example.com')
      await page.fill('[data-testid="phone"]', '+34 600 123 456')
      await page.fill('[data-testid="password"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password"]', 'SecurePass123!')
      
      await page.click('[data-testid="next-button"]')
      
      // Step 3: Plan Selection (skip)
      await page.click('[data-testid="next-button"]')
      
      // Step 4: Payment Information
      await page.fill('[data-testid="cardholder-name"]', 'Test User')
      await page.fill('[data-testid="card-number"]', '4242424242424242')
      await page.fill('[data-testid="expiry-date"]', '12/25')
      await page.fill('[data-testid="cvv"]', '123')
      
      // Complete registration
      await page.click('[data-testid="complete-registration-button"]')
      
      // Should redirect to email verification
      await expect(page).toHaveURL('/verify-email')
      
      // Should show verification message
      await expect(page.locator('[data-testid="verification-message"]')).toContainText('newuser@example.com')
    })

    test('should show password strength indicator', async ({ page }) => {
      await page.goto('/register')
      
      // Navigate to user info step
      await page.fill('[data-testid="company-name"]', 'Test Company')
      await page.selectOption('[data-testid="company-size"]', '11-50')
      await page.selectOption('[data-testid="industry"]', 'technology')
      await page.fill('[data-testid="country"]', 'España')
      await page.click('[data-testid="next-button"]')
      
      // Test password strength
      const passwordInput = page.locator('[data-testid="password"]')
      
      // Weak password
      await passwordInput.fill('weak')
      await expect(page.locator('[data-testid="password-strength"]')).toContainText('Débil')
      
      // Strong password
      await passwordInput.fill('SecurePass123!')
      await expect(page.locator('[data-testid="password-strength"]')).toContainText('Fuerte')
      
      // Should show requirements checklist
      await expect(page.locator('[data-testid="password-requirements"]')).toBeVisible()
    })
  })

  test.describe('Email Verification Flow', () => {
    test('should verify email with valid code', async ({ page }) => {
      // Set up pending verification
      await page.goto('/verify-email')
      await page.evaluate(() => {
        localStorage.setItem('pendingVerificationEmail', 'test@example.com')
        localStorage.setItem('pendingUserName', 'Test User')
      })
      
      await page.reload()
      
      // Enter verification code
      await page.fill('[data-testid="verification-code"]', '123456')
      await page.click('[data-testid="verify-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Email verificado exitosamente')
      
      // Should redirect to login
      await page.waitForTimeout(2100)
      await expect(page).toHaveURL('/login')
    })

    test('should resend verification code', async ({ page }) => {
      await page.goto('/verify-email')
      await page.evaluate(() => {
        localStorage.setItem('pendingVerificationEmail', 'test@example.com')
      })
      
      await page.reload()
      
      // Click resend button
      await page.click('[data-testid="resend-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('reenviado exitosamente')
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should complete password reset flow', async ({ page }) => {
      // Step 1: Request password reset
      await page.goto('/forgot-password')
      
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.click('[data-testid="send-reset-button"]')
      
      // Should show confirmation
      await expect(page.locator('[data-testid="email-sent-message"]')).toContainText('Email Enviado')
      
      // Step 2: Reset password (simulate clicking email link)
      await page.goto('/reset-password?token=valid-reset-token')
      
      await page.fill('[data-testid="new-password"]', 'NewSecurePass123!')
      await page.fill('[data-testid="confirm-password"]', 'NewSecurePass123!')
      
      await page.click('[data-testid="reset-password-button"]')
      
      // Should show success and redirect
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Contraseña Restablecida')
      
      await page.waitForTimeout(3100)
      await expect(page).toHaveURL('/login')
    })

    test('should handle invalid reset token', async ({ page }) => {
      await page.goto('/reset-password?token=invalid-reset-token')
      
      await page.fill('[data-testid="new-password"]', 'NewSecurePass123!')
      await page.fill('[data-testid="confirm-password"]', 'NewSecurePass123!')
      
      await page.click('[data-testid="reset-password-button"]')
      
      // Should show error
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid or expired reset token')
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL('/dashboard')
      
      // Reload page
      await page.reload()
      
      // Should still be logged in
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Test User')
    })

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL('/dashboard')
      
      // Logout
      await page.click('[data-testid="logout-button"]')
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
      
      // Should clear session
      const tokens = await page.evaluate(() => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      }))
      
      expect(tokens.accessToken).toBeNull()
      expect(tokens.refreshToken).toBeNull()
    })

    test('should handle expired session', async ({ page }) => {
      // Set expired token
      await page.goto('/dashboard')
      await page.evaluate(() => {
        localStorage.setItem('accessToken', 'expired-token')
        localStorage.setItem('refreshToken', 'invalid-refresh-token')
      })
      
      await page.reload()
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
      
      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('sesión ha expirado')
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login')
      
      // Tab through form elements
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused()
      
      // Should be able to submit with Enter
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.keyboard.press('Enter')
      
      await expect(page).toHaveURL('/dashboard')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login')
      
      // Check for proper labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label')
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label')
      
      // Check for error announcements
      await page.fill('[data-testid="email-input"]', 'wrong@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-button"]')
      
      await expect(page.locator('[data-testid="error-message"]')).toHaveAttribute('role', 'alert')
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/login')
      
      // Form should be visible and usable
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
      
      // Fill and submit form
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'password123')
      await page.click('[data-testid="login-button"]')
      
      await expect(page).toHaveURL('/dashboard')
    })
  })
})