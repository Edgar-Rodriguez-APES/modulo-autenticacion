# ✅ Checklist de Pruebas Post-Despliegue

## 🔍 Verificaciones Inmediatas

### 1. Acceso a la Aplicación
- [ ] La aplicación carga correctamente en el navegador
- [ ] No hay errores 404 o 500 en la consola
- [ ] Los assets estáticos se cargan (CSS, JS, imágenes)

### 2. Configuración de Environment
- [ ] Las variables de entorno están configuradas correctamente
- [ ] La URL del backend está apuntando al servicio real
- [ ] No hay errores de CORS en la consola

## 🔐 Pruebas de Autenticación

### Registro de Usuario
- [ ] Abrir página de registro
- [ ] Completar formulario con datos válidos
- [ ] Verificar que se envía el email de verificación
- [ ] Confirmar redirección a página de verificación

### Verificación de Email
- [ ] Hacer clic en el enlace del email recibido
- [ ] Verificar que la cuenta se activa correctamente
- [ ] Confirmar redirección al login

### Login
- [ ] Usar credenciales del usuario registrado
- [ ] Verificar que el login es exitoso
- [ ] Confirmar que se almacena el token
- [ ] Verificar redirección al dashboard

### Navegación Protegida
- [ ] Intentar acceder a rutas protegidas sin login
- [ ] Verificar redirección al login
- [ ] Después del login, verificar acceso a rutas protegidas

### Logout
- [ ] Hacer logout desde la aplicación
- [ ] Verificar que se limpia el token
- [ ] Confirmar redirección al login
- [ ] Intentar acceder a rutas protegidas (debe redirigir)

### Recuperación de Contraseña
- [ ] Ir a "Olvidé mi contraseña"
- [ ] Ingresar email registrado
- [ ] Verificar recepción del email
- [ ] Hacer clic en el enlace de reset
- [ ] Cambiar contraseña
- [ ] Hacer login con nueva contraseña

## 🛡️ Pruebas de Seguridad

### Token Management
- [ ] Verificar que los tokens se almacenan de forma segura
- [ ] Comprobar que el refresh automático funciona
- [ ] Verificar expiración y renovación de tokens

### Error Handling
- [ ] Probar con credenciales incorrectas
- [ ] Verificar mensajes de error amigables
- [ ] Probar con conexión de red intermitente

## 🎨 Pruebas de UX

### Estados de Carga
- [ ] Verificar spinners durante operaciones
- [ ] Confirmar feedback visual en formularios
- [ ] Probar animaciones de éxito

### Responsive Design
- [ ] Probar en dispositivos móviles
- [ ] Verificar en diferentes tamaños de pantalla
- [ ] Confirmar usabilidad en touch devices

## 📊 Monitoreo

### Performance
- [ ] Verificar tiempos de carga
- [ ] Monitorear uso de memoria
- [ ] Comprobar que no hay memory leaks

### Logs
- [ ] Revisar console logs por errores
- [ ] Verificar que no hay warnings críticos
- [ ] Monitorear errores de red

## 🚨 Problemas Comunes

Si encuentras problemas, revisa:

1. **Error de CORS:** Verificar configuración del backend
2. **Token no válido:** Limpiar localStorage y probar de nuevo
3. **404 en rutas:** Verificar configuración de routing en Amplify
4. **Variables de entorno:** Confirmar que están configuradas en Amplify

## 📞 Contacto

Si necesitas ayuda con alguna prueba o encuentras bugs, documenta:
- Pasos para reproducir el error
- Mensajes de error exactos
- Navegador y versión utilizada
- Screenshots si es necesario