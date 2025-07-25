# 📚 DOCUMENTACIÓN TÉCNICA DE ENDPOINTS - API COMPLETA

**Fecha:** 19 de Julio, 2025  
**Estado:** Documentación de sistema 100% funcional  
**Base URL:** `https://api-platform-dev.agentscl.com` (cuando se despliegue)

---

## 📋 **ÍNDICE DE ENDPOINTS**

### **Autenticación**
- [POST /auth/register](#post-authregister)
- [POST /auth/login](#post-authlogin)
- [POST /auth/refresh](#post-authrefresh)
- [POST /auth/logout](#post-authlogout)
- [POST /auth/verify-email](#post-authverify-email)
- [POST /auth/forgot-password](#post-authforgot-password)
- [POST /auth/reset-password](#post-authreset-password)

### **Gestión de Tenants**
- [GET /tenant/profile](#get-tenantprofile)
- [PUT /tenant/settings](#put-tenantsettings)
- [POST /tenant/invite-user](#post-tenantinvite-user)
- [POST /tenant/accept-invitation](#post-tenantaccept-invitation)
- [GET /tenant/users](#get-tenantusers)

### **Sistema de Pagos**
- [GET /payment/plans](#get-paymentplans)
- [GET /payment/plans/{plan_id}](#get-paymentplansplan_id)
- [POST /payment/subscriptions](#post-paymentsubscriptions)
- [GET /payment/subscription](#get-paymentsubscription)
- [POST /payment/subscription/cancel](#post-paymentsubscriptioncancel)
- [POST /payment/webhook/stripe](#post-paymentwebhookstripe)

---

## 🔐 AUTENTICACIÓN

### POST /auth/register

**Descripción:** Registra un nuevo usuario y crea un tenant asociado.

**Handler:** `src/auth/handlers/register.py`

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "string (required, email format)",
  "password": "string (required, min 8 chars, must include uppercase, lowercase, number, special char)",
  "name": "string (required, max 100 chars)",
  "tenant_name": "string (required, max 100 chars, unique)"
}
```

**Validaciones:**
- Email: Formato válido, único en el sistema
- Password: Mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial
- Name: No vacío, máximo 100 caracteres
- Tenant name: Único, máximo 100 caracteres

**Response Success (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user_id": "uuid",
    "tenant_id": "uuid", 
    "email": "string",
    "status": "pending_verification",
    "verification_required": true
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": {
      "email": ["Email ya registrado"],
      "password": ["Password no cumple requisitos de seguridad"]
    }
  }
}
```

**Errores Posibles:**
- 400: Datos inválidos, email duplicado, password débil
- 500: Error interno del servidor

---

### POST /auth/login

**Descripción:** Autentica un usuario y retorna tokens de acceso.

**Handler:** `src/auth/handlers/login.py`

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string (required, email format)",
  "password": "string (required)"
}
```

**Validaciones:**
- Email: Formato válido
- Password: No vacío
- Usuario debe estar verificado y activo

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "user_id": "uuid",
      "tenant_id": "uuid",
      "email": "string",
      "name": "string",
      "role": "MASTER|ADMIN|MEMBER",
      "status": "active"
    },
    "tokens": {
      "access_token": "jwt_string",
      "refresh_token": "jwt_string", 
      "expires_in": 3600,
      "token_type": "Bearer"
    },
    "tenant": {
      "tenant_id": "uuid",
      "name": "string",
      "status": "active"
    }
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Credenciales inválidas"
  }
}
```

**Errores Posibles:**
- 400: Datos inválidos
- 401: Credenciales incorrectas, usuario no verificado
- 403: Usuario inactivo o suspendido
- 500: Error interno del servidor

---

### POST /auth/refresh

**Descripción:** Renueva tokens de acceso usando refresh token.

**Handler:** `src/auth/handlers/refresh.py`

**Request:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "string (required, valid JWT)"
}
```

**Validaciones:**
- Refresh token válido y no expirado
- Usuario asociado activo

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_string",
    "refresh_token": "jwt_string",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_INVALID",
    "message": "Refresh token inválido o expirado"
  }
}
```

**Errores Posibles:**
- 400: Token malformado
- 401: Token inválido o expirado
- 403: Usuario inactivo
- 500: Error interno del servidor

---

### POST /auth/logout

**Descripción:** Cierra sesión e invalida tokens.

**Handler:** `src/auth/handlers/logout.py`

**Request:**
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Response Success (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

**Errores Posibles:**
- 401: Token inválido
- 500: Error interno del servidor

---

### POST /auth/verify-email

**Descripción:** Verifica el email del usuario usando token de verificación.

**Handler:** `src/auth/handlers/verify_email.py`

**Request:**
```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "string (required, verification JWT)",
  "email": "string (required, email format)"
}
```

**Validaciones:**
- Token de verificación válido
- Email coincide con el token

**Response Success (200):**
```json
{
  "success": true,
  "message": "Email verificado exitosamente",
  "data": {
    "user_id": "uuid",
    "email_verified": true,
    "status": "active"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_ERROR",
    "message": "Token de verificación inválido o expirado"
  }
}
```

**Errores Posibles:**
- 400: Token inválido, email no coincide
- 404: Usuario no encontrado
- 500: Error interno del servidor

---

### POST /auth/forgot-password

**Descripción:** Inicia proceso de recuperación de contraseña.

**Handler:** `src/auth/handlers/forgot_password.py`

**Request:**
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "string (required, email format)"
}
```

**Validaciones:**
- Email formato válido

**Response Success (200):**
```json
{
  "success": true,
  "message": "Si el email existe, se enviará un enlace de recuperación"
}
```

**Nota de Seguridad:** Siempre retorna éxito para evitar enumeración de usuarios.

**Errores Posibles:**
- 400: Email formato inválido
- 500: Error interno del servidor

---

### POST /auth/reset-password

**Descripción:** Restablece contraseña usando token de reset.

**Handler:** `src/auth/handlers/reset_password.py`

**Request:**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "string (required, reset JWT)",
  "new_password": "string (required, min 8 chars, security requirements)",
  "confirm_password": "string (required, must match new_password)"
}
```

**Validaciones:**
- Token de reset válido y no expirado
- Nueva contraseña cumple políticas de seguridad
- Confirmación coincide con nueva contraseña

**Response Success (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": {
      "new_password": ["Password no cumple requisitos de seguridad"],
      "confirm_password": ["Contraseñas no coinciden"]
    }
  }
}
```

**Errores Posibles:**
- 400: Token inválido, contraseñas no coinciden, password débil
- 404: Usuario no encontrado
- 500: Error interno del servidor

---

## 🏢 GESTIÓN DE TENANTS

### GET /tenant/profile

**Descripción:** Obtiene información completa del tenant del usuario autenticado.

**Handler:** `src/tenant/handlers/get_profile.py`

**Request:**
```http
GET /tenant/profile
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** Cualquier usuario autenticado del tenant

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "tenant_id": "uuid",
    "name": "string",
    "email": "string",
    "status": "active|inactive|suspended",
    "settings": {
      "max_users": "number",
      "features": ["array of strings"],
      "timezone": "string",
      "language": "string",
      "notifications": {
        "email": "boolean",
        "sms": "boolean"
      }
    },
    "subscription": {
      "plan_id": "string",
      "plan_name": "string",
      "status": "active|cancelled|past_due",
      "current_period_end": "ISO 8601 datetime"
    },
    "usage": {
      "current_users": "number",
      "storage_used_gb": "number",
      "api_calls_used": "number"
    },
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime"
  }
}
```

**Errores Posibles:**
- 401: Token inválido
- 404: Tenant no encontrado
- 500: Error interno del servidor

---

### PUT /tenant/settings

**Descripción:** Actualiza configuraciones del tenant.

**Handler:** `src/tenant/handlers/update_settings.py`

**Request:**
```http
PUT /tenant/settings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "settings": {
    "timezone": "string (optional, valid timezone)",
    "language": "string (optional, ISO 639-1 code)",
    "notifications": {
      "email": "boolean (optional)",
      "sms": "boolean (optional)"
    },
    "custom_settings": "object (optional)"
  }
}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** MASTER o ADMIN

**Validaciones:**
- Timezone válido según IANA
- Language código ISO válido
- Settings no exceden límites del plan

**Response Success (200):**
```json
{
  "success": true,
  "message": "Configuraciones actualizadas exitosamente",
  "data": {
    "tenant_id": "uuid",
    "settings": {
      "timezone": "America/Mexico_City",
      "language": "es",
      "notifications": {
        "email": true,
        "sms": false
      }
    },
    "updated_at": "ISO 8601 datetime"
  }
}
```

**Response Error (403):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Sin permisos para actualizar configuraciones del tenant"
  }
}
```

**Errores Posibles:**
- 400: Datos inválidos, timezone inválido
- 401: Token inválido
- 403: Sin permisos
- 500: Error interno del servidor

---

### POST /tenant/invite-user

**Descripción:** Invita un nuevo usuario al tenant.

**Handler:** `src/tenant/handlers/invite_user.py`

**Request:**
```http
POST /tenant/invite-user
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "email": "string (required, email format, unique)",
  "name": "string (required, max 100 chars)",
  "role": "ADMIN|MEMBER (required)"
}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** MASTER o ADMIN

**Validaciones:**
- Email único en el sistema
- Role válido (no puede invitar MASTER)
- No exceder límite de usuarios del plan
- Invitador tiene permisos para asignar el rol

**Response Success (201):**
```json
{
  "success": true,
  "message": "Invitación enviada exitosamente",
  "data": {
    "email": "string",
    "name": "string",
    "role": "ADMIN|MEMBER",
    "invitation_sent": true,
    "expires_at": "ISO 8601 datetime (7 days from now)"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "details": {
      "email": ["Email ya registrado en el sistema"],
      "role": ["Role inválido para este usuario"]
    }
  }
}
```

**Errores Posibles:**
- 400: Email duplicado, role inválido, límite de usuarios alcanzado
- 401: Token inválido
- 403: Sin permisos para invitar usuarios
- 500: Error interno del servidor

---

### POST /tenant/accept-invitation

**Descripción:** Acepta invitación y crea cuenta de usuario.

**Handler:** `src/tenant/handlers/accept_invitation.py`

**Request:**
```http
POST /tenant/accept-invitation
Content-Type: application/json

{
  "token": "string (required, invitation JWT)",
  "password": "string (required, min 8 chars, security requirements)"
}
```

**Validaciones:**
- Token de invitación válido y no expirado
- Password cumple políticas de seguridad

**Response Success (201):**
```json
{
  "success": true,
  "message": "Invitación aceptada exitosamente",
  "data": {
    "user": {
      "user_id": "uuid",
      "tenant_id": "uuid",
      "email": "string",
      "name": "string",
      "role": "ADMIN|MEMBER",
      "status": "active"
    },
    "tokens": {
      "access_token": "jwt_string",
      "refresh_token": "jwt_string",
      "expires_in": 3600,
      "token_type": "Bearer"
    }
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVITATION_ERROR",
    "message": "Token de invitación inválido o expirado"
  }
}
```

**Errores Posibles:**
- 400: Token inválido, password débil, invitación expirada
- 500: Error interno del servidor

---

### GET /tenant/users

**Descripción:** Lista todos los usuarios del tenant.

**Handler:** `src/tenant/handlers/list_users.py`

**Request:**
```http
GET /tenant/users?page=1&limit=20&role=ADMIN&status=active
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Query Parameters (Opcionales):**
- page: número de página (default: 1)
- limit: elementos por página (default: 20, max: 100)
- role: filtrar por rol (MASTER|ADMIN|MEMBER)
- status: filtrar por estado (active|inactive|pending_verification)

**Permisos:** MASTER o ADMIN

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "uuid",
        "email": "string",
        "name": "string",
        "role": "MASTER|ADMIN|MEMBER",
        "status": "active|inactive|pending_verification",
        "email_verified": "boolean",
        "last_login": "ISO 8601 datetime or null",
        "created_at": "ISO 8601 datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

**Errores Posibles:**
- 400: Parámetros de query inválidos
- 401: Token inválido
- 403: Sin permisos para ver usuarios
- 500: Error interno del servidor

---

## 💳 SISTEMA DE PAGOS

### GET /payment/plans

**Descripción:** Lista todos los planes de pago disponibles.

**Handler:** `src/payment/handlers/list_plans.py`

**Request:**
```http
GET /payment/plans?active_only=true
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Query Parameters (Opcionales):**
- active_only: solo planes activos (default: true)

**Permisos:** Cualquier usuario autenticado

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "plan_id": "string",
        "name": "string",
        "plan_type": "FREE|BASIC|PROFESSIONAL|ENTERPRISE",
        "monthly_price": "decimal",
        "yearly_price": "decimal",
        "yearly_discount": "decimal (percentage)",
        "features": {
          "max_users": "number",
          "max_storage_gb": "number",
          "api_calls": "number",
          "email_support": "boolean",
          "priority_support": "boolean",
          "advanced_analytics": "boolean"
        },
        "limits": {
          "max_projects": "number",
          "max_integrations": "number",
          "data_retention_days": "number"
        },
        "status": "active|inactive",
        "popular": "boolean"
      }
    ]
  }
}
```

**Errores Posibles:**
- 401: Token inválido
- 500: Error interno del servidor

---

### GET /payment/plans/{plan_id}

**Descripción:** Obtiene detalles específicos de un plan.

**Handler:** `src/payment/handlers/get_plan.py`

**Request:**
```http
GET /payment/plans/plan_basic_001
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Path Parameters:**
- plan_id: ID del plan (required)

**Permisos:** Cualquier usuario autenticado

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "plan_id": "string",
    "name": "string",
    "plan_type": "FREE|BASIC|PROFESSIONAL|ENTERPRISE",
    "description": "string",
    "monthly_price": "decimal",
    "yearly_price": "decimal",
    "yearly_discount": "decimal",
    "features": {
      "max_users": "number",
      "max_storage_gb": "number",
      "api_calls": "number",
      "email_support": "boolean",
      "priority_support": "boolean",
      "advanced_analytics": "boolean",
      "custom_integrations": "boolean",
      "white_label": "boolean"
    },
    "limits": {
      "max_projects": "number",
      "max_integrations": "number",
      "data_retention_days": "number",
      "api_rate_limit": "number"
    },
    "status": "active|inactive",
    "created_at": "ISO 8601 datetime",
    "updated_at": "ISO 8601 datetime"
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "PLAN_NOT_FOUND",
    "message": "Plan no encontrado"
  }
}
```

**Errores Posibles:**
- 401: Token inválido
- 404: Plan no encontrado
- 500: Error interno del servidor

---

### POST /payment/subscriptions

**Descripción:** Crea una nueva suscripción para el tenant.

**Handler:** `src/payment/handlers/create_subscription.py`

**Request:**
```http
POST /payment/subscriptions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "plan_id": "string (required)",
  "billing_interval": "MONTHLY|YEARLY (required)",
  "payment_method": "string (required, Stripe payment method ID)",
  "trial_days": "number (optional, 0-30)"
}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** MASTER (solo el master puede gestionar facturación)

