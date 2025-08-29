import React, { useEffect, useRef } from 'react'
import clsx from 'clsx'

/**
 * Screen Reader Announcer Component
 * Announces important messages to screen readers
 */
export const ScreenReaderAnnouncer = ({ message, priority = 'polite', className = '' }) => {
  const announcerRef = useRef(null)

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear and set message to trigger announcement
      announcerRef.current.textContent = ''
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
        }
      }, 100)
    }
  }, [message])

  return (
    <div
      ref={announcerRef}
      className={clsx('sr-only', className)}
      aria-live={priority}
      aria-atomic="true"
      role="status"
    />
  )
}

/**
 * Focus Trap Component
 * Traps focus within a component (useful for modals, forms)
 */
export const FocusTrap = ({ children, active = true, className = '' }) => {
  const containerRef = useRef(null)
  const firstFocusableRef = useRef(null)
  const lastFocusableRef = useRef(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0]
    lastFocusableRef.current = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Focus first element when trap becomes active
    firstFocusableRef.current?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [active])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 */
export const SkipLink = ({ href = '#main-content', children = 'Saltar al contenido principal' }) => {
  return (
    <a
      href={href}
      className={clsx(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-primary-600 text-white px-4 py-2 rounded-md z-50',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      )}
    >
      {children}
    </a>
  )
}

/**
 * Enhanced Form Field Component
 * Provides comprehensive accessibility for form fields
 */
export const AccessibleFormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  autoComplete,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`
  const errorId = `${fieldId}-error`
  const helperId = `${fieldId}-helper`

  return (
    <div className={clsx('space-y-2', className)}>
      {/* Label */}
      <label
        htmlFor={fieldId}
        className={clsx(
          'block text-sm font-medium text-gray-700',
          {
            'text-gray-400': disabled,
            'after:content-["*"] after:text-red-500 after:ml-1': required
          }
        )}
      >
        {label}
      </label>

      {/* Input */}
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={clsx({
          [errorId]: !!error,
          [helperId]: !!helperText
        })}
        className={clsx(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          {
            'border-red-300 focus:ring-red-500 focus:border-red-500': error,
            'pr-10': error // Space for error icon
          },
          inputClassName
        )}
        {...props}
      />

      {/* Error Message */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center text-sm text-red-600"
        >
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Progress Indicator Component
 * Accessible progress indicator for multi-step forms
 */
export const AccessibleProgress = ({
  steps,
  currentStep,
  className = '',
  showLabels = true
}) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={clsx('space-y-4', className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
          <div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Screen reader progress announcement */}
        <ScreenReaderAnnouncer
          message={`Paso ${currentStep + 1} de ${steps.length}: ${steps[currentStep]?.title || ''}`}
          priority="polite"
        />
      </div>

      {/* Step Labels */}
      {showLabels && (
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={clsx(
                'text-xs font-medium',
                {
                  'text-primary-600': index <= currentStep,
                  'text-gray-400': index > currentStep
                }
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Loading State Announcer
 * Announces loading states to screen readers
 */
export const LoadingAnnouncer = ({ isLoading, loadingMessage = 'Cargando', completedMessage = 'Carga completada' }) => {
  return (
    <ScreenReaderAnnouncer
      message={isLoading ? loadingMessage : completedMessage}
      priority="assertive"
    />
  )
}

/**
 * Error Recovery Component
 * Provides accessible error recovery guidance
 */
export const AccessibleErrorRecovery = ({
  error,
  onRetry,
  onDismiss,
  recoverySteps = [],
  className = ''
}) => {
  if (!error) return null

  return (
    <div
      className={clsx(
        'bg-red-50 border border-red-200 rounded-md p-4',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Error en la operación
          </h3>
          
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            
            {recoverySteps.length > 0 && (
              <div className="mt-3">
                <p className="font-medium">Pasos para resolver:</p>
                <ol className="mt-1 list-decimal list-inside space-y-1">
                  {recoverySteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={clsx(
                  'bg-red-600 text-white px-3 py-2 text-sm font-medium rounded-md',
                  'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                )}
              >
                Reintentar
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={clsx(
                  'bg-white text-red-600 px-3 py-2 text-sm font-medium rounded-md border border-red-300',
                  'hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                )}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default {
  ScreenReaderAnnouncer,
  FocusTrap,
  SkipLink,
  AccessibleFormField,
  AccessibleProgress,
  LoadingAnnouncer,
  AccessibleErrorRecovery
}