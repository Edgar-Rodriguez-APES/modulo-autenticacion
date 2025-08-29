/**
 * Security Headers Middleware
 * Implements comprehensive security headers for the application
 */

import { config } from './config'

/**
 * Content Security Policy configuration
 */
export function generateCSP() {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "'unsafe-eval'", // Required for development tools
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      config.auth.baseURL,
      config.tenant.baseURL,
      'https://api.stripe.com',
      'https://checkout.stripe.com',
      'wss://localhost:*', // WebSocket for development
      'ws://localhost:*'   // WebSocket for development
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com'
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': config.security.httpsOnly ? [] : null
  }

  // Remove null directives
  Object.keys(directives).forEach(key => {
    if (directives[key] === null) {
      delete directives[key]
    }
  })

  // Convert to CSP string
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

/**
 * Permissions Policy configuration
 */
export function generatePermissionsPolicy() {
  const policies = {
    'camera': '()',
    'microphone': '()',
    'geolocation': '()',
    'payment': '(self)',
    'usb': '()',
    'magnetometer': '()',
    'gyroscope': '()',
    'accelerometer': '()',
    'ambient-light-sensor': '()',
    'autoplay': '()',
    'encrypted-media': '()',
    'fullscreen': '(self)',
    'picture-in-picture': '()'
  }

  return Object.entries(policies)
    .map(([feature, allowlist]) => `${feature}=${allowlist}`)
    .join(', ')
}

/**
 * Get all security headers
 */
export function getSecurityHeaders() {
  const headers = {
    // Content Security Policy
    'Content-Security-Policy': generateCSP(),
    
    // Permissions Policy
    'Permissions-Policy': generatePermissionsPolicy(),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }

  // Add HSTS in production with HTTPS
  if (config.security.httpsOnly && config.app.env === 'production') {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}

/**
 * Apply security headers to HTML document
 */
export function applySecurityHeaders() {
  if (typeof document === 'undefined') {
    return
  }

  const headers = getSecurityHeaders()
  
  // Apply CSP via meta tag (fallback)
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  if (!existingCSP) {
    const cspMeta = document.createElement('meta')
    cspMeta.httpEquiv = 'Content-Security-Policy'
    cspMeta.content = headers['Content-Security-Policy']
    document.head.appendChild(cspMeta)
  }

  // Apply other security meta tags
  const securityMetas = [
    { httpEquiv: 'X-Content-Type-Options', content: headers['X-Content-Type-Options'] },
    { httpEquiv: 'X-Frame-Options', content: headers['X-Frame-Options'] },
    { httpEquiv: 'X-XSS-Protection', content: headers['X-XSS-Protection'] },
    { httpEquiv: 'Referrer-Policy', content: headers['Referrer-Policy'] }
  ]

  securityMetas.forEach(({ httpEquiv, content }) => {
    const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`)
    if (!existing) {
      const meta = document.createElement('meta')
      meta.httpEquiv = httpEquiv
      meta.content = content
      document.head.appendChild(meta)
    }
  })
}

/**
 * Validate security headers in responses
 */
export function validateResponseHeaders(headers) {
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ]

  const missing = requiredHeaders.filter(header => !headers[header])
  
  if (missing.length > 0) {
    console.warn('Missing security headers:', missing)
  }

  return missing.length === 0
}

/**
 * Security headers middleware for development server
 */
export function securityHeadersMiddleware(req, res, next) {
  const headers = getSecurityHeaders()
  
  Object.entries(headers).forEach(([name, value]) => {
    res.setHeader(name, value)
  })
  
  next()
}

/**
 * Initialize security headers
 */
export function initializeSecurityHeaders() {
  // Apply headers to document
  applySecurityHeaders()
  
  // Log security status in development
  if (config.app.debugLogs) {
    console.group('🔒 Security Headers Applied')
    const headers = getSecurityHeaders()
    Object.entries(headers).forEach(([name, value]) => {
      console.log(`${name}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
    })
    console.groupEnd()
  }
}

export default {
  generateCSP,
  generatePermissionsPolicy,
  getSecurityHeaders,
  applySecurityHeaders,
  validateResponseHeaders,
  securityHeadersMiddleware,
  initializeSecurityHeaders
}