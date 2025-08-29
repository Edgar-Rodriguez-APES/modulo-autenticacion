import React, { useState, useEffect } from 'react'
import Button from './Button'

/**
 * Network status component that monitors connectivity and provides retry options
 */
const NetworkStatus = ({ onRetry, className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    if (!onRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  if (!showOfflineMessage) return null

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            {isOnline ? 'Conexión restaurada' : 'Sin conexión a internet'}
          </h3>
          <p className="text-xs text-orange-700 mt-1">
            {isOnline 
              ? 'Tu conexión se ha restaurado. Puedes continuar.'
              : 'Verifica tu conexión a internet e intenta nuevamente.'
            }
          </p>
          
          {isOnline && onRetry && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                loading={isRetrying}
                disabled={isRetrying}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs"
              >
                {isRetrying ? 'Reintentando...' : 'Continuar'}
              </Button>
            </div>
          )}
        </div>
        
        {isOnline && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowOfflineMessage(false)}
              className="text-orange-400 hover:text-orange-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NetworkStatus