import React, { useState, useEffect } from 'react'
import clsx from 'clsx'

/**
 * Success Animation Component
 * Provides animated success feedback with accessibility support
 */
const SuccessAnimation = ({
  size = 'md',
  variant = 'success',
  message = '¡Éxito!',
  showMessage = true,
  autoHide = false,
  autoHideDelay = 3000,
  onComplete,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [animationComplete, setAnimationComplete] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const variantClasses = {
    success: 'text-green-600 bg-green-100',
    primary: 'text-primary-600 bg-primary-100',
    info: 'text-blue-600 bg-blue-100'
  }

  useEffect(() => {
    // Mark animation as complete after animation duration
    const timer = setTimeout(() => {
      setAnimationComplete(true)
      if (onComplete) {
        onComplete()
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [onComplete])

  useEffect(() => {
    if (autoHide && animationComplete) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, autoHideDelay)

      return () => clearTimeout(hideTimer)
    }
  }, [autoHide, autoHideDelay, animationComplete])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center space-y-3 p-4',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      {/* Animated Checkmark */}
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center',
          'animate-bounce-in',
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        <svg
          className="w-1/2 h-1/2 animate-draw-check"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
            className="animate-draw-path"
          />
        </svg>
      </div>

      {/* Success Message */}
      {showMessage && (
        <div
          className={clsx(
            'text-center animate-fade-in-up',
            'animation-delay-300'
          )}
        >
          <p className="text-lg font-semibold text-gray-900">
            {message}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Confetti Animation Component
 * Celebratory animation for major successes
 */
export const ConfettiAnimation = ({
  duration = 3000,
  colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
  particleCount = 50,
  className = ''
}) => {
  const [particles, setParticles] = useState([])
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: particleCount }, (_, index) => ({
      id: index,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      delay: Math.random() * 1000
    }))

    setParticles(newParticles)

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, colors, particleCount])

  if (!isActive) {
    return null
  }

  return (
    <div
      className={clsx(
        'fixed inset-0 pointer-events-none z-50 overflow-hidden',
        className
      )}
      role="presentation"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${duration}ms`
          }}
        />
      ))}
    </div>
  )
}

/**
 * Progress Success Animation
 * Shows progress completion with animation
 */
export const ProgressSuccess = ({
  steps = [],
  currentStep = 0,
  className = ''
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        
        return (
          <div
            key={index}
            className={clsx(
              'flex items-center space-x-3 p-3 rounded-lg transition-all duration-300',
              {
                'bg-green-50 border border-green-200': isCompleted,
                'bg-blue-50 border border-blue-200': isCurrent,
                'bg-gray-50 border border-gray-200': !isCompleted && !isCurrent
              }
            )}
          >
            {/* Step Icon */}
            <div
              className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                {
                  'bg-green-600 text-white animate-bounce-in': isCompleted,
                  'bg-blue-600 text-white animate-pulse': isCurrent,
                  'bg-gray-300 text-gray-600': !isCompleted && !isCurrent
                }
              )}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1">
              <h4
                className={clsx(
                  'font-medium transition-colors duration-300',
                  {
                    'text-green-800': isCompleted,
                    'text-blue-800': isCurrent,
                    'text-gray-600': !isCompleted && !isCurrent
                  }
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p
                  className={clsx(
                    'text-sm transition-colors duration-300',
                    {
                      'text-green-600': isCompleted,
                      'text-blue-600': isCurrent,
                      'text-gray-500': !isCompleted && !isCurrent
                    }
                  )}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SuccessAnimation