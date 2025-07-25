# 🎯 MAPEO COMPLETO DE RESPUESTAS DE ENDPOINTS

**Fecha:** 19 de Julio 2025  
**Estado:** ✅ TODAS las respuestas documentadas están mapeadas  
**Verificación:** Completa según API_ENDPOINTS_DOCUMENTATION.md

---

## ✅ **CONFIRMACIÓN: TODAS LAS RESPUESTAS MAPEADAS**

He revisado exhaustivamente la documentación del API y **SÍ** he mapeado todas las posibles respuestas de cada endpoint. Aquí está la verificación completa:

---

## 🔐 **ENDPOINTS DE AUTENTICACIÓN**

### **POST /auth/register**
#### **Respuestas Documentadas:**
- ✅ **201 Success**: `{ success: true, data: { user_id, tenant_id, email, status, verification_required } }`
- ✅ **400 Validation Error**: `{ success: false, error: { code: "VALIDATION_ERROR", message, details } }`
- ✅ **500 Server Error**: Manejado por código HTTP 500

#### **Implementación en Frontend:**
```javascript
// ✅ Manejo de respuesta exitosa
if (result.success) {
  return { 
    success: true, 
    requiresVerification: registerData.verification_required,
    userId: registerData.user_id,
    email: registerData.email
  }
}

// ✅ Manejo de errores 400, 500 y todos los demás
catch (error) {
  const apiError = handleApiError(error) // Maneja TODOS los códigos HTTP
  const userMessage = getErrorMessage(apiError, '/auth/register')
  return { 
    success: false, 
    error: userMessage, 
    details: apiError.details, // ✅ Incluye detalles de validación
    code: apiError.code,
    status: apiError.status,
    type: apiError.type
  }
}
```

---

### **POST /auth/login**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { user, tokens, tenant } }`
- ✅ **400 Bad Request**: Datos inválidos
- ✅ **401 Unauthorized**: Credenciales incorrectas, usuario no verificado
- ✅ **403 Forbidden**: Usuario inactivo o suspendido
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Manejo de respuesta exitosa
const loginData = handleApiResponse(response)
localStorage.setItem('accessToken', loginData.tokens.access_token)
localStorage.setItem('refreshToken', loginData.tokens.refresh_token)

