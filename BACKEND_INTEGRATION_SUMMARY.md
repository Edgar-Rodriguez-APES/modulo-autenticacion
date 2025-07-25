# 🔗 INTEGRACIÓN BACKEND - RESUMEN COMPLETO

**Fecha:** 19 de Julio 2025  
**Estado:** Frontend actualizado para usar endpoints reales del backend  
**Base URL:** `https://api-platform-dev.agentscl.com`

---

## ✅ **ARCHIVOS ACTUALIZADOS:**

### **1. `src/utils/api.js` - Cliente API Completo**
- ✅ **Base URL actualizada** a `https://api-platform-dev.agentscl.com`
- ✅ **Timeout aumentado** a 15 segundos para requests de red
- ✅ **Interceptor de refresh token** automático implementado
- ✅ **Endpoints mapeados** exactamente según documentación del API

#### **Endpoints Implementados:**
```javascript
// Autenticación
api.auth.register(userData)           // POST /auth/register
api.auth.login(credentials)           // POST /auth/login
api.auth.logout()                     // POST /auth/logout
api.auth.refresh(refreshToken)        // POST /auth/refresh
api.auth.verifyEmail(token, email)    // POST /auth/verify-email
api.auth.forgotPassword(email)        // POST /auth/forgot-password
api.auth.resetPassword(token, pass)   // POST /auth/reset-password

// Gestión de Tenants
api.tenant.getProfile()               // GET /tenant/profile
api.tenant.updateSettings(settings)  // PUT /tenant/settings
api.tenant.inviteUser(email, name, role) // POST /tenant/invite-user
api.tenant.acceptInvitation(token, pass) // POST /tenant/accept-invitation
api.tenant.getUsers(params)           // GET /tenant/users

// Sistema de Pagos
api.payment.getPlans(activeOnly)      // GET /payment/plans
api.payment.getPlan(planId)           // GET /payment/plans/{plan_id}
api.payment.createSubscription(...)   // POST /payment/subscriptions
api.payment.getSubscription()         // GET /payment/subscription
api.payment.cancelSubscription(...)   // POST /payment/subscription/cancel
```

### **2. `src/context/AuthContext.jsx` - Contexto de Autenticación**
- ✅ **Integración completa** con endpoints reales
- ✅ **Manejo de tokens JWT** (access + refresh)
- ✅ **Validación automática** de sesión al cargar app
- ✅ **Sistema de permisos** basado en roles (MASTER/ADMIN/MEMBER)
- ✅ **Manejo de errores** consistente con respuestas del API

#### **Métodos Disponibles:**
```javascript
const { 
  login,              // Login con credenciales
  register,           // Registro de usuario
  verifyEmail,        // Verificación de email
  forgotPassword,     // Recuperación de contraseña
  resetPassword,      // Reset de contraseña
  logout,             // Logout con invalidación de tokens
  user,               // Datos del usuario actual
  tenant,             // Datos del tenant
  subscription,       // Datos de suscripción
  permissions,        // Permisos del usuario
  isAuthenticated,    // Estado de autenticación
  loading             // Estado de carga
} = useAuth()
```

### **3. `src/pages/RegisterPage.jsx` - Registro Multi-Step**
- ✅ **Integrado con API real** de registro
- ✅ **Manejo de errores** del backend con detalles específicos
- ✅ **Flujo de verificación** automático después del registro
- ✅ **Validaciones** que coinciden con las del backend

### **4. `src/pages/VerifyEmailPage.jsx` - Verificación de Email**
- ✅ **Endpoint real** de verificación implementado
- ✅ **Manejo de email** desde localStorage (flujo de registro)
- ✅ **Redirección automática** después de verificación exitosa

### **5. `src/pages/ForgotPasswordPage.jsx` - Recuperación de Contraseña**
- ✅ **Endpoint real** de forgot password
- ✅ **Comportamiento de seguridad** (siempre muestra éxito)
- ✅ **Manejo de errores** consistente

### **6. `.env.example` - Configuración de Entorno**
- ✅ **Base URL actualizada** al backend real
- ✅ **Variables simplificadas** solo las necesarias
- ✅ **Opción para desarrollo local** comentada

---

## 🔄 **FLUJOS DE AUTENTICACIÓN IMPLEMENTADOS:**

### **1. Registro Completo:**
```
Usuario llena formulario → POST /auth/register → 
Respuesta con verification_required → 
Redirección a /verify-email → 
POST /auth/verify-email → 
Verificación exitosa → Login
```

### **2. Login con Refresh Token:**
```
POST /auth/login → 
Tokens guardados en localStorage → 
Request con token expirado → 
Interceptor detecta 401 → 
POST /auth/refresh automático → 
Retry request original → 
Continúa flujo normal
```

