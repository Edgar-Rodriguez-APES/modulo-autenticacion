import React from 'react'
import clsx from 'clsx'

/**
 * Enhanced Loading Spinner Component
 * Provides accessible loading indicators with different sizes and styles
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Cargando...',
  showLabel = false,
  inline = false,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600'
  }

  const containerClasses = clsx(
    'flex items-center justify-center',
    {
      'inline-flex': inline,
      'flex-col space-y-2': showLabel && !inline,
      'space-x-2': showLabel && inline
    },
    className
  )

  const spinnerClasses = clsx(
    'animate-spin',
    sizeClasses[size],
    variantClasses[variant]
  )

  return (
    <div className={containerClasses} {...props}>
      <svg
        className={spinnerClasses}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label}
        aria-hidden={!showLabel}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {showLabel && (
        <span 
          className={clsx(
            'text-sm font-medium',
            variantClasses[variant]
          )}
          aria-live="polite"
        >
          {label}
        </span>
      )}
      
      {/* Screen reader only text */}
      <span className="sr-only">{label}</span>
    </div>
  )
}

/**
 * Skeleton Loading Component
 * Shows placeholder content while loading
 */
export const SkeletonLoader = ({
  lines = 3,
  className = '',
  animate = true
}) => {
  return (
    <div className={clsx('space-y-3', className)} role="status" aria-label="Cargando contenido">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'h-4 bg-gray-200 rounded',
            {
              'animate-pulse': animate,
              'w-full': index === 0,
              'w-4/5': index === 1,
              'w-3/5': index === 2
            }
          )}
        />
      ))}
      <span className="sr-only">Cargando contenido, por favor espera</span>
    </div>
  )
}

/**
 * Dots Loading Animation
 * Simple dots animation for inline loading
 */
export const DotsLoader = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const variantClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    white: 'bg-white',
    gray: 'bg-gray-600'
  }

  const dotClasses = clsx(
    'rounded-full',
    sizeClasses[size],
    variantClasses[variant]
  )

  return (
    <div 
      className={clsx('flex space-x-1', className)}
      role="status"
      aria-label="Cargando"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={clsx(
            dotClasses,
            'animate-bounce'
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
      <span className="sr-only">Cargando</span>
    </div>
  )
}

export default LoadingSpinner