**Validaciones:**
- Plan existe y está activo
- No hay suscripción activa existente
- Payment method válido en Stripe
- Trial days dentro de límites permitidos

**Response Success (201):**
```json
{
  "success": true,
  "message": "Suscripción creada exitosamente",
  "data": {
    "subscription_id": "uuid",
    "plan": {
      "plan_id": "string",
      "name": "string",
      "plan_type": "string"
    },
    "status": "active|trial",
    "billing_interval": "MONTHLY|YEARLY",
    "amount": "decimal",
    "current_period_start": "ISO 8601 datetime",
    "current_period_end": "ISO 8601 datetime",
    "trial_end": "ISO 8601 datetime or null",
    "stripe_subscription_id": "string",
    "created_at": "ISO 8601 datetime"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_ERROR",
    "message": "Error al crear suscripción",
    "details": {
      "plan_id": ["Plan no disponible"],
      "payment_method": ["Método de pago inválido"]
    }
  }
}
```

**Errores Posibles:**
- 400: Plan inválido, payment method inválido, suscripción existente
- 401: Token inválido
- 403: Sin permisos para gestionar facturación
- 500: Error interno del servidor, error de Stripe

---

### GET /payment/subscription

**Descripción:** Obtiene la suscripción actual del tenant.

**Handler:** `src/payment/handlers/get_subscription.py`

