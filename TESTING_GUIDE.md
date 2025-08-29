# Guía de Testing - Technoagentes Auth Integration

Esta guía explica cómo ejecutar y mantener los tests para la integración del servicio de autenticación.

## Estructura de Tests

```
src/tests/
├── setup.js                    # Configuración global de tests
├── mocks/
│   ├── server.js               # Servidor MSW para mocks
│   └── authHandlers.js         # Handlers de API mock
├── auth/
│   ├── api.test.js            # Tests unitarios del API client
│   ├── tokenManager.test.js    # Tests del gestor de tokens
│   ├── useAuthError.test.js    # Tests del hook de errores
│   └── authFlows.test.js       # Tests de integración de flujos
└── e2e/
    └── auth.spec.js            # Tests E2E de autenticación
```

## Tipos de Tests

### 1. Tests Unitarios
Prueban componentes individuales de forma aislada.

**Ubicación:** `src/tests/auth/*.test.js`

**Cobertura:**
- API client methods
- Token management
- Error handling hooks
- Utility functions

**Ejecutar:**
```bash
npm run test:run
```

### 2. Tests de Integración
Prueban flujos completos de autenticación con componentes reales.

**Ubicación:** `src/tests/auth/authFlows.test.js`

**Cobertura:**
- Flujo completo de registro
- Flujo completo de login
- Verificación de email
- Restablecimiento de contraseña
- Gestión de sesiones

**Ejecutar:**
```bash
npm run test:auth
```

### 3. Tests E2E (End-to-End)
Prueban la aplicación completa en un navegador real.

**Ubicación:** `src/tests/e2e/auth.spec.js`

**Cobertura:**
- Interacciones de usuario reales
- Navegación entre páginas
- Persistencia de sesión
- Responsividad móvil
- Accesibilidad

**Ejecutar:**
```bash
npm run test:e2e
```

## Comandos de Testing

### Comandos Básicos
```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests en modo watch
npm test

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests una vez
npm run test:run

# Generar reporte de cobertura
npm run test:coverage

# Ejecutar solo tests de autenticación
npm run test:auth

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E con UI
npm run test:e2e:ui
```

### Comandos Avanzados
```bash
# Ejecutar todos los tipos de tests
npm run test:all

# Ejecutar suite de CI (sin E2E)
npm run test:ci

# Usar el test runner personalizado
node scripts/run-tests.js [tipo]
```

### Tipos de Test Runner
```bash
node scripts/run-tests.js unit        # Solo unitarios
node scripts/run-tests.js integration # Solo integración
node scripts/run-tests.js e2e         # Solo E2E
node scripts/run-tests.js auth        # Todos los de auth
node scripts/run-tests.js coverage    # Solo cobertura
node scripts/run-tests.js ci          # Suite de CI
node scripts/run-tests.js all         # Todos los tests
```

## Configuración de Testing

### Vitest (Tests Unitarios e Integración)
**Archivo:** `vitest.config.js`

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
```

### Playwright (Tests E2E)
**Archivo:** `playwright.config.js`

```javascript
export default defineConfig({
  testDir: './src/tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000'
  }
})
```

### MSW (Mock Service Worker)
**Archivo:** `src/tests/mocks/server.js`

Simula las respuestas del Auth Service para tests consistentes.

## Escribir Nuevos Tests

### Test Unitario Ejemplo
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { login } from '../../utils/api'

describe('API Client - login', () => {
  it('should login successfully with valid credentials', async () => {
    const result = await login('test@example.com', 'password123')
    
    expect(result.success).toBe(true)
    expect(result.data.access_token).toBeDefined()
  })
})
```

### Test de Integración Ejemplo
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../../pages/LoginPage'

