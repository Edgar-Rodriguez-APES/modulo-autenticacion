/**
 * Authentication Error Handler for Auth Service Integration
 * Provides comprehensive error handling, mapping, and user guidance
 */

/**
 * Auth Error class for structured error handling
 */
export class AuthError extends Error {
  constructor(code, message, details = null, status = 0, retryable = false) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.details = details
    this.status = status
    this.retryable = retryable
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Authentication Error Handler class
 */
export class AuthErrorHandler {
  /**
   * Handle and normalize API errors
   * @param {Error} error - Original error from API call
   * @param {string} context - Context where error occurred (login, register, etc.)
   * @returns {AuthError} Normalized AuthError instance
   */
  static handle(error, context = '') {
    // Network or connection errors
    if (!error.response) {
      return new AuthError(
        'NETWORK_ERROR',
        'Error de conexión. Verifica tu internet y vuelve a intentar.',
        null,
        0,
        true
      )
    }

    const status = error.response.status
    const errorData = error.response.data

    // Auth Service structured error response
    if (errorData?.error) {
      const apiError = errorData.error
      const isRetryable = this.isRetryableError(apiError.code)
      
      return new AuthError(
        apiError.code,
        this.getContextualMessage(apiError.code, context) || apiError.message,
        apiError.details || null,
        status,
        isRetryable
      )
    }

    // Handle HTTP status codes when no structured error is provided
    return this.handleHttpStatus(status, context, errorData)
  }

  /**
   * Handle HTTP status codes
   * @param {number} status - HTTP status code
   * @param {string} context - Error context
   * @param {Object} errorData - Raw error data
   * @returns {AuthError} AuthError instance
   */
  static handleHttpStatus(status, context, errorData) {
    switch (status) {
      case 400:
        return new AuthError(
          'VALIDATION_ERROR',
          'Los datos ingresados no son válidos. Por favor revisa e intenta nuevamente.',
          errorData?.details || null,
          400,
          false
        )

      case 401:
        return new AuthError(
          'INVALID_CREDENTIALS',
          context === 'login' 
            ? 'Email o contraseña incorrectos. Verifica tus credenciales.'
            : 'Sesión expirada. Por favor inicia sesión nuevamente.',
          null,
          401,
          false
        )

      case 403:
        return new AuthError(
          'EMAIL_NOT_VERIFIED',
          'Tu email no ha sido verificado. Revisa tu bandeja de entrada y verifica tu cuenta.',
          null,
          403,
          false
        )

      case 404:
        return new AuthError(
          'NOT_FOUND',
          'El recurso solicitado no fue encontrado.',
          null,
          404,
          false
        )

      case 409:
        return new AuthError(
          'RESOURCE_CONFLICT',
          context === 'register' 
            ? 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.'
            : 'Conflicto con datos existentes.',
          null,
          409,
          false
        )

      case 422:
        return new AuthError(
          'UNPROCESSABLE_ENTITY',
          'Los datos son válidos pero no pueden ser procesados. Verifica la información.',
          errorData?.details || null,
          422,
          false
        )

      case 423:
        return new AuthError(
          'ACCOUNT_LOCKED',
          'Tu cuenta ha sido bloqueada temporalmente por seguridad. Intenta nuevamente en unos minutos.',
          null,
          423,
          true
        )

      case 429:
        return new AuthError(
          'RATE_LIMIT_EXCEEDED',
          'Has realizado demasiadas solicitudes. Espera un momento antes de intentar nuevamente.',
          null,
          429,
          true
        )

      case 500:
        return new AuthError(
          'INTERNAL_ERROR',
          'Error interno del servidor. Nuestro equipo ha sido notificado.',
          null,
          500,
          true
        )

      case 502:
        return new AuthError(
          'BAD_GATEWAY',
          'Error de conectividad del servicio. Intenta nuevamente en unos momentos.',
          null,
          502,
          true
        )

      case 503:
        return new AuthError(
          'SERVICE_UNAVAILABLE',
          'El servicio está temporalmente no disponible. Intenta más tarde.',
          null,
          503,
          true
        )

      default:
        return new AuthError(
          'UNKNOWN_ERROR',
          `Error inesperado (${status}). Por favor intenta nuevamente.`,
          null,
          status,
          false
        )
    }
  }

