import React, { useState, useEffect } from 'react'
import Button from './Button'

/**
 * Rate limit handler component that shows countdown and retry options
 */
const RateLimitHandler = ({ 
  error, 
  onRetry, 
  onDismiss,
  initialDelay = 30000, // 30 seconds default
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.ceil(initialDelay / 1000))
  const [canRetry, setCanRetry] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanRetry(true)
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleRetry = async () => {
    if (!onRetry || !canRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  if (!error || error.code !== 'RATE_LIMIT_EXCEEDED') return null

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Límite de intentos alcanzado
          </h3>
          <p className="text-xs text-yellow-700 mt-1">
            {canRetry 
              ? 'Ya puedes intentar nuevamente.'
              : `Espera ${formatTime(timeLeft)} antes de intentar nuevamente.`
            }
          </p>
          
          <div className="mt-2 text-xs text-yellow-600">
            <p>• Evita hacer múltiples intentos seguidos</p>
            <p>• Si el problema persiste, contacta soporte</p>
          </div>
          
          <div className="mt-3 flex gap-2">
            {canRetry && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                loading={isRetrying}
                disabled={isRetrying}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs"
              >
                {isRetrying ? 'Reintentando...' : 'Reintentar'}
              </Button>
            )}
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs"
              >
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RateLimitHandler