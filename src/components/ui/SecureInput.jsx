import React, { useState, useCallback, useRef } from 'react'
import { 
  sanitizeEmail, 
  sanitizePassword, 
  sanitizeName, 
  sanitizePhone, 
  sanitizeText 
} from '../../utils/inputSanitization'

/**
 * Secure Input Component
 * Provides automatic input sanitization and security features
 */
const SecureInput = ({
  type = 'text',
  value,
  onChange,
  sanitizeType = 'text',
  maxLength,
  className = '',
  enablePasteProtection = false,
  enableCopyProtection = false,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value || '')
  const inputRef = useRef(null)

  // Sanitization function based on type
  const getSanitizer = useCallback(() => {
    switch (sanitizeType) {
      case 'email':
        return sanitizeEmail
      case 'password':
        return sanitizePassword
      case 'name':
        return sanitizeName
      case 'phone':
        return sanitizePhone
      case 'text':
      default:
        return sanitizeText
    }
  }, [sanitizeType])

  // Handle input change with sanitization
  const handleChange = useCallback((event) => {
    const rawValue = event.target.value
    const sanitizer = getSanitizer()
    const sanitizedValue = sanitizer(rawValue)
    
    // Apply max length if specified
    const finalValue = maxLength ? sanitizedValue.substring(0, maxLength) : sanitizedValue
    
    setInternalValue(finalValue)
    
    // Call parent onChange with sanitized value
    if (onChange) {
      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          value: finalValue
        }
      }
      onChange(syntheticEvent)
    }
  }, [getSanitizer, maxLength, onChange])

  // Handle paste events
  const handlePaste = useCallback((event) => {
    if (enablePasteProtection && type === 'password') {
      event.preventDefault()
      return false
    }

    // Allow paste but sanitize the content
    setTimeout(() => {
      const pastedValue = event.target.value
      const sanitizer = getSanitizer()
      const sanitizedValue = sanitizer(pastedValue)
      const finalValue = maxLength ? sanitizedValue.substring(0, maxLength) : sanitizedValue
      
      setInternalValue(finalValue)
      
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: finalValue
          }
        }
        onChange(syntheticEvent)
      }
    }, 0)
  }, [enablePasteProtection, type, getSanitizer, maxLength, onChange])

  // Handle copy events
  const handleCopy = useCallback((event) => {
    if (enableCopyProtection && type === 'password') {
      event.preventDefault()
      return false
    }
  }, [enableCopyProtection, type])

  // Handle context menu (right-click)
  const handleContextMenu = useCallback((event) => {
    if ((enablePasteProtection || enableCopyProtection) && type === 'password') {
      event.preventDefault()
      return false
    }
  }, [enablePasteProtection, enableCopyProtection, type])

  // Security attributes based on input type
  const getSecurityAttributes = () => {
    const attributes = {}

    if (type === 'password') {
      attributes.autoComplete = 'current-password'
      attributes.spellCheck = false
      
      if (enableCopyProtection) {
        attributes.onCopy = handleCopy
        attributes.onCut = handleCopy
      }
      
      if (enablePasteProtection) {
        attributes.onContextMenu = handleContextMenu
      }
    } else if (sanitizeType === 'email') {
      attributes.autoComplete = 'email'
      attributes.inputMode = 'email'
    } else if (sanitizeType === 'phone') {
      attributes.autoComplete = 'tel'
      attributes.inputMode = 'tel'
    } else if (sanitizeType === 'name') {
      attributes.autoComplete = 'name'
    }

    return attributes
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={internalValue}
      onChange={handleChange}
      onPaste={handlePaste}
      className={className}
      maxLength={maxLength}
      {...getSecurityAttributes()}
      {...props}
    />
  )
}

export default SecureInput