  /**
   * Get contextual error message based on error code and context
   * @param {string} code - Error code
   * @param {string} context - Context (login, register, etc.)
   * @returns {string|null} Contextual message or null
   */
  static getContextualMessage(code, context) {
    const contextMessages = {
      login: {
        'INVALID_CREDENTIALS': 'Email o contraseña incorrectos. Verifica tus credenciales.',
        'EMAIL_NOT_VERIFIED': 'Tu email no ha sido verificado. Revisa tu bandeja de entrada.',
        'ACCOUNT_LOCKED': 'Cuenta bloqueada por múltiples intentos fallidos. Intenta más tarde.',
        'RATE_LIMIT_EXCEEDED': 'Demasiados intentos de inicio de sesión. Espera antes de intentar nuevamente.'
      },
      register: {
        'VALIDATION_ERROR': 'Por favor completa todos los campos correctamente.',
        'RESOURCE_CONFLICT': 'Este email ya está registrado. Intenta iniciar sesión.',
        'RATE_LIMIT_EXCEEDED': 'Demasiados intentos de registro. Espera antes de intentar nuevamente.'
      },
      'verify-email': {
        'VALIDATION_ERROR': 'Código de verificación inválido o expirado.',
        'NOT_FOUND': 'El código de verificación no es válido.',
        'RATE_LIMIT_EXCEEDED': 'Demasiados intentos de verificación. Espera antes de intentar nuevamente.'
      },
      'forgot-password': {
        'RATE_LIMIT_EXCEEDED': 'Demasiadas solicitudes de restablecimiento. Espera antes de intentar nuevamente.',
        'NOT_FOUND': 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.'
      },
      'reset-password': {
        'VALIDATION_ERROR': 'Token de restablecimiento inválido o expirado.',
        'NOT_FOUND': 'El enlace de restablecimiento no es válido o ha expirado.',
        'RATE_LIMIT_EXCEEDED': 'Demasiados intentos. Solicita un nuevo enlace de restablecimiento.'
      }
    }

    return contextMessages[context]?.[code] || null
  }

  /**
   * Check if error is retryable
   * @param {string} code - Error code
   * @returns {boolean} True if error is retryable
   */
  static isRetryableError(code) {
    const retryableCodes = [
      'NETWORK_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'INTERNAL_ERROR',
      'SERVICE_UNAVAILABLE',
      'BAD_GATEWAY',
      'ACCOUNT_LOCKED'
    ]
    return retryableCodes.includes(code)
  }

  /**
   * Check if error should trigger logout
   * @param {AuthError} error - AuthError instance
   * @returns {boolean} True if should logout
   */
  static shouldLogout(error) {
    const logoutCodes = [
      'TOKEN_EXPIRED',
      'AUTHENTICATION_ERROR',
      'AUTHORIZATION_REQUIRED'
    ]
    return logoutCodes.includes(error.code) || error.status === 401
  }

  /**
   * Check if error should redirect to email verification
   * @param {AuthError} error - AuthError instance
   * @returns {boolean} True if should redirect to verification
   */
  static shouldRedirectToVerification(error) {
    return error.code === 'EMAIL_NOT_VERIFIED'
  }

