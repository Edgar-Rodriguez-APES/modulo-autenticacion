# Guía de Manejo de Errores de Autenticación

Esta guía explica cómo usar el sistema completo de manejo de errores implementado para las páginas de autenticación.

## Componentes Disponibles

### 1. Hook `useAuthError`

El hook principal para manejar errores de autenticación con funcionalidades avanzadas.

```javascript
import { useAuthError } from '../hooks/useAuthError'

const { 
  error,           // Error actual procesado
  handleError,     // Función para procesar errores
  clearError,      // Función para limpiar errores
  retryOperation,  // Función para reintentar operaciones
  isRetrying,      // Estado de reintento
  canRetry         // Si se puede reintentar
} = useAuthError('login') // Contexto de la página
```

### 2. Componente `ErrorDisplay`

Muestra errores con iconos, mensajes y botones de acción apropiados.

```javascript
<ErrorDisplay 
  error={error}
  onRetry={canRetry ? handleRetry : null}
  onDismiss={clearError}
  showRetry={true}
  showSuggestions={true}
  className="mb-4"
/>
```

### 3. Componente `NetworkStatus`

Detecta y maneja problemas de conectividad de red.

```javascript
<NetworkStatus onRetry={handleRetry} className="mb-4" />
```

### 4. Componente `RateLimitHandler`

Maneja errores de límite de velocidad con contador regresivo.

```javascript
<RateLimitHandler 
  error={error} 
  onRetry={handleRetry}
  onDismiss={clearError}
  initialDelay={30000} // 30 segundos
  className="mb-4"
/>
```

### 5. Componente `ErrorRecovery`

Proporciona opciones de recuperación contextual basadas en el tipo de error.

```javascript
<ErrorRecovery 
  error={error}
  context="login" // Contexto para acciones específicas
  onRetry={canRetry ? handleRetry : null}
  onDismiss={clearError}
  className="mt-4"
/>
```

## Patrón de Implementación

### Estructura Básica de una Página de Autenticación

```javascript
import React, { useState } from 'react'
import { useAuthError } from '../hooks/useAuthError'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import NetworkStatus from '../components/ui/NetworkStatus'
import RateLimitHandler from '../components/ui/RateLimitHandler'
import ErrorRecovery from '../components/ui/ErrorRecovery'

const AuthPage = () => {
  const { 
    error, 
    handleError, 
    clearError, 
    retryOperation, 
    isRetrying,
    canRetry 
  } = useAuthError('page-context')
  
  const [loading, setLoading] = useState(false)

  // Función que realiza la operación principal
  const performOperation = async () => {
    const result = await someAuthOperation()
    
    if (result.success) {
      // Manejar éxito
      return result
    } else {
      // Crear error para el handler
      const error = new Error(result.error)
      error.response = {
        status: result.status || 400,
        data: { error: { code: result.code, message: result.error } }
      }
      throw error
    }
  }

  // Handler del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    clearError()
    
    try {
      await performOperation()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  // Handler de reintento
  const handleRetry = async () => {
    await retryOperation(performOperation)
  }

  return (
    <div className="auth-page">
      <Card>
        {/* Componentes de manejo de errores */}
        <NetworkStatus onRetry={handleRetry} className="mb-4" />
        
        <RateLimitHandler 
          error={error} 
          onRetry={handleRetry}
          onDismiss={clearError}
          className="mb-4"
        />
        
        <ErrorDisplay 
          error={error}
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
          className="mb-4"
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Campos del formulario */}
          
          <Button
            type="submit"
            loading={loading || isRetrying}
            disabled={loading || isRetrying}
          >
            Enviar
          </Button>
        </form>

        {/* Recuperación de errores */}
        <ErrorRecovery 
          error={error}
          context="page-context"
          onRetry={canRetry ? handleRetry : null}
          onDismiss={clearError}
          className="mt-4"
        />
      </Card>
    </div>
  )
}
```

## Tipos de Errores Soportados

### Errores de Red
- **NETWORK_ERROR**: Problemas de conectividad
- **SERVICE_UNAVAILABLE**: Servicio no disponible
- **TIMEOUT_ERROR**: Tiempo de espera agotado

### Errores de Autenticación
- **INVALID_CREDENTIALS**: Credenciales inválidas
- **EMAIL_NOT_VERIFIED**: Email no verificado
- **ACCOUNT_LOCKED**: Cuenta bloqueada
- **AUTHENTICATION_ERROR**: Error de autenticación general

### Errores de Validación
- **VALIDATION_ERROR**: Errores de validación de campos
- **RESOURCE_CONFLICT**: Conflicto de recursos (ej: email ya existe)
- **INVALID_TOKEN**: Token inválido o expirado

