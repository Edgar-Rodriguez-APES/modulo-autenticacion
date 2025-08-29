import React from 'react'
import Button from './Button'

/**
 * Error boundary component to catch and handle unexpected errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to monitoring service
    if (import.meta.env.PROD) {
      console.error('Error Boundary caught an error:', error, errorInfo)
      // Here you would send to your error monitoring service
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Algo salió mal
              </h3>
              
              <p className="text-sm text-slate-600 mb-6">
                Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado automáticamente.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  Intentar nuevamente
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  Recargar página
                </Button>
                
                <button
                  onClick={() => window.open('mailto:soporte@technoagentes.com', '_blank')}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  Contactar soporte
                </button>
              </div>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-slate-500 cursor-pointer">
                    Detalles del error (desarrollo)
                  </summary>
                  <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary