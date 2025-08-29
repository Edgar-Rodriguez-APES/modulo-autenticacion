/**
 * Password Validation Utility
 * Provides comprehensive password validation matching Auth Service requirements
 */

// Password requirements configuration
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// Password strength levels
export const PASSWORD_STRENGTH = {
  VERY_WEAK: 0,
  WEAK: 1,
  FAIR: 2,
  GOOD: 3,
  STRONG: 4,
  VERY_STRONG: 5
}

// Password strength labels for UI
export const PASSWORD_STRENGTH_LABELS = {
  [PASSWORD_STRENGTH.VERY_WEAK]: 'Muy débil',
  [PASSWORD_STRENGTH.WEAK]: 'Débil',
  [PASSWORD_STRENGTH.FAIR]: 'Regular',
  [PASSWORD_STRENGTH.GOOD]: 'Buena',
  [PASSWORD_STRENGTH.STRONG]: 'Fuerte',
  [PASSWORD_STRENGTH.VERY_STRONG]: 'Muy fuerte'
}

// Password strength colors for UI
export const PASSWORD_STRENGTH_COLORS = {
  [PASSWORD_STRENGTH.VERY_WEAK]: '#ef4444', // red-500
  [PASSWORD_STRENGTH.WEAK]: '#f97316', // orange-500
  [PASSWORD_STRENGTH.FAIR]: '#eab308', // yellow-500
  [PASSWORD_STRENGTH.GOOD]: '#22c55e', // green-500
  [PASSWORD_STRENGTH.STRONG]: '#16a34a', // green-600
  [PASSWORD_STRENGTH.VERY_STRONG]: '#15803d' // green-700
}

/**
 * Validate password against Auth Service requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with errors and suggestions
 */
export const validatePassword = (password) => {
  const errors = []
  const suggestions = []
  
  if (!password) {
    errors.push('La contraseña es requerida')
    return { isValid: false, errors, suggestions }
  }

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`)
    suggestions.push('Agrega más caracteres a tu contraseña')
  }

  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`La contraseña no puede tener más de ${PASSWORD_REQUIREMENTS.maxLength} caracteres`)
    suggestions.push('Reduce la longitud de tu contraseña')
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
    suggestions.push('Incluye al menos una letra mayúscula (A-Z)')
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
    suggestions.push('Incluye al menos una letra minúscula (a-z)')
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
    suggestions.push('Incluye al menos un número (0-9)')
  }

  // Check for special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[\\]\\\\^-]/g, '\\\\$&')}]`)
    if (!specialCharRegex.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial')
      suggestions.push(`Incluye al menos un carácter especial (${PASSWORD_REQUIREMENTS.specialChars})`)
    }
  }

  // Check for common weak patterns
  const weakPatterns = [
    { pattern: /123456|654321|abcdef|qwerty/i, message: 'Evita secuencias comunes como "123456" o "qwerty"' },
    { pattern: /password|contraseña/i, message: 'No uses la palabra "password" o "contraseña"' },
    { pattern: /^(.)\\1+$/, message: 'No uses el mismo carácter repetido' },
    { pattern: /^\\d+$/, message: 'No uses solo números' },
    { pattern: /^[a-zA-Z]+$/, message: 'No uses solo letras' }
  ]

  weakPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(password)) {
      errors.push(message)
    }
  })

  const isValid = errors.length === 0

  return {
    isValid,
    errors,
    suggestions: isValid ? [] : suggestions,
    strength: calculatePasswordStrength(password),
    requirements: getRequirementStatus(password)
  }
}

/**
 * Calculate password strength score
 * @param {string} password - Password to analyze
 * @returns {number} Strength score (0-5)
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return PASSWORD_STRENGTH.VERY_WEAK

  let score = 0
  const checks = {
    length: password.length >= PASSWORD_REQUIREMENTS.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\\d/.test(password),
    specialChars: new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[\\]\\\\^-]/g, '\\\\$&')}]`).test(password),
    longLength: password.length >= 12,
    veryLongLength: password.length >= 16,
    mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
    multipleNumbers: (password.match(/\\d/g) || []).length >= 2,
    multipleSpecialChars: (password.match(new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[\\]\\\\^-]/g, '\\\\$&')}]`, 'g')) || []).length >= 2
  }

  // Basic requirements (each worth 1 point)
  if (checks.length) score++
  if (checks.uppercase) score++
  if (checks.lowercase) score++
  if (checks.numbers) score++
  if (checks.specialChars) score++

  // Bonus points for stronger passwords
  if (checks.longLength) score += 0.5
  if (checks.veryLongLength) score += 0.5
  if (checks.mixedCase) score += 0.5
  if (checks.multipleNumbers) score += 0.5
  if (checks.multipleSpecialChars) score += 0.5

  // Penalty for common patterns
  const commonPatterns = [
    /123456|654321|abcdef|qwerty/i,
    /password|contraseña/i,
    /^(.)\\1+$/,
    /^\\d+$/,
    /^[a-zA-Z]+$/
  ]

  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      score -= 1
    }
  })

  // Ensure score is within bounds
  score = Math.max(0, Math.min(5, Math.floor(score)))

  return score
}

/**
 * Get detailed requirement status for UI feedback
 * @param {string} password - Password to check
 * @returns {Object} Status of each requirement
 */