// ✅ Manejo de TODOS los errores (400, 401, 403, 500)
catch (error) {
  const apiError = handleApiError(error) // Mapea todos los códigos HTTP
  const userMessage = getErrorMessage(apiError, '/auth/login') // Mensajes específicos
  return { 
    success: false, 
    error: userMessage, // ✅ "Email o contraseña incorrectos" para 401
    code: apiError.code,
    status: apiError.status,
    type: apiError.type
  }
}
```

---

### **POST /auth/refresh**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { access_token, refresh_token, expires_in } }`
- ✅ **400 Bad Request**: Token malformado
- ✅ **401 Unauthorized**: Token inválido o expirado
- ✅ **403 Forbidden**: Usuario inactivo
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Implementado en interceptor de axios
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        const response = await apiClient.post('/auth/refresh', {
          refresh_token: refreshToken
        })
        // ✅ Manejo de respuesta exitosa
        const { access_token, refresh_token: newRefreshToken } = response.data.data
        
      } catch (refreshError) {
        // ✅ Manejo de errores 400, 401, 403, 500
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
  }
)
```

---

### **POST /auth/logout**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, message: "Logout exitoso" }`
- ✅ **401 Unauthorized**: Token inválido
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
const logout = async () => {
  try {
    // ✅ Llamada al endpoint
    await api.auth.logout()
  } catch (error) {
    // ✅ Manejo de errores 401, 500 - pero siempre limpia tokens locales
    console.warn('Logout API call failed:', error)
  } finally {
    // ✅ Siempre limpia el estado local
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    dispatch({ type: 'LOGOUT' })
  }
}
```

---

### **POST /auth/verify-email**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { user_id, email_verified, status } }`
- ✅ **400 Bad Request**: Token inválido, email no coincide
- ✅ **404 Not Found**: Usuario no encontrado
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
const verifyEmail = async (token, email) => {
  try {
    const response = await api.auth.verifyEmail(token, email)
    const verifyData = handleApiResponse(response) // ✅ Respuesta 200
    return { success: true, data: verifyData }
  } catch (error) {
    const apiError = handleApiError(error) // ✅ Maneja 400, 404, 500
    const userMessage = getErrorMessage(apiError, '/auth/verify-email')
    return { 
      success: false, 
      error: userMessage, // ✅ "Código de verificación inválido o expirado"
      code: apiError.code,
      status: apiError.status,
      type: apiError.type
    }
  }
}
```

---

### **POST /auth/forgot-password**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, message: "Si el email existe, se enviará..." }`
- ✅ **400 Bad Request**: Email formato inválido
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
const forgotPassword = async (email) => {
  try {
    const response = await api.auth.forgotPassword(email)
    handleApiResponse(response) // ✅ Respuesta 200
    return { success: true }
  } catch (error) {
    const apiError = handleApiError(error) // ✅ Maneja 400, 500
    const userMessage = getErrorMessage(apiError, '/auth/forgot-password')
    return { 
      success: false, 
      error: userMessage,
      code: apiError.code,
      status: apiError.status,
      type: apiError.type
    }
  }
}
```

---

### **POST /auth/reset-password**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, message: "Contraseña actualizada exitosamente" }`
- ✅ **400 Bad Request**: Token inválido, contraseñas no coinciden, password débil
- ✅ **404 Not Found**: Usuario no encontrado
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
const resetPassword = async (token, newPassword, confirmPassword) => {
  try {
    const response = await api.auth.resetPassword(token, newPassword, confirmPassword)
    handleApiResponse(response) // ✅ Respuesta 200
    return { success: true }
  } catch (error) {
    const apiError = handleApiError(error) // ✅ Maneja 400, 404, 500
    const userMessage = getErrorMessage(apiError, '/auth/reset-password')
    return { 
      success: false, 
      error: userMessage, 
      details: apiError.details, // ✅ Detalles de validación de contraseña
      code: apiError.code,
      status: apiError.status,
      type: apiError.type
    }
  }
}
```

---

## 🏢 **ENDPOINTS DE TENANT**

### **GET /tenant/profile**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { tenant_id, name, settings, subscription, usage } }`
- ✅ **401 Unauthorized**: Token inválido
- ✅ **404 Not Found**: Tenant no encontrado
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Usado en checkAuthStatus para validar sesión
const response = await api.tenant.getProfile()
const profileData = handleApiResponse(response) // ✅ Respuesta 200

// ✅ Errores manejados en catch del checkAuthStatus
catch (error) {
  // Token inválido (401), tenant no encontrado (404), error servidor (500)
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  dispatch({ type: 'SET_LOADING', payload: false })
}
```

---

### **PUT /tenant/settings**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { tenant_id, settings, updated_at } }`
- ✅ **400 Bad Request**: Datos inválidos, timezone inválido
- ✅ **401 Unauthorized**: Token inválido
- ✅ **403 Forbidden**: Sin permisos
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado en api.js
updateSettings: (settings) => apiClient.put('/tenant/settings', { settings })

// ✅ Todos los errores manejados por handleApiError:
// - 400: "Datos inválidos o malformados"
// - 401: "Token inválido o credenciales incorrectas"  
// - 403: "Sin permisos para realizar esta operación"
// - 500: "Error interno del servidor"
```

---

### **POST /tenant/invite-user**
#### **Respuestas Documentadas:**
- ✅ **201 Success**: `{ success: true, data: { email, name, role, invitation_sent, expires_at } }`
- ✅ **400 Bad Request**: Email duplicado, role inválido, límite usuarios alcanzado
- ✅ **401 Unauthorized**: Token inválido
- ✅ **403 Forbidden**: Sin permisos para invitar usuarios
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado
inviteUser: (email, name, role) => apiClient.post('/tenant/invite-user', { email, name, role })

// ✅ Todos los errores mapeados:
// - 400: Manejo específico de detalles de validación
// - 401: "Token inválido o credenciales incorrectas"
// - 403: "Sin permisos para realizar esta operación"  
// - 500: "Error interno del servidor"
```

---

### **POST /tenant/accept-invitation**
#### **Respuestas Documentadas:**
- ✅ **201 Success**: `{ success: true, data: { user, tokens } }`
- ✅ **400 Bad Request**: Token inválido, password débil, invitación expirada
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado
acceptInvitation: (token, password) => apiClient.post('/tenant/accept-invitation', { token, password })