**Request:**
```http
GET /payment/subscription
Authorization: Bearer {access_token}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** Cualquier usuario autenticado del tenant

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "subscription_id": "uuid",
      "status": "active|trial|cancelled|past_due|suspended",
      "billing_interval": "MONTHLY|YEARLY",
      "amount": "decimal",
      "current_period_start": "ISO 8601 datetime",
      "current_period_end": "ISO 8601 datetime",
      "trial_end": "ISO 8601 datetime or null",
      "cancel_at_period_end": "boolean",
      "cancelled_at": "ISO 8601 datetime or null",
      "created_at": "ISO 8601 datetime"
    },
    "plan": {
      "plan_id": "string",
      "name": "string",
      "plan_type": "FREE|BASIC|PROFESSIONAL|ENTERPRISE",
      "features": {
        "max_users": "number",
        "max_storage_gb": "number",
        "api_calls": "number",
        "email_support": "boolean",
        "priority_support": "boolean"
      }
    },
    "usage": {
      "current_users": "number",
      "storage_used_gb": "number",
      "api_calls_used": "number",
      "usage_percentage": {
        "users": "number (0-100)",
        "storage": "number (0-100)",
        "api_calls": "number (0-100)"
      }
    },
    "billing": {
      "next_billing_date": "ISO 8601 datetime",
      "amount_due": "decimal",
      "payment_method": {
        "type": "card",
        "last4": "string",
        "brand": "string"
      }
    }
  }
}
```

