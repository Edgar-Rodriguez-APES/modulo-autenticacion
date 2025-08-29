/**
 * Security Audit Utility
 * Performs comprehensive security checks and audits
 */

import { config } from './config'
import { validateResponseHeaders } from './securityHeaders'

class SecurityAuditor {
  constructor() {
    this.auditResults = []
    this.securityScore = 0
  }

  /**
   * Perform comprehensive security audit
   */
  async performAudit() {
    this.auditResults = []
    this.securityScore = 0

    console.group('🔍 Security Audit Starting...')

    // Environment configuration audit
    await this.auditEnvironmentConfig()
    
    // Token storage audit
    await this.auditTokenStorage()
    
    // HTTPS enforcement audit
    await this.auditHTTPSEnforcement()
    
    // CSRF protection audit
    await this.auditCSRFProtection()
    
    // Input sanitization audit
    await this.auditInputSanitization()
    
    // Security headers audit
    await this.auditSecurityHeaders()
    
    // Browser security features audit
    await this.auditBrowserSecurity()

    // Calculate final score
    this.calculateSecurityScore()

    console.groupEnd()
    
    return {
      score: this.securityScore,
      results: this.auditResults,
      recommendations: this.getRecommendations()
    }
  }

  /**
   * Audit environment configuration
   */
  async auditEnvironmentConfig() {
    const checks = [
      {
        name: 'Production Environment Detection',
        check: () => config.app.env === 'production',
        severity: 'medium',
        description: 'Application should be running in production mode'
      },
      {
        name: 'Debug Mode Disabled',
        check: () => !config.app.debugLogs || config.app.env !== 'production',
        severity: 'high',
        description: 'Debug logs should be disabled in production'
      },
      {
        name: 'HTTPS URLs Configuration',
        check: () => config.auth.baseURL.startsWith('https://') && config.tenant.baseURL.startsWith('https://'),
        severity: 'critical',
        description: 'All API URLs should use HTTPS'
      }
    ]

    this.runChecks('Environment Configuration', checks)
  }

  /**
   * Audit token storage security
   */
  async auditTokenStorage() {
    const checks = [
      {
        name: 'Secure Storage Type',
        check: () => ['localStorage', 'sessionStorage'].includes(config.security.tokenStorageType),
        severity: 'medium',
        description: 'Token storage type should be configured'
      },
      {
        name: 'Encryption Support',
        check: () => typeof window !== 'undefined' && window.crypto && window.crypto.subtle,
        severity: 'high',
        description: 'Browser should support Web Crypto API for token encryption'
      },
      {
        name: 'IndexedDB Support',
        check: () => typeof window !== 'undefined' && window.indexedDB,
        severity: 'medium',
        description: 'Browser should support IndexedDB for secure key storage'
      }
    ]

    this.runChecks('Token Storage Security', checks)
  }

  /**
   * Audit HTTPS enforcement
   */
  async auditHTTPSEnforcement() {
    const checks = [
      {
        name: 'HTTPS Only Configuration',
        check: () => config.security.httpsOnly,
        severity: 'critical',
        description: 'HTTPS should be enforced'
      },
      {
        name: 'Secure Context',
        check: () => typeof window === 'undefined' || window.isSecureContext,
        severity: 'critical',
        description: 'Application should run in secure context (HTTPS)'
      },
      {
        name: 'Mixed Content Protection',
        check: () => typeof window === 'undefined' || window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        severity: 'high',
        description: 'No mixed content should be loaded'
      }
    ]

    this.runChecks('HTTPS Enforcement', checks)
  }

  /**
   * Audit CSRF protection
   */
  async auditCSRFProtection() {
    const checks = [
      {
        name: 'CSRF Protection Enabled',
        check: () => config.security.csrfProtection,
        severity: 'high',
        description: 'CSRF protection should be enabled'
      },
      {
        name: 'SameSite Cookie Support',
        check: () => this.checkSameSiteCookieSupport(),
        severity: 'medium',
        description: 'Browser should support SameSite cookies'
      },
      {
        name: 'Origin Validation',
        check: () => typeof window === 'undefined' || this.validateCurrentOrigin(),
        severity: 'high',
        description: 'Current origin should be in allowed list'
      }
    ]

    this.runChecks('CSRF Protection', checks)
  }

  /**
   * Audit input sanitization
   */
  async auditInputSanitization() {
    const checks = [
      {
        name: 'Input Sanitization Available',
        check: () => {
          try {
            const { sanitizeAuthFormData } = require('../utils/inputSanitization')
            return typeof sanitizeAuthFormData === 'function'
          } catch {
            return false
          }
        },
        severity: 'high',
        description: 'Input sanitization functions should be available'
      },
      {
        name: 'XSS Protection',
        check: () => this.checkXSSProtection(),
        severity: 'critical',
        description: 'XSS protection should be implemented'
      }
    ]

    this.runChecks('Input Sanitization', checks)
  }