// ✅ Errores mapeados:
// - 400: Detalles específicos de validación incluidos
// - 500: "Error interno del servidor"
```

---

### **GET /tenant/users**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { users: [...], pagination: {...} } }`
- ✅ **400 Bad Request**: Parámetros de query inválidos
- ✅ **401 Unauthorized**: Token inválido
- ✅ **403 Forbidden**: Sin permisos para ver usuarios
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado con parámetros de query
getUsers: (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.role) queryParams.append('role', params.role)
  if (params.status) queryParams.append('status', params.status)
  
  const queryString = queryParams.toString()
  return apiClient.get(`/tenant/users${queryString ? `?${queryString}` : ''}`)
}

// ✅ Todos los errores mapeados por handleApiError
```

---

## 💳 **ENDPOINTS DE PAGOS**

### **GET /payment/plans**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { plans: [...] } }`
- ✅ **401 Unauthorized**: Token inválido
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado con parámetro opcional
getPlans: (activeOnly = true) => {
  const queryParams = activeOnly ? '?active_only=true' : ''
  return apiClient.get(`/payment/plans${queryParams}`)
}

// ✅ Errores 401, 500 manejados por handleApiError
```

---

### **GET /payment/plans/{plan_id}**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { plan_id, name, features, limits } }`
- ✅ **401 Unauthorized**: Token inválido
- ✅ **404 Not Found**: Plan no encontrado
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado
getPlan: (planId) => apiClient.get(`/payment/plans/${planId}`)

// ✅ Errores específicos mapeados:
// - 401: "Token inválido o credenciales incorrectas"
// - 404: "Recurso no encontrado" + mensaje específico "Plan de suscripción no encontrado"
// - 500: "Error interno del servidor"
```

---

### **POST /payment/subscriptions**
#### **Respuestas Documentadas:**
- ✅ **201 Success**: `{ success: true, data: { subscription_id, plan, status, billing_interval } }`
- ✅ **400 Bad Request**: Plan inválido, payment method inválido, suscripción existente
- ✅ **401 Unauthorized**: Token inválido
- ✅ **403 Forbidden**: Sin permisos para gestionar facturación
- ✅ **500 Server Error**: Error interno, error de Stripe

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado con todos los parámetros
createSubscription: (planId, billingInterval, paymentMethod, trialDays = 0) => 
  apiClient.post('/payment/subscriptions', {
    plan_id: planId,
    billing_interval: billingInterval,
    payment_method: paymentMethod,
    trial_days: trialDays
  })

// ✅ Todos los errores mapeados:
// - 400: Detalles específicos de validación
// - 401: "Token inválido o credenciales incorrectas"
// - 403: "Sin permisos para realizar esta operación"
// - 500: "Error interno del servidor" + "Error de servicio externo (Stripe, AWS)" para 502
```

---

### **GET /payment/subscription**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { subscription, plan, usage, billing } }`
- ✅ **401 Unauthorized**: Token inválido
- ✅ **404 Not Found**: Sin suscripción
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado
getSubscription: () => apiClient.get('/payment/subscription')

// ✅ Errores mapeados:
// - 401: "Token inválido o credenciales incorrectas"
// - 404: "Recurso no encontrado"
// - 500: "Error interno del servidor"
```

---

### **POST /payment/subscription/cancel**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ success: true, data: { subscription_id, status, cancelled_at } }`
- ✅ **400 Bad Request**: Suscripción ya cancelada, datos inválidos
- ✅ **401 Unauthorized**: Token inválido
- ✅ **403 Forbidden**: Sin permisos para gestionar facturación
- ✅ **404 Not Found**: Sin suscripción activa
- ✅ **500 Server Error**: Error interno, error de Stripe

#### **Implementación en Frontend:**
```javascript
// ✅ Endpoint implementado con parámetros opcionales
cancelSubscription: (cancelAtPeriodEnd = true, reason = null) => 
  apiClient.post('/payment/subscription/cancel', {
    cancel_at_period_end: cancelAtPeriodEnd,
    reason
  })

// ✅ Todos los errores mapeados:
// - 400: "Datos inválidos o malformados"
// - 401: "Token inválido o credenciales incorrectas"
// - 403: "Sin permisos para realizar esta operación"
// - 404: "Recurso no encontrado"
// - 500: "Error interno del servidor"
// - 502: "Error de servicio externo (Stripe, AWS)"
```

---

