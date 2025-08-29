/**
 * Test IDs for E2E testing
 * Centralized location for all data-testid values
 */

export const testIds = {
  // Login Page
  login: {
    form: 'login-form',
    emailInput: 'email-input',
    passwordInput: 'password-input',
    loginButton: 'login-button',
    forgotPasswordLink: 'forgot-password-link',
    registerLink: 'register-link',
    rememberMeCheckbox: 'remember-me-checkbox'
  },

  // Register Page
  register: {
    form: 'register-form',
    companyName: 'company-name',
    companySize: 'company-size',
    industry: 'industry',
    country: 'country',
    firstName: 'first-name',
    lastName: 'last-name',
    email: 'email',
    phone: 'phone',
    password: 'password',
    confirmPassword: 'confirm-password',
    cardholderName: 'cardholder-name',
    cardNumber: 'card-number',
    expiryDate: 'expiry-date',
    cvv: 'cvv',
    nextButton: 'next-button',
    previousButton: 'previous-button',
    completeRegistrationButton: 'complete-registration-button',
    passwordStrength: 'password-strength',
    passwordRequirements: 'password-requirements'
  },

  // Verify Email Page
  verifyEmail: {
    form: 'verify-email-form',
    verificationCode: 'verification-code',
    verifyButton: 'verify-button',
    resendButton: 'resend-button',
    verificationMessage: 'verification-message'
  },

  // Forgot Password Page
  forgotPassword: {
    form: 'forgot-password-form',
    emailInput: 'email-input',
    sendResetButton: 'send-reset-button',
    emailSentMessage: 'email-sent-message'
  },

  // Reset Password Page
  resetPassword: {
    form: 'reset-password-form',
    newPassword: 'new-password',
    confirmPassword: 'confirm-password',
    resetPasswordButton: 'reset-password-button'
  },

  // Dashboard
  dashboard: {
    userName: 'user-name',
    logoutButton: 'logout-button',
    userMenu: 'user-menu'
  },

  // Error Handling
  errors: {
    errorMessage: 'error-message',
    errorDisplay: 'error-display',
    retryButton: 'retry-button',
    dismissButton: 'dismiss-button',
    rateLimitMessage: 'rate-limit-message',
    rateLimitCountdown: 'rate-limit-countdown',
    networkError: 'network-error',
    recoveryOptions: 'recovery-options'
  },

  // Success Messages
  success: {
    successMessage: 'success-message',
    sessionExpiredMessage: 'session-expired-message'
  },

  // Navigation
  navigation: {
    verifyEmailLink: 'verify-email-link',
    loginLink: 'login-link',
    registerLink: 'register-link'
  },

  // Loading States
  loading: {
    spinner: 'loading-spinner',
    loadingButton: 'loading-button'
  }
}

export default testIds