export const getRequirementStatus = (password) => {
  if (!password) {
    return {
      minLength: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      specialChars: false
    }
  }

  return {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\\d/.test(password),
    specialChars: new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[\\]\\\\^-]/g, '\\\\$&')}]`).test(password)
  }
}

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Object} Validation result
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  const errors = []

  if (!confirmPassword) {
    errors.push('Por favor confirma tu contraseña')
  } else if (password !== confirmPassword) {
    errors.push('Las contraseñas no coinciden')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate password strength indicator data for UI
 * @param {string} password - Password to analyze
 * @returns {Object} UI data for strength indicator
 */
export const getPasswordStrengthIndicator = (password) => {
  const strength = calculatePasswordStrength(password)
  const percentage = (strength / PASSWORD_STRENGTH.VERY_STRONG) * 100

  return {
    strength,
    percentage,
    label: PASSWORD_STRENGTH_LABELS[strength],
    color: PASSWORD_STRENGTH_COLORS[strength],
    showIndicator: password && password.length > 0
  }
}

/**
 * Get password requirements list for UI display
 * @param {string} password - Current password (optional)
 * @returns {Array} Array of requirement objects
 */
export const getPasswordRequirementsList = (password = '') => {
  const status = getRequirementStatus(password)

  return [
    {
      text: `Al menos ${PASSWORD_REQUIREMENTS.minLength} caracteres`,
      met: status.minLength,
      required: true
    },
    {
      text: 'Una letra mayúscula (A-Z)',
      met: status.uppercase,
      required: PASSWORD_REQUIREMENTS.requireUppercase
    },
    {
      text: 'Una letra minúscula (a-z)',
      met: status.lowercase,
      required: PASSWORD_REQUIREMENTS.requireLowercase
    },
    {
      text: 'Un número (0-9)',
      met: status.numbers,
      required: PASSWORD_REQUIREMENTS.requireNumbers
    },
    {
      text: `Un carácter especial (${PASSWORD_REQUIREMENTS.specialChars})`,
      met: status.specialChars,
      required: PASSWORD_REQUIREMENTS.requireSpecialChars
    }
  ].filter(req => req.required)
}

/**
 * Real-time password validation for forms
 * @param {string} password - Password to validate
 * @param {string} confirmPassword - Confirmation password (optional)
 * @returns {Object} Complete validation result for forms
 */
export const validatePasswordRealTime = (password, confirmPassword = null) => {
  const passwordValidation = validatePassword(password)
  const strengthIndicator = getPasswordStrengthIndicator(password)
  const requirements = getPasswordRequirementsList(password)
  
  let confirmationValidation = null
  if (confirmPassword !== null) {
    confirmationValidation = validatePasswordConfirmation(password, confirmPassword)
  }

  return {
    password: passwordValidation,
    confirmation: confirmationValidation,
    strength: strengthIndicator,
    requirements,
    isFormValid: passwordValidation.isValid && (confirmationValidation ? confirmationValidation.isValid : true)
  }
}

/**
 * Generate a secure password suggestion
 * @param {number} length - Desired password length (default: 12)
 * @returns {string} Generated secure password
 */
export const generateSecurePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specialChars = PASSWORD_REQUIREMENTS.specialChars

  let password = ''
  
  // Ensure at least one character from each required category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += specialChars[Math.floor(Math.random() * specialChars.length)]

  // Fill the rest with random characters from all categories
  const allChars = uppercase + lowercase + numbers + specialChars
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check if password has been compromised (basic check)
 * @param {string} password - Password to check
 * @returns {boolean} True if password appears to be compromised
 */
export const isPasswordCompromised = (password) => {
  // List of most common compromised passwords
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345', '1234567',
    'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome',
    'monkey', '1234567890', 'dragon', 'master', 'hello', 'freedom',
    'whatever', 'qazwsx', 'trustno1', 'jordan23', 'harley', 'robert'
  ]

  return commonPasswords.includes(password.toLowerCase())
}

export default {
  validatePassword,
  validatePasswordConfirmation,
  validatePasswordRealTime,
  calculatePasswordStrength,
  getPasswordStrengthIndicator,
  getPasswordRequirementsList,
  generateSecurePassword,
  isPasswordCompromised,
  PASSWORD_STRENGTH,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS
}