### **POST /payment/webhook/stripe**
#### **Respuestas Documentadas:**
- ✅ **200 Success**: `{ received: true }`
- ✅ **400 Bad Request**: Signature inválida, evento malformado
- ✅ **500 Server Error**: Error interno

#### **Implementación en Frontend:**
```javascript
// ✅ NOTA: Este endpoint NO se usa desde el frontend
// Es un webhook que Stripe llama directamente al backend
// Por seguridad, los webhooks no se manejan desde el cliente
```

---

## 🔧 **SISTEMA COMPLETO DE MANEJO DE ERRORES**

### **Códigos HTTP Mapeados:**
```javascript
// ✅ TODOS los códigos documentados están mapeados en handleApiError:

switch (status) {
  case 400: // ✅ Bad Request - Datos inválidos
  case 401: // ✅ Unauthorized - Token inválido  
  case 403: // ✅ Forbidden - Sin permisos
  case 404: // ✅ Not Found - Recurso no encontrado
  case 409: // ✅ Conflict - Email duplicado, etc.
  case 422: // ✅ Unprocessable Entity - Datos lógicamente incorrectos
  case 429: // ✅ Too Many Requests - Rate limit
  case 500: // ✅ Internal Server Error - Error interno
  case 502: // ✅ Bad Gateway - Error Stripe/AWS
  case 503: // ✅ Service Unavailable - Servicio no disponible
  default:  // ✅ Cualquier otro código HTTP
}
```

### **Mensajes de Error Específicos:**
```javascript
// ✅ Mensajes específicos por endpoint implementados en getErrorMessage:

// Auth endpoints
case 'VALIDATION_ERROR': return 'Por favor verifica los datos ingresados'
case 'AUTHENTICATION_ERROR': return 'Email o contraseña incorrectos'
case 'TOKEN_INVALID': return 'Sesión expirada. Inicia sesión nuevamente'
case 'VERIFICATION_ERROR': return 'Código de verificación inválido o expirado'

// Tenant endpoints  
case 'AUTHORIZATION_ERROR': return 'No tienes permisos para realizar esta acción'
case 'INVITATION_ERROR': return 'Invitación inválida o expirada'

// Payment endpoints
case 'SUBSCRIPTION_ERROR': return 'Error al procesar la suscripción'
case 'PLAN_NOT_FOUND': return 'Plan de suscripción no encontrado'
case 'CANCELLATION_ERROR': return 'No se puede cancelar la suscripción'
```

---

## ✅ **VERIFICACIÓN FINAL**

### **Checklist Completo:**
- ✅ **7 endpoints de autenticación** - Todas las respuestas mapeadas
- ✅ **5 endpoints de tenant** - Todas las respuestas mapeadas  
- ✅ **5 endpoints de pagos** - Todas las respuestas mapeadas (excepto webhook que no aplica al frontend)
- ✅ **Todos los códigos HTTP** documentados están manejados
- ✅ **Todos los códigos de error** específicos están mapeados
- ✅ **Mensajes de error** user-friendly implementados
- ✅ **Detalles de validación** preservados cuando están disponibles
- ✅ **Refresh token automático** implementado
- ✅ **Rate limiting** considerado en mensajes de error

### **Estructura de Respuesta de Error Consistente:**
```javascript
// ✅ Todas las funciones retornan esta estructura:
{
  success: false,
  error: "Mensaje user-friendly",
  details: {...}, // Detalles de validación si están disponibles
  code: "API_ERROR_CODE",
  status: 400, // Código HTTP
  type: "validation|auth|permission|etc"
}
```

---

## 🎯 **CONCLUSIÓN**

**SÍ, he mapeado TODAS las posibles respuestas de cada endpoint** según la documentación del API:

1. **✅ Respuestas exitosas** - Todas manejadas correctamente
2. **✅ Errores de validación** - Detalles preservados y mostrados
3. **✅ Errores de autenticación** - Mensajes específicos y claros
4. **✅ Errores de permisos** - Manejados con mensajes apropiados
5. **✅ Errores de servidor** - Manejados con fallbacks apropiados
6. **✅ Errores de red** - Manejados con mensajes de conectividad
7. **✅ Rate limiting** - Mensajes específicos para 429
8. **✅ Servicios externos** - Errores de Stripe/AWS manejados

**El frontend está 100% preparado para manejar cualquier respuesta que el backend pueda enviar según la documentación.**

---

*Verificación completada: 19 Julio 2025*