  /**
   * Audit security headers
   */
  async auditSecurityHeaders() {
    const checks = [
      {
        name: 'Content Security Policy',
        check: () => this.checkCSPHeader(),
        severity: 'critical',
        description: 'Content Security Policy should be implemented'
      },
      {
        name: 'X-Frame-Options',
        check: () => this.checkFrameOptions(),
        severity: 'high',
        description: 'X-Frame-Options should prevent clickjacking'
      },
      {
        name: 'X-Content-Type-Options',
        check: () => this.checkContentTypeOptions(),
        severity: 'medium',
        description: 'X-Content-Type-Options should prevent MIME sniffing'
      }
    ]

    this.runChecks('Security Headers', checks)
  }

  /**
   * Audit browser security features
   */
  async auditBrowserSecurity() {
    const checks = [
      {
        name: 'Secure Random Generation',
        check: () => typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function',
        severity: 'critical',
        description: 'Secure random number generation should be available'
      },
      {
        name: 'Subresource Integrity Support',
        check: () => typeof window === 'undefined' || 'integrity' in document.createElement('script'),
        severity: 'medium',
        description: 'Browser should support Subresource Integrity'
      },
      {
        name: 'Content Security Policy Support',
        check: () => typeof window === 'undefined' || this.checkCSPSupport(),
        severity: 'high',
        description: 'Browser should support Content Security Policy'
      }
    ]

    this.runChecks('Browser Security Features', checks)
  }

  /**
   * Run a set of security checks
   */
  runChecks(category, checks) {
    console.group(`🔍 ${category}`)
    
    checks.forEach(check => {
      const passed = check.check()
      const result = {
        category,
        name: check.name,
        passed,
        severity: check.severity,
        description: check.description
      }
      
      this.auditResults.push(result)
      
      const icon = passed ? '✅' : '❌'
      const severityColor = this.getSeverityColor(check.severity)
      console.log(`${icon} ${check.name} ${severityColor}[${check.severity.toUpperCase()}]`)
      
      if (!passed) {
        console.warn(`   ${check.description}`)
      }
    })
    
    console.groupEnd()
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore() {
    const weights = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5
    }

    let totalPossible = 0
    let totalAchieved = 0

    this.auditResults.forEach(result => {
      const weight = weights[result.severity] || 5
      totalPossible += weight
      if (result.passed) {
        totalAchieved += weight
      }
    })

    this.securityScore = Math.round((totalAchieved / totalPossible) * 100)
    
    const scoreColor = this.securityScore >= 80 ? '🟢' : this.securityScore >= 60 ? '🟡' : '🔴'
    console.log(`${scoreColor} Security Score: ${this.securityScore}/100`)
  }

  /**
   * Get security recommendations
   */
  getRecommendations() {
    const failed = this.auditResults.filter(result => !result.passed)
    
    return failed.map(result => ({
      priority: result.severity,
      issue: result.name,
      recommendation: result.description,
      category: result.category
    })).sort((a, b) => {
      const priorities = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorities[b.priority] - priorities[a.priority]
    })
  }

  /**
   * Helper methods for specific checks
   */
  checkSameSiteCookieSupport() {
    try {
      document.cookie = 'test=1; SameSite=Strict'
      return true
    } catch {
      return false
    }
  }

  validateCurrentOrigin() {
    if (typeof window === 'undefined') return true
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://main.d3lhcnp00fedic.amplifyapp.com'
    ]
    
    return allowedOrigins.includes(window.location.origin)
  }

  checkXSSProtection() {
    // Check if basic XSS protection is in place
    const testString = '<script>alert("xss")</script>'
    const { sanitizeText } = require('../utils/inputSanitization')
    const sanitized = sanitizeText(testString)
    return !sanitized.includes('<script>')
  }

  checkCSPHeader() {
    if (typeof document === 'undefined') return true
    
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    return !!cspMeta
  }

  checkFrameOptions() {
    if (typeof document === 'undefined') return true
    
    const frameOptionsMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]')
    return !!frameOptionsMeta
  }

  checkContentTypeOptions() {
    if (typeof document === 'undefined') return true
    
    const contentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]')
    return !!contentTypeMeta
  }

  checkCSPSupport() {
    return 'SecurityPolicyViolationEvent' in window
  }

  getSeverityColor(severity) {
    const colors = {
      critical: '\x1b[31m', // Red
      high: '\x1b[33m',     // Yellow
      medium: '\x1b[36m',   // Cyan
      low: '\x1b[32m'       // Green
    }
    return colors[severity] || ''
  }
}

// Create singleton instance
const securityAuditor = new SecurityAuditor()

/**
 * Perform security audit
 */
export async function performSecurityAudit() {
  return await securityAuditor.performAudit()
}

/**
 * Quick security check
 */
export function quickSecurityCheck() {
  const issues = []
  
  // Check critical security settings
  if (!config.security.httpsOnly && config.app.env === 'production') {
    issues.push('HTTPS not enforced in production')
  }
  
  if (typeof window !== 'undefined' && !window.isSecureContext && config.app.env === 'production') {
    issues.push('Not running in secure context')
  }
  
  if (!config.security.csrfProtection) {
    issues.push('CSRF protection disabled')
  }
  
  return {
    secure: issues.length === 0,
    issues
  }
}

export default securityAuditor