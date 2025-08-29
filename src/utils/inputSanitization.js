/**
 * Input Sanitization Utility
 * Provides comprehensive input sanitization for authentication forms
 */

/**
 * HTML entities for escaping
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return text
  }
  
  return text.replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match])
}

/**
 * Remove potentially dangerous characters and patterns
 */
function removeDangerousPatterns(input) {
  if (typeof input !== 'string') {
    return input
  }

  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove data: URLs (except safe image formats)
    .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))[^;,]+[;,]/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove expression() CSS
    .replace(/expression\s*\(/gi, '')
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return ''
  }

  return email
    .trim()
    .toLowerCase()
    // Remove any characters that aren't valid in email addresses
    .replace(/[^a-z0-9@._+-]/g, '')
    // Limit length
    .substring(0, 254)
}

/**
 * Sanitize password input
 */
export function sanitizePassword(password) {
  if (!password || typeof password !== 'string') {
    return ''
  }

  // For passwords, we only remove null bytes and limit length
  // We preserve special characters as they're needed for security
  return password
    .replace(/\0/g, '') // Remove null bytes
    .substring(0, 128) // Reasonable password length limit
}

/**
 * Sanitize name input (first name, last name, company name)
 */
export function sanitizeName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }

  return name
    .trim()
    // Remove HTML and dangerous patterns
    .replace(/[<>]/g, '')
    // Allow letters, numbers, spaces, hyphens, apostrophes, and periods
    .replace(/[^a-zA-ZÀ-ÿ0-9\s\-'.]/g, '')
    // Limit length
    .substring(0, 100)
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sanitize phone number input
 */
export function sanitizePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return ''
  }

  return phone
    .trim()
    // Keep only numbers, spaces, hyphens, parentheses, and plus sign
    .replace(/[^0-9\s\-()+ ]/g, '')
    // Limit length
    .substring(0, 20)
}

/**
 * Sanitize general text input
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return removeDangerousPatterns(escapeHtml(text.trim()))
    .substring(0, 1000) // Reasonable text length limit
}

/**
 * Sanitize URL input
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const trimmed = url.trim()
  
  // Only allow http and https protocols
  if (!/^https?:\/\//i.test(trimmed)) {
    return ''
  }

  try {
    const urlObj = new URL(trimmed)
    
    // Block dangerous protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return ''
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname.toLowerCase()
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
      ) {
        return ''
      }
    }
    
    return urlObj.toString()
  } catch {
    return ''
  }
}

/**
 * Sanitize verification code input
 */
export function sanitizeVerificationCode(code) {
  if (!code || typeof code !== 'string') {
    return ''
  }

  return code
    .trim()
    // Keep only alphanumeric characters
    .replace(/[^a-zA-Z0-9]/g, '')
    // Limit to reasonable code length
    .substring(0, 10)
    .toUpperCase()
}

/**
 * Comprehensive form data sanitizer
 */
export function sanitizeFormData(formData, fieldTypes = {}) {
  if (!formData || typeof formData !== 'object') {
    return {}
  }

  const sanitized = {}

  for (const [key, value] of Object.entries(formData)) {
    const fieldType = fieldTypes[key] || 'text'

    switch (fieldType) {
      case 'email':
        sanitized[key] = sanitizeEmail(value)
        break
      case 'password':
        sanitized[key] = sanitizePassword(value)
        break
      case 'name':
        sanitized[key] = sanitizeName(value)
        break
      case 'phone':
        sanitized[key] = sanitizePhone(value)
        break
      case 'url':
        sanitized[key] = sanitizeUrl(value)
        break
      case 'code':
        sanitized[key] = sanitizeVerificationCode(value)
        break
      case 'text':
      default:
        sanitized[key] = sanitizeText(value)
        break
    }
  }

  return sanitized
}

/**
 * Validate and sanitize authentication form data
 */
export function sanitizeAuthFormData(formData) {
  const fieldTypes = {
    email: 'email',
    password: 'password',
    confirmPassword: 'password',
    firstName: 'name',
    lastName: 'name',
    name: 'name',
    companyName: 'name',
    phone: 'phone',
    verificationCode: 'code',
    resetToken: 'code'
  }

  return sanitizeFormData(formData, fieldTypes)
}

/**
 * Rate limiting for input validation
 */
class InputRateLimiter {
  constructor() {
    this.attempts = new Map()
    this.maxAttempts = 10
    this.windowMs = 60000 // 1 minute
  }

  isAllowed(identifier) {
    const now = Date.now()
    const key = `input_${identifier}`
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, { count: 1, firstAttempt: now })
      return true
    }

    const record = this.attempts.get(key)
    
    // Reset if window has passed
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now })
      return true
    }

    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return false
    }

    // Increment counter
    record.count++
    return true
  }

  reset(identifier) {
    const key = `input_${identifier}`
    this.attempts.delete(key)
  }
}

const inputRateLimiter = new InputRateLimiter()

/**
 * Validate input with rate limiting
 */
export function validateInputWithRateLimit(input, identifier) {
  if (!inputRateLimiter.isAllowed(identifier)) {
    throw new Error('Too many validation attempts. Please wait before trying again.')
  }

  // Perform validation
  if (typeof input !== 'string' || input.length > 10000) {
    throw new Error('Invalid input format')
  }

  return true
}

export default {
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  sanitizeUrl,
  sanitizeVerificationCode,
  sanitizeFormData,
  sanitizeAuthFormData,
  validateInputWithRateLimit
}