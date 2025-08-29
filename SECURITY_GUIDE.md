# Guía de Seguridad - Technoagentes Auth Integration

Esta guía documenta todas las medidas de seguridad implementadas en la integración del servicio de autenticación.

## Resumen de Seguridad

### 🔒 Características de Seguridad Implementadas

1. **Almacenamiento Seguro de Tokens**
   - Cifrado AES-GCM para tokens
   - Claves almacenadas en IndexedDB
   - Fallback a almacenamiento estándar

2. **Protección CSRF**
   - Tokens CSRF únicos por sesión
   - Validación de origen
   - Headers de seguridad automáticos

3. **Sanitización de Inputs**
   - Sanitización automática de formularios
   - Protección contra XSS
   - Validación con límites de velocidad

4. **Headers de Seguridad**
   - Content Security Policy (CSP)
   - Permissions Policy
   - Headers anti-clickjacking

5. **Auditoría de Seguridad**
   - Auditoría automática en desarrollo
   - Scripts de verificación de seguridad
   - Reportes de seguridad detallados

## Almacenamiento Seguro de Tokens

### Implementación

```javascript
import { secureTokenStorage } from './utils/secureStorage'

// Almacenar token de forma segura
await secureTokenStorage.setItem('accessToken', token)

// Recuperar token
const token = await secureTokenStorage.getItem('accessToken')

// Limpiar tokens
await secureTokenStorage.clear()
```

### Características

- **Cifrado AES-GCM**: Tokens cifrados con claves únicas
- **Gestión de Claves**: Claves almacenadas en IndexedDB
- **Fallback Seguro**: Degradación elegante a almacenamiento estándar
- **Limpieza Automática**: Limpieza de claves en logout

### Configuración

```bash
# Tipo de almacenamiento
VITE_TOKEN_STORAGE_TYPE=localStorage  # o sessionStorage
```

## Protección CSRF

### Implementación

```javascript
import { csrfProtection } from './utils/csrfProtection'

// Obtener token CSRF
const token = csrfProtection.getToken()

// Validar origen
const isValid = csrfProtection.validateOrigin(origin)

// Headers automáticos en requests
const headers = csrfProtection.getHeaders()
```

### Características

- **Tokens Únicos**: Generación criptográficamente segura
- **Validación de Origen**: Lista blanca de orígenes permitidos
- **Cookies SameSite**: Protección adicional contra CSRF
- **Headers Automáticos**: Integración transparente con API client

### Configuración

```bash
# Habilitar protección CSRF
VITE_ENABLE_CSRF_PROTECTION=true
```

## Sanitización de Inputs

### Funciones Disponibles

```javascript
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizePhone,
  sanitizeText,
  sanitizeAuthFormData
} from './utils/inputSanitization'

// Sanitización específica por tipo
const cleanEmail = sanitizeEmail(userInput)
const cleanName = sanitizeName(userInput)

// Sanitización completa de formulario
const cleanData = sanitizeAuthFormData(formData)
```

### Protecciones Implementadas

- **Eliminación de HTML**: Prevención de inyección de HTML
- **Filtrado de Scripts**: Eliminación de JavaScript malicioso
- **Validación de Protocolos**: Solo HTTP/HTTPS permitidos
- **Límites de Longitud**: Prevención de ataques de buffer
- **Caracteres Especiales**: Filtrado contextual por tipo de campo

### Componentes Seguros

```javascript
import SecureForm from './components/ui/SecureForm'
import SecureInput from './components/ui/SecureInput'

// Formulario con protecciones automáticas
<SecureForm onSubmit={handleSubmit}>
  <SecureInput 
    type="email" 
    sanitizeType="email"
    enablePasteProtection={false}
  />
</SecureForm>
```

## Headers de Seguridad

### Content Security Policy

```javascript
// CSP automático generado
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
connect-src 'self' https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com;
frame-ancestors 'none';
```

### Headers Implementados

- **Content-Security-Policy**: Prevención de XSS y inyección de código
- **X-Frame-Options**: Protección contra clickjacking
- **X-Content-Type-Options**: Prevención de MIME sniffing
- **X-XSS-Protection**: Protección XSS del navegador
- **Referrer-Policy**: Control de información de referencia
- **Strict-Transport-Security**: Forzar HTTPS (producción)

### Configuración Automática

```javascript
import { initializeSecurityHeaders } from './utils/securityHeaders'

// Aplicar headers automáticamente
initializeSecurityHeaders()
```

## Auditoría de Seguridad

### Auditoría Automática

```javascript
import { performSecurityAudit } from './utils/securityAudit'

// Auditoría completa
const auditResult = await performSecurityAudit()
console.log(`Security Score: ${auditResult.score}/100`)
```

### Verificación Rápida

```javascript
import { quickSecurityCheck } from './utils/securityAudit'

// Verificación rápida
const check = quickSecurityCheck()
if (!check.secure) {
  console.warn('Security issues:', check.issues)
}
```

### Scripts de Auditoría

```bash
# Auditoría completa de seguridad
npm run security:audit

# Verificación de seguridad y configuración
npm run security:check
```

## Configuración de Seguridad

### Variables de Entorno

