# Configuración del Entorno - Technoagentes

Esta guía explica cómo configurar correctamente las variables de entorno para la integración con el Auth Service.

## Variables de Entorno Requeridas

### Configuración de API
```bash
# URL base del servicio de autenticación
VITE_AUTH_BASE_URL=https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth

# URL base del servicio de tenant
VITE_TENANT_BASE_URL=https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/tenant
```

### Configuración del Entorno
```bash
# Entorno de la aplicación (development, production, test)
VITE_APP_ENV=development

# Modo de desarrollo (true/false)
VITE_DEV_MODE=true
```

### Configuración de Seguridad
```bash
# Forzar HTTPS únicamente (recomendado para producción)
VITE_ENABLE_HTTPS_ONLY=true

# Habilitar protección CSRF
VITE_ENABLE_CSRF_PROTECTION=true

# Tipo de almacenamiento para tokens (localStorage/sessionStorage)
VITE_TOKEN_STORAGE_TYPE=localStorage
```

### Configuración de Pagos (Opcional)
```bash
# Clave pública de Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Archivos de Configuración

### `.env` (Configuración por defecto)
Archivo principal de configuración que se usa por defecto.

### `.env.development` (Desarrollo local)
Configuración específica para desarrollo local con:
- URLs de desarrollo del Auth Service
- HTTPS deshabilitado para desarrollo local
- Logs de debug habilitados
- Claves de prueba de Stripe

### `.env.production` (Producción)
Configuración para el entorno de producción con:
- URLs de producción del Auth Service
- HTTPS obligatorio
- Modo de desarrollo deshabilitado
- Claves reales de Stripe

### `.env.example` (Plantilla)
Plantilla con todas las variables disponibles y valores de ejemplo.

## Configuración por Entorno

### Desarrollo Local
```bash
cp .env.example .env
# Editar .env con las configuraciones de desarrollo
npm run dev
```

### Producción (AWS Amplify)
Las variables de entorno se configuran automáticamente a través del archivo `amplify.yml`:

```yaml
environmentVariables:
  - name: VITE_AUTH_BASE_URL
    value: https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth
  - name: VITE_TENANT_BASE_URL
    value: https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/tenant
  # ... más variables
```

## Validación de Configuración

### Validación Automática
La configuración se valida automáticamente:
- Al ejecutar `npm run build`
- Al ejecutar `npm run deploy`
- Al inicializar la aplicación

### Validación Manual
```bash
# Validar todas las configuraciones
npm run validate:env

# Validar configuración de desarrollo
npm run validate:env:dev

# Validar configuración de producción
npm run validate:env:prod
```

## Configuración de Seguridad

### Headers de Seguridad
La aplicación configura automáticamente headers de seguridad:

```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' // Solo en producción
}
```

### Content Security Policy (CSP)
Se configura automáticamente una política de seguridad de contenido que permite:
- Scripts y estilos de la misma origen
- Fuentes de Google Fonts
- Conexiones al Auth Service y Stripe
- Imágenes de cualquier origen HTTPS

### CORS
Configuración de CORS para desarrollo:
```javascript
cors: {
  origin: [
    'http://localhost:3000',
    'https://main.d3lhcnp00fedic.amplifyapp.com',
    'https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com'
  ],
  credentials: true
}
```

## Almacenamiento de Tokens

### Configuración
```bash
# Usar localStorage (persistente entre sesiones)
VITE_TOKEN_STORAGE_TYPE=localStorage

# Usar sessionStorage (se borra al cerrar el navegador)
VITE_TOKEN_STORAGE_TYPE=sessionStorage
```

### Seguridad
- Los tokens se almacenan de forma segura según la configuración
- Se limpian automáticamente en logout
- Se validan antes de cada uso

## Troubleshooting

### Error: "Missing required environment variable"
```bash
# Verificar que todas las variables requeridas estén definidas
npm run validate:env
```

### Error: "Invalid URL format"
```bash
# Verificar que las URLs sean válidas
echo $VITE_AUTH_BASE_URL
# Debe ser una URL completa: https://domain.com/path
```

### Error: "HTTPS required in production"
```bash
# En producción, todas las URLs deben usar HTTPS
VITE_AUTH_BASE_URL=https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/prod/auth
```

### Error de CORS
```bash
# Verificar que el origen esté permitido en la configuración del servidor
# Revisar la configuración de CORS en vite.config.js
```

## Migración desde Configuración Anterior

Si tienes una configuración anterior, sigue estos pasos:

1. **Respaldar configuración actual:**
   ```bash
   cp .env .env.backup
   ```

2. **Actualizar variables:**
   ```bash
   # Cambiar de:
   VITE_API_BASE_URL=https://api-platform-dev.agentscl.com
   
   # A:
   VITE_AUTH_BASE_URL=https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth
   VITE_TENANT_BASE_URL=https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/tenant
   ```

3. **Validar nueva configuración:**
   ```bash
   npm run validate:env
   ```

4. **Probar la aplicación:**
   ```bash
   npm run dev
   ```

## Configuración de AWS Amplify

### Variables de Entorno en Amplify Console
1. Ir a AWS Amplify Console
2. Seleccionar la aplicación
3. Ir a "Environment variables"
4. Agregar las variables necesarias:

| Variable | Valor |
|----------|-------|
| `VITE_AUTH_BASE_URL` | `https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/prod/auth` |
| `VITE_TENANT_BASE_URL` | `https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/prod/tenant` |
| `VITE_APP_ENV` | `production` |
| `VITE_DEV_MODE` | `false` |
| `VITE_ENABLE_HTTPS_ONLY` | `true` |

### Build Settings
El archivo `amplify.yml` ya incluye la configuración necesaria para el build y las variables de entorno.

## Monitoreo y Logs

### Logs de Configuración
En modo desarrollo, la aplicación muestra logs de configuración:
```javascript
🔧 Environment Configuration
Environment: development
Auth URL: https://sus2ukuiqk.execute-api.us-east-1.amazonaws.com/dev/auth
✅ Configuration is valid
```

### Debugging
Para habilitar logs de debug:
```bash
VITE_ENABLE_DEBUG_LOGS=true
```

## Contacto y Soporte

Si tienes problemas con la configuración del entorno:
1. Ejecuta `npm run validate:env` para diagnosticar problemas
2. Revisa los logs de la consola del navegador
3. Verifica que las URLs del Auth Service estén accesibles
4. Contacta al equipo de desarrollo con los detalles del error