**Response Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_NOT_FOUND",
    "message": "No hay suscripción activa para este tenant"
  }
}
```

**Errores Posibles:**
- 401: Token inválido
- 404: Sin suscripción
- 500: Error interno del servidor

---

### POST /payment/subscription/cancel

**Descripción:** Cancela la suscripción actual del tenant.

**Handler:** `src/payment/handlers/cancel_subscription.py`

**Request:**
```http
POST /payment/subscription/cancel
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "cancel_at_period_end": "boolean (optional, default: true)",
  "reason": "string (optional, max 500 chars)"
}
```

**Headers Requeridos:**
- Authorization: Bearer token válido

**Permisos:** MASTER (solo el master puede gestionar facturación)

**Validaciones:**
- Existe suscripción activa
- Suscripción no está ya cancelada

**Response Success (200):**
```json
{
  "success": true,
  "message": "Suscripción cancelada exitosamente",
  "data": {
    "subscription_id": "uuid",
    "status": "active",
    "cancel_at_period_end": true,
    "cancelled_at": "ISO 8601 datetime",
    "current_period_end": "ISO 8601 datetime",
    "access_until": "ISO 8601 datetime",
    "reason": "string or null"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "CANCELLATION_ERROR",
    "message": "No se puede cancelar la suscripción",
    "details": "Suscripción ya cancelada"
  }
}
```

**Errores Posibles:**
- 400: Suscripción ya cancelada, datos inválidos
- 401: Token inválido
- 403: Sin permisos para gestionar facturación
- 404: Sin suscripción activa
- 500: Error interno del servidor, error de Stripe

---

### POST /payment/webhook/stripe

**Descripción:** Procesa webhooks de Stripe para sincronizar estado de suscripciones.

**Handler:** `src/payment/handlers/stripe_webhook.py`

**Request:**
```http
POST /payment/webhook/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=abc123def456...