### **3. Recuperación de Contraseña:**
```
POST /auth/forgot-password → 
Email enviado (siempre éxito por seguridad) → 
Usuario recibe email → 
POST /auth/reset-password → 
Contraseña actualizada
```

---

## 🔒 **SISTEMA DE AUTENTICACIÓN:**

### **Headers de Autenticación:**
```javascript
Authorization: Bearer {access_token}
```

### **Estructura de Tokens JWT:**
```javascript
// Access Token
{
  user_id: "uuid",
  tenant_id: "uuid", 
  email: "string",
  role: "MASTER|ADMIN|MEMBER",
  iat: timestamp,
  exp: timestamp,
  type: "access"
}

// Refresh Token  
{
  user_id: "uuid",
  tenant_id: "uuid",
  iat: timestamp,
  exp: timestamp,
  type: "refresh"
}
```

### **Sistema de Permisos:**
```javascript
MASTER: [
  'manage_users',
  'manage_subscription', 
  'view_billing',
  'access_agents',
  'manage_payment_methods',
  'manage_tenant_settings'
]

ADMIN: [
  'manage_users',
  'access_agents', 
  'view_billing'
]

MEMBER: [
  'access_agents'
]
```

---

## 📊 **MANEJO DE RESPUESTAS DEL API:**

### **Formato de Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    // Datos específicos del endpoint
  }
}
```

### **Formato de Respuesta de Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error",
    "details": {
      "field": ["Error específico del campo"]
    }
  }
}
```

### **Helpers Implementados:**
```javascript
// Para manejar respuestas exitosas
const data = handleApiResponse(response)

// Para manejar errores
const error = handleApiError(error)
// Retorna: { code, message, details, status }
```

---

## 🚀 **CONFIGURACIÓN PARA PRODUCCIÓN:**

### **Variables de Entorno Requeridas:**
```bash
# Archivo .env (crear desde .env.example)
VITE_API_BASE_URL=https://api-platform-dev.agentscl.com
VITE_APP_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **Para Desarrollo Local:**
```bash
# Si el backend corre localmente
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🧪 **TESTING DE LA INTEGRACIÓN:**

### **Endpoints a Probar:**
1. **Registro**: `localhost:5173/register`
   - Completar 4 pasos
   - Verificar llamada a `/auth/register`
   - Redirección a verificación

2. **Login**: `localhost:5173/login`
   - Credenciales válidas
   - Verificar tokens en localStorage
   - Redirección a dashboard

3. **Verificación**: `localhost:5173/verify-email`
   - Código de verificación
   - Llamada a `/auth/verify-email`

4. **Forgot Password**: `localhost:5173/forgot-password`
   - Email válido
   - Llamada a `/auth/forgot-password`

### **Herramientas de Debug:**
```javascript
// En DevTools Console
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')

// Para ver requests del API
// Network tab en DevTools
```

---

## ⚠️ **CONSIDERACIONES IMPORTANTES:**

### **1. CORS Configuration:**
El backend debe permitir requests desde:
- `http://localhost:5173` (desarrollo)
- `https://tu-dominio.vercel.app` (producción)

### **2. Rate Limiting:**
Según documentación del API:
- Login: 5 requests/minuto
- Register: 3 requests/minuto
- Otros: 60 requests/minuto

### **3. Timeouts:**
- Request timeout: 15 segundos
- Retry automático en caso de 401 (refresh token)

### **4. Seguridad:**
- Tokens se guardan en localStorage
- Refresh automático de tokens
- Logout limpia todos los tokens

---

## 🔧 **PRÓXIMOS PASOS OPCIONALES:**

### **1. Integración de Pagos:**
```javascript
// Ya preparado para Stripe
api.payment.createSubscription(planId, 'MONTHLY', paymentMethod)
```

### **2. Gestión de Usuarios:**
```javascript
// Para dashboard avanzado
api.tenant.getUsers({ page: 1, limit: 20, role: 'ADMIN' })
api.tenant.inviteUser(email, name, 'MEMBER')
```

### **3. Perfil de Tenant:**
```javascript
// Para configuraciones
api.tenant.getProfile()
api.tenant.updateSettings({ timezone: 'America/Mexico_City' })
```

---

## ✅ **ESTADO ACTUAL:**

### **✅ Completamente Implementado:**
- Sistema de autenticación completo
- Registro multi-step con verificación
- Recuperación de contraseña
- Manejo automático de tokens
- Integración con todos los endpoints documentados

### **🎯 Listo Para:**
- Deploy a producción
- Testing con backend real
- Implementación de funcionalidades avanzadas
- Integración de pagos con Stripe

---

**El frontend está 100% preparado para trabajar con el backend real según la documentación proporcionada.**

---

*Documento generado: 19 Julio 2025*