```bash
# Seguridad HTTPS
VITE_ENABLE_HTTPS_ONLY=true

# Protección CSRF
VITE_ENABLE_CSRF_PROTECTION=true

# Tipo de almacenamiento de tokens
VITE_TOKEN_STORAGE_TYPE=localStorage
```

### Configuración por Entorno

#### Desarrollo
```bash
VITE_ENABLE_HTTPS_ONLY=false
VITE_ENABLE_CSRF_PROTECTION=false
VITE_ENABLE_DEBUG_LOGS=true
```

#### Producción
```bash
VITE_ENABLE_HTTPS_ONLY=true
VITE_ENABLE_CSRF_PROTECTION=true
VITE_DEV_MODE=false
```

## Mejores Prácticas de Seguridad

### 1. Manejo de Tokens

```javascript
// ✅ Correcto - usar almacenamiento seguro
await secureTokenStorage.setItem('token', value)

// ❌ Incorrecto - almacenamiento directo
localStorage.setItem('token', value)
```

### 2. Validación de Inputs

```javascript
// ✅ Correcto - sanitizar antes de usar
const cleanData = sanitizeAuthFormData(formData)
await api.register(cleanData)

// ❌ Incorrecto - usar datos sin sanitizar
await api.register(formData)
```

### 3. Manejo de Errores

```javascript
// ✅ Correcto - no exponer información sensible
catch (error) {
  console.error('Operation failed') // Log genérico
  showUserError('Something went wrong') // Mensaje genérico
}

// ❌ Incorrecto - exponer detalles internos
catch (error) {
  showUserError(error.message) // Puede exponer información sensible
}
```

### 4. Headers de Seguridad

```javascript
// ✅ Correcto - usar middleware automático
const response = await authClient.post('/login', data)

// ❌ Incorrecto - omitir headers de seguridad
const response = await axios.post(url, data)
```

## Monitoreo de Seguridad

### Métricas de Seguridad

- **Intentos de Login Fallidos**: Monitoreo de ataques de fuerza bruta
- **Violaciones de CSP**: Detección de intentos de XSS
- **Errores de CSRF**: Intentos de ataques CSRF
- **Tokens Expirados**: Patrones de expiración anómalos

### Alertas de Seguridad

```javascript
// Configuración de alertas automáticas
const securityEvents = [
  'multiple_failed_logins',
  'csp_violation',
  'csrf_token_mismatch',
  'suspicious_token_usage'
]
```

### Logs de Seguridad

```javascript
// Logging seguro (sin información sensible)
console.log('Auth attempt', {
  timestamp: new Date().toISOString(),
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  success: false,
  reason: 'invalid_credentials'
  // NO incluir: email, password, tokens
})
```

## Respuesta a Incidentes

### Procedimiento de Respuesta

1. **Detección**: Monitoreo automático y alertas
2. **Evaluación**: Análisis del impacto y alcance
3. **Contención**: Medidas inmediatas de mitigación
4. **Erradicación**: Eliminación de la amenaza
5. **Recuperación**: Restauración de servicios
6. **Lecciones Aprendidas**: Mejoras post-incidente

### Medidas de Emergencia

```javascript
// Revocar todos los tokens
await secureTokenStorage.clear()

// Regenerar claves CSRF
csrfProtection.refreshToken()

// Forzar re-autenticación
window.location.href = '/login?force_reauth=true'
```

## Cumplimiento y Estándares

### Estándares Implementados

- **OWASP Top 10**: Protección contra vulnerabilidades principales
- **NIST Cybersecurity Framework**: Identificar, Proteger, Detectar, Responder, Recuperar
- **ISO 27001**: Gestión de seguridad de la información
- **GDPR**: Protección de datos personales

### Controles de Seguridad

- **Autenticación Multifactor**: Preparado para implementación
- **Cifrado en Tránsito**: HTTPS obligatorio
- **Cifrado en Reposo**: Tokens cifrados localmente
- **Gestión de Sesiones**: Expiración y renovación automática
- **Auditoría**: Logs de seguridad y auditorías regulares

## Testing de Seguridad

### Tests Automatizados

```bash
# Tests de seguridad incluidos en CI/CD
npm run test:auth
npm run security:audit
```

### Tests Manuales

1. **Penetration Testing**: Tests de penetración regulares
2. **Code Review**: Revisión de código enfocada en seguridad
3. **Dependency Scanning**: Escaneo de vulnerabilidades en dependencias
4. **Configuration Review**: Revisión de configuraciones de seguridad

## Recursos Adicionales

### Documentación de Referencia

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)

### Herramientas de Seguridad

- **npm audit**: Escaneo de vulnerabilidades en dependencias
- **ESLint Security Plugin**: Análisis estático de seguridad
- **OWASP ZAP**: Proxy de seguridad para testing

### Contacto de Seguridad

Para reportar vulnerabilidades de seguridad:
- Email: security@technoagentes.com
- Proceso: Divulgación responsable
- Tiempo de respuesta: 24-48 horas

---

**Nota**: Esta guía debe actualizarse regularmente conforme se implementen nuevas medidas de seguridad o se identifiquen nuevas amenazas.