{
  "id": "evt_1234567890abcdef",
  "object": "event",
  "type": "invoice.payment_succeeded|customer.subscription.updated|...",
  "data": {
    "object": {
      // Stripe object data
    }
  },
  "created": 1234567890
}
```

**Headers Requeridos:**
- Stripe-Signature: Signature de Stripe para verificación

**Validaciones:**
- Signature válida de Stripe
- Evento no procesado previamente (idempotencia)

**Eventos Soportados:**
- `invoice.payment_succeeded`: Pago exitoso
- `invoice.payment_failed`: Pago fallido
- `customer.subscription.updated`: Suscripción actualizada
- `customer.subscription.deleted`: Suscripción eliminada
- `customer.subscription.trial_will_end`: Trial próximo a expirar

**Response Success (200):**
```json
{
  "received": true
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": {
    "code": "WEBHOOK_ERROR",
    "message": "Signature inválida o evento malformado"
  }
}
```

**Errores Posibles:**
- 400: Signature inválida, evento malformado
- 500: Error interno del servidor

---

## 🔒 AUTENTICACIÓN Y AUTORIZACIÓN

### **Headers de Autenticación**

Todos los endpoints protegidos requieren:
```http
Authorization: Bearer {access_token}
```

### **Estructura del JWT Token**

**Access Token Payload:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "email": "string",
  "role": "MASTER|ADMIN|MEMBER",
  "iat": 1234567890,
  "exp": 1234571490,
  "type": "access"
}
```