describe('Login Flow Integration', () => {
  it('should login successfully', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { wrapper: TestWrapper })

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard')
    })
  })
})
```

### Test E2E Ejemplo
```javascript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.click('[data-testid="login-button"]')
  
  await expect(page).toHaveURL('/dashboard')
})
```

## Mocks y Test Data

### Configuración de Mocks
Los mocks del Auth Service están configurados en `src/tests/mocks/authHandlers.js`:

```javascript
// Emails especiales para testing
'existing@example.com'     // Simula conflicto de email
'unverified@example.com'   // Simula email no verificado
'locked@example.com'       // Simula cuenta bloqueada
'ratelimited@example.com'  // Simula límite de velocidad
```

### Test IDs
Usar los test IDs definidos en `src/tests/testIds.js`:

```javascript
import { testIds } from '../tests/testIds'

// En componentes
<input data-testid={testIds.login.emailInput} />

// En tests E2E
await page.fill(`[data-testid="${testIds.login.emailInput}"]`, 'test@example.com')
```

## Cobertura de Tests

### Objetivos de Cobertura
- **Líneas:** > 80%
- **Funciones:** > 85%
- **Ramas:** > 75%
- **Declaraciones:** > 80%

### Ver Reporte de Cobertura
```bash
npm run test:coverage
open coverage/index.html
```

### Archivos Excluidos de Cobertura
- `node_modules/`
- `src/tests/`
- `**/*.d.ts`
- `**/*.config.js`
- `dist/`

## CI/CD Integration

### GitHub Actions Ejemplo
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:auth",
      "pre-push": "npm run test:ci"
    }
  }
}
```

## Debugging Tests

### Debug Tests Unitarios
```bash
# Ejecutar test específico
npm test -- --run src/tests/auth/api.test.js

# Debug con breakpoints
npm test -- --inspect-brk

# Verbose output
npm test -- --reporter=verbose
```

### Debug Tests E2E
```bash
# Ejecutar con UI para ver el navegador
npm run test:e2e:ui

# Ejecutar test específico
npx playwright test auth.spec.js

# Debug mode
npx playwright test --debug

# Headed mode (ver navegador)
npx playwright test --headed
```

### Logs y Traces
```bash
# Ver traces de Playwright
npx playwright show-trace trace.zip

# Ver reporte HTML
npx playwright show-report
```

## Mejores Prácticas

### 1. Estructura de Tests
```javascript
describe('Component/Feature', () => {
  beforeEach(() => {
    // Setup común
  })

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Test específico
    })
  })
})
```

### 2. Naming Conventions
- **Describe:** Nombre del componente o feature
- **It:** Comportamiento esperado en tercera persona
- **Test files:** `*.test.js` para unitarios, `*.spec.js` para E2E

### 3. Test Data
- Usar datos consistentes y predecibles
- Evitar datos hardcodeados en múltiples lugares
- Usar factories para generar test data

### 4. Assertions
```javascript
// ✅ Específico y claro
expect(result.data.user.email).toBe('test@example.com')

// ❌ Genérico
expect(result).toBeTruthy()
```

### 5. Async Testing
```javascript
// ✅ Usar waitFor para elementos asincrónicos
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})

// ❌ No usar timeouts fijos
setTimeout(() => {
  expect(element).toBeVisible()
}, 1000)
```

## Troubleshooting

### Problemas Comunes

#### Tests Fallan Intermitentemente
- Verificar condiciones de carrera
- Usar `waitFor` para elementos asincrónicos
- Limpiar estado entre tests

#### MSW No Intercepta Requests
- Verificar que el servidor esté iniciado
- Comprobar URLs de los handlers
- Revisar configuración en `setup.js`

#### Tests E2E Lentos
- Usar `page.waitForLoadState()`
- Optimizar selectores
- Ejecutar en paralelo cuando sea posible

#### Cobertura Baja
- Identificar código no testeado
- Agregar tests para edge cases
- Revisar archivos excluidos

### Logs de Debug
```javascript
// En tests unitarios
console.log('Debug info:', result)

// En tests E2E
await page.screenshot({ path: 'debug.png' })
```

## Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## Contacto

Para preguntas sobre testing:
1. Revisar esta guía y la documentación
2. Ejecutar `npm run test:all` para verificar el estado
3. Contactar al equipo de desarrollo con logs específicos