  /**
   * Get retry delay for retryable errors
   * @param {AuthError} error - AuthError instance
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  static getRetryDelay(error, attempt = 0) {
    if (!error.retryable) return 0

    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        return Math.min(30000, 5000 * Math.pow(2, attempt)) // 5s, 10s, 20s, 30s max
      case 'ACCOUNT_LOCKED':
        return 60000 // 1 minute
      case 'NETWORK_ERROR':
        return Math.min(10000, 1000 * Math.pow(2, attempt)) // 1s, 2s, 4s, 8s, 10s max
      default:
        return Math.min(5000, 1000 * (attempt + 1)) // 1s, 2s, 3s, 4s, 5s max
    }
  }

  /**
   * Get user-friendly action suggestions
   * @param {AuthError} error - AuthError instance
   * @param {string} context - Error context
   * @returns {Array<string>} Array of action suggestions
   */
  static getActionSuggestions(error, context = '') {
    const suggestions = []

    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        suggestions.push('Verifica que tu email y contraseña sean correctos')
        suggestions.push('¿Olvidaste tu contraseña? Usa el enlace "Olvidé mi contraseña"')
        break

      case 'EMAIL_NOT_VERIFIED':
        suggestions.push('Revisa tu bandeja de entrada y spam')
        suggestions.push('Haz clic en el enlace de verificación del email')
        suggestions.push('¿No recibiste el email? Solicita uno nuevo')
        break

      case 'RESOURCE_CONFLICT':
        if (context === 'register') {
          suggestions.push('Intenta iniciar sesión con este email')
          suggestions.push('¿Olvidaste tu contraseña? Restablécela')
        }
        break

      case 'VALIDATION_ERROR':
        suggestions.push('Revisa que todos los campos estén completos')
        suggestions.push('Asegúrate de que la contraseña cumpla los requisitos')
        break

      case 'RATE_LIMIT_EXCEEDED':
        suggestions.push('Espera unos minutos antes de intentar nuevamente')
        suggestions.push('Evita hacer múltiples intentos seguidos')
        break

      case 'ACCOUNT_LOCKED':
        suggestions.push('Espera unos minutos antes de intentar nuevamente')
        suggestions.push('Si el problema persiste, contacta soporte')
        break

      case 'NETWORK_ERROR':
        suggestions.push('Verifica tu conexión a internet')
        suggestions.push('Intenta recargar la página')
        suggestions.push('Si el problema persiste, intenta más tarde')
        break

      case 'SERVICE_UNAVAILABLE':
      case 'INTERNAL_ERROR':
        suggestions.push('Intenta nuevamente en unos minutos')
        suggestions.push('Si el problema persiste, contacta soporte')
        break

      default:
        if (error.retryable) {
          suggestions.push('Intenta nuevamente')
        }
        break
    }

    return suggestions
  }

  /**
   * Log error for monitoring (without exposing sensitive data)
   * @param {AuthError} error - AuthError instance
   * @param {string} context - Error context
   * @param {Object} metadata - Additional metadata (user_id, etc.)
   */
  static logError(error, context = '', metadata = {}) {
    // Only log non-sensitive information
    const logData = {
      code: error.code,
      status: error.status,
      context,
      timestamp: error.timestamp,
      retryable: error.retryable,
      // Only include non-sensitive metadata
      metadata: {
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        ...metadata
      }
    }

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Auth Error:', logData)
    }

    // In production, send to monitoring service
    // This would integrate with your monitoring solution
    if (import.meta.env.PROD) {
      // Example: Send to monitoring service
      // monitoringService.logError(logData)
    }
  }

  /**
   * Create user-friendly error object for UI display
   * @param {AuthError} error - AuthError instance
   * @param {string} context - Error context
   * @returns {Object} UI-friendly error object
   */
  static toUIError(error, context = '') {
    return {
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      suggestions: this.getActionSuggestions(error, context),
      shouldLogout: this.shouldLogout(error),
      shouldRedirectToVerification: this.shouldRedirectToVerification(error)
    }
  }
}

/**
 * Convenience function to handle API errors
 * @param {Error} error - Original error
 * @param {string} context - Error context
 * @returns {Object} UI-friendly error object
 */
export const handleAuthError = (error, context = '') => {
  const authError = AuthErrorHandler.handle(error, context)
  AuthErrorHandler.logError(authError, context)
  return AuthErrorHandler.toUIError(authError, context)
}

/**
 * Error codes constants for easy reference
 */
export const AUTH_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BAD_GATEWAY: 'BAD_GATEWAY',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

export default AuthErrorHandler