**Refresh Token Payload:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "iat": 1234567890,
  "exp": 1234654290,
  "type": "refresh"
}
```

### **Niveles de Permisos**

**MASTER:**
- Gestión completa del tenant
- Gestión de usuarios (todos los roles)
- Gestión de facturación y suscripciones
- Configuración del tenant
- Acceso a todas las funcionalidades

**ADMIN:**
- Gestión de usuarios (ADMIN y MEMBER)
- Configuración básica del tenant
- Visualización de información de facturación
- Acceso a funcionalidades avanzadas

**MEMBER:**
- Acceso a funcionalidades básicas
- Gestión de su propio perfil
- Visualización de información básica del tenant

---

## 📊 CÓDIGOS DE RESPUESTA HTTP

### **Códigos de Éxito**
- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido

### **Códigos de Error del Cliente**
- **400 Bad Request**: Datos inválidos o malformados
- **401 Unauthorized**: Token inválido o faltante
- **403 Forbidden**: Sin permisos para la operación
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto con estado actual (ej: email duplicado)
- **422 Unprocessable Entity**: Datos válidos pero lógicamente incorrectos
- **429 Too Many Requests**: Rate limit excedido

### **Códigos de Error del Servidor**
- **500 Internal Server Error**: Error interno del servidor
- **502 Bad Gateway**: Error de servicio externo (Stripe, AWS)
- **503 Service Unavailable**: Servicio temporalmente no disponible

---

## 🔧 CONFIGURACIÓN Y VARIABLES

### **Variables de Entorno Requeridas**

```bash
# Base Configuration
ENVIRONMENT=development|staging|production
API_BASE_URL=https://api-platform-dev.agentscl.com
CORS_ORIGINS=https://api-platform-dev.agentscl.com

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Database Configuration
DYNAMODB_TABLE_NAME=agentscl-main
DYNAMODB_REGION=us-east-1

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)

# Email Configuration (SES)
SES_REGION=us-east-1
FROM_EMAIL=noreply@thejungleagents.com
SUPPORT_EMAIL=support@thejungleagents.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### **Rate Limiting por Endpoint**

| Endpoint | Límite por Minuto | Límite por Hora |
|----------|-------------------|-----------------|
| POST /auth/login | 5 | 50 |
| POST /auth/register | 3 | 10 |
| POST /auth/forgot-password | 3 | 10 |
| Otros endpoints autenticados | 60 | 1000 |
| GET endpoints | 120 | 2000 |

---

## 🧪 TESTING Y VALIDACIÓN

### **Endpoints de Health Check**

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "ISO 8601 datetime",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "stripe": "healthy",
    "email": "healthy"
  }
}
```

### **Validación de Datos**

Todos los endpoints validan:
- **Tipos de datos**: String, number, boolean, array, object
- **Formatos**: Email, UUID, ISO dates, URLs
- **Longitudes**: Min/max caracteres
- **Patrones**: Regex para passwords, nombres, etc.
- **Reglas de negocio**: Límites de plan, permisos, etc.

---

**Documento generado:** 19 de Julio, 2025
**Estado:** Sistema 100% funcional con 77/77 tests pasando
**Cobertura:** Todos los endpoints documentados y operativos