### Errores de Límites
- **RATE_LIMIT_EXCEEDED**: Límite de velocidad excedido

### Errores del Servidor
- **INTERNAL_ERROR**: Error interno del servidor
- **BAD_GATEWAY**: Error de gateway

## Características Avanzadas

### Reintento Automático con Backoff Exponencial

```javascript
const handleRetry = async () => {
  await retryOperation(performOperation, 3) // Máximo 3 intentos
}
```

### Manejo de Errores Contextual

El sistema proporciona diferentes opciones de recuperación basadas en el contexto:

- **Login**: Enlaces a recuperación de contraseña y registro
- **Register**: Enlaces a login y verificación de email
- **Forgot Password**: Enlaces a login y soporte
- **Reset Password**: Enlaces a solicitar nuevo token
- **Verify Email**: Opciones para reenviar código

### Sugerencias Automáticas

Los errores incluyen sugerencias automáticas para ayudar al usuario:

```javascript
// Ejemplo de error con sugerencias
{
  code: 'NETWORK_ERROR',
  message: 'Problema de conexión detectado',
  suggestions: [
    'Verifica tu conexión a internet',
    'Intenta recargar la página',
    'Contacta soporte si el problema persiste'
  ],
  retryable: true
}
```

### Logging y Monitoreo

Los errores se registran automáticamente para monitoreo, protegiendo la privacidad del usuario:

```javascript
// Los errores se registran sin información sensible
console.error('Auth Error:', {
  code: error.code,
  context: 'login',
  timestamp: new Date().toISOString(),
  // No se incluyen datos del usuario
})
```

## Mejores Prácticas

### 1. Siempre Usar el Hook
```javascript
// ✅ Correcto
const { error, handleError, clearError } = useAuthError('login')

// ❌ Incorrecto - manejar errores manualmente
const [error, setError] = useState(null)
```

### 2. Limpiar Errores en Cambios
```javascript
const handleInputChange = (e) => {
  setFormData(e.target.value)
  
  // Limpiar errores cuando el usuario hace cambios
  if (error) {
    clearError()
  }
}
```

### 3. Proporcionar Contexto Apropiado
```javascript
// ✅ Correcto - contexto específico
useAuthError('login')
useAuthError('register')
useAuthError('forgot-password')

// ❌ Incorrecto - contexto genérico
useAuthError('auth')
```

### 4. Manejar Estados de Carga
```javascript
<Button
  type="submit"
  loading={loading || isRetrying}
  disabled={loading || isRetrying}
>
  {loading || isRetrying ? 'Procesando...' : 'Enviar'}
</Button>
```

### 5. Orden de Componentes de Error
```javascript
// Orden recomendado para mejor UX
<NetworkStatus />           {/* Primero - problemas de red */}
<RateLimitHandler />        {/* Segundo - límites de velocidad */}
<ErrorDisplay />            {/* Tercero - errores generales */}
{/* Formulario aquí */}
<ErrorRecovery />           {/* Último - opciones de recuperación */}
```

## Personalización

### Mensajes de Error Personalizados

```javascript
// En src/utils/authErrors.js
const CUSTOM_ERROR_MESSAGES = {
  'CUSTOM_ERROR_CODE': 'Mensaje personalizado para tu aplicación'
}
```

### Estilos Personalizados

```javascript
<ErrorDisplay 
  error={error}
  className="my-custom-error-styles"
/>
```

### Acciones de Recuperación Personalizadas

```javascript
<ErrorRecovery 
  error={error}
  context="custom-context"
  customActions={[
    {
      type: 'button',
      text: 'Acción Personalizada',
      onClick: handleCustomAction
    }
  ]}
/>
```

## Ejemplo Completo

Ver `src/components/examples/ComprehensiveErrorHandlingExample.jsx` para un ejemplo completo que demuestra todos los componentes trabajando juntos.

## Troubleshooting

### Error No Se Muestra
- Verificar que `error` no sea `null`
- Asegurar que `handleError()` se llame en el catch
- Revisar que los componentes estén importados correctamente

### Reintento No Funciona
- Verificar que `error.retryable` sea `true`
- Asegurar que la función de operación esté definida correctamente
- Revisar que `canRetry` sea `true`

### Estilos No Se Aplican
- Verificar que Tailwind CSS esté configurado
- Asegurar que las clases CSS estén disponibles
- Revisar la especificidad de CSS personalizado

Este sistema de manejo de errores proporciona una experiencia de usuario consistente y robusta para todas las operaciones de autenticación.