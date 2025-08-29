import React, { useState, useEffect } from 'react'
import { sanitizeAuthFormData, validateInputWithRateLimit } from '../../utils/inputSanitization'
import { csrfProtection } from '../../utils/csrfProtection'

/**
 * Secure Form Component
 * Provides automatic input sanitization and CSRF protection
 */
const SecureForm = ({ 
  children, 
  onSubmit, 
  className = '',
  enableRateLimit = true,
  sanitizeInputs = true,
  ...props 
}) => {
  const [csrfToken, setCsrfToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Get CSRF token on mount
    const token = csrfProtection.getToken()
    if (token) {
      setCsrfToken(token)
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)

    try {
      // Rate limiting check
      if (enableRateLimit) {
        const identifier = `form_${window.location.pathname}_${Date.now()}`
        validateInputWithRateLimit('form_submission', identifier)
      }

      // Get form data
      const formData = new FormData(event.target)
      let data = Object.fromEntries(formData.entries())

      // Sanitize inputs if enabled
      if (sanitizeInputs) {
        data = sanitizeAuthFormData(data)
      }

      // Add CSRF token
      if (csrfToken) {
        data._csrf = csrfToken
      }

      // Call the provided onSubmit handler
      await onSubmit(data, event)

    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className={className}
      autoComplete="on"
      noValidate
      {...props}
    >
      {/* CSRF Token Hidden Field */}
      {csrfToken && (
        <input 
          type="hidden" 
          name="_csrf" 
          value={csrfToken}
          readOnly
        />
      )}
      
      {/* Honeypot field for bot detection */}
      <input
        type="text"
        name="website"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        tabIndex="-1"
        autoComplete="off"
        aria-hidden="true"
      />
      
      {children}
    </form>
  )
}

export default SecureForm