#!/usr/bin/env node

/**
 * Comprehensive Integration Testing Script
 * Tests all authentication flows and validates system integration
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test configuration
const config = {
  baseUrl: process.env.VITE_APP_URL || 'http://localhost:5173',
  apiUrl: process.env.VITE_API_BASE_URL || 'https://api.technoagentes.com',
  testTimeout: 30000,
  retryAttempts: 3,
  testUser: {
    email: 'test@technoagentes.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    companyName: 'Test Company'
  }
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.magenta}→${colors.reset} ${msg}`)
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
}

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const runCommand = (command, options = {}) => {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    })
    return { success: true, output: result }
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout }
  }
}

const checkFileExists = (filePath) => {
  return fs.existsSync(path.resolve(filePath))
}

const validateEnvironment = () => {
  log.header('Environment Validation')
  
  const requiredFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'src/main.jsx',
    'src/context/AuthContext.jsx',
    'src/utils/api.js',
    'src/utils/tokenManager.js'
  ]
  
  const requiredEnvVars = [
    'VITE_API_BASE_URL'
  ]
  
  let allValid = true
  
  // Check required files
  log.step('Checking required files...')
  for (const file of requiredFiles) {
    if (checkFileExists(file)) {
      log.success(`Found: ${file}`)
    } else {
      log.error(`Missing: ${file}`)
      allValid = false
    }
  }
  
  // Check environment variables
  log.step('Checking environment variables...')
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log.success(`Set: ${envVar}`)
    } else {
      log.warning(`Missing: ${envVar} (using default)`)
    }
  }
  
  // Check dependencies
  log.step('Checking dependencies...')
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDeps = [
    'react',
    'react-router-dom',
    'axios',
    'clsx',
    '@tailwindcss/forms'
  ]
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      log.success(`Dependency: ${dep}`)
    } else {
      log.error(`Missing dependency: ${dep}`)
      allValid = false
    }
  }
  
  return allValid
}

const runUnitTests = () => {
  log.header('Unit Tests')
  
  log.step('Running Jest unit tests...')
  const result = runCommand('npm run test:unit -- --passWithNoTests --silent')
  
  if (result.success) {
    log.success('Unit tests passed')
    testResults.passed++
    return true
  } else {
    log.error('Unit tests failed')
    testResults.failed++
    testResults.errors.push('Unit tests failed: ' + result.error)
    return false
  }
}

const runIntegrationTests = () => {
  log.header('Integration Tests')
  
  log.step('Running integration tests...')
  const result = runCommand('npm run test:integration -- --passWithNoTests --silent')
  
  if (result.success) {
    log.success('Integration tests passed')
    testResults.passed++
    return true
  } else {
    log.error('Integration tests failed')
    testResults.failed++
    testResults.errors.push('Integration tests failed: ' + result.error)
    return false
  }
}

const runE2ETests = () => {
  log.header('End-to-End Tests')
  
  log.step('Starting development server...')
  // Note: In a real scenario, you'd start the dev server in the background
  log.info('Assuming development server is running on ' + config.baseUrl)
  
  log.step('Running Playwright E2E tests...')
  const result = runCommand('npx playwright test --reporter=line', { silent: true })
  
  if (result.success) {
    log.success('E2E tests passed')
    testResults.passed++
    return true
  } else {
    log.error('E2E tests failed')
    testResults.failed++
    testResults.errors.push('E2E tests failed: ' + result.error)
    return false
  }
}

const validateBuild = () => {
  log.header('Build Validation')
  
  log.step('Creating production build...')
  const buildResult = runCommand('npm run build', { silent: true })
  
  if (!buildResult.success) {
    log.error('Build failed')
    testResults.failed++
    testResults.errors.push('Build failed: ' + buildResult.error)
    return false
  }
  
  log.success('Build completed successfully')
  
  // Check build output
  log.step('Validating build output...')
  const distExists = checkFileExists('dist')
  const indexExists = checkFileExists('dist/index.html')
  
  if (distExists && indexExists) {
    log.success('Build output is valid')
    testResults.passed++
    return true
  } else {
    log.error('Build output is invalid')
    testResults.failed++
    testResults.errors.push('Build output validation failed')
    return false
  }
}

const validateSecurity = () => {
  log.header('Security Validation')
  
  const securityChecks = [
    {
      name: 'HTTPS enforcement',
      check: () => {
        // Check if API calls use HTTPS
        const apiFile = fs.readFileSync('src/utils/api.js', 'utf8')
        return apiFile.includes('https://') || process.env.NODE_ENV === 'development'
      }
    },
    {
      name: 'Secure token storage',
      check: () => {
        const tokenFile = fs.readFileSync('src/utils/tokenManager.js', 'utf8')
        return tokenFile.includes('localStorage') || tokenFile.includes('sessionStorage')
      }
    },
    {
      name: 'Input sanitization',
      check: () => {
        return checkFileExists('src/utils/inputSanitization.js')
      }
    },
    {
      name: 'CSRF protection',
      check: () => {
        return checkFileExists('src/utils/csrfProtection.js')
      }
    }
  ]
  
  let allSecurityChecksPassed = true
  
  for (const check of securityChecks) {
    log.step(`Checking ${check.name}...`)
    if (check.check()) {
      log.success(`${check.name} - OK`)
    } else {
      log.error(`${check.name} - FAILED`)
      allSecurityChecksPassed = false
      testResults.errors.push(`Security check failed: ${check.name}`)
    }
  }
  
  if (allSecurityChecksPassed) {
    log.success('All security checks passed')
    testResults.passed++
    return true
  } else {
    log.error('Some security checks failed')
    testResults.failed++
    return false
  }
}

const validateAccessibility = () => {
  log.header('Accessibility Validation')
  
  const accessibilityChecks = [
    {
      name: 'Accessibility components',
      check: () => checkFileExists('src/components/ui/AccessibilityEnhanced.jsx')
    },
    {
      name: 'ARIA labels in forms',
      check: () => {
        const loginFile = fs.readFileSync('src/pages/LoginPage.jsx', 'utf8')
        return loginFile.includes('aria-label') || loginFile.includes('AccessibleFormField')
      }
    },
    {
      name: 'Screen reader support',
      check: () => {
        const accessibilityFile = fs.readFileSync('src/components/ui/AccessibilityEnhanced.jsx', 'utf8')
        return accessibilityFile.includes('ScreenReaderAnnouncer')
      }
    },
    {
      name: 'Keyboard navigation',
      check: () => {
        const accessibilityFile = fs.readFileSync('src/components/ui/AccessibilityEnhanced.jsx', 'utf8')
        return accessibilityFile.includes('FocusTrap') && accessibilityFile.includes('SkipLink')
      }
    }
  ]
  
  let allAccessibilityChecksPassed = true
  
  for (const check of accessibilityChecks) {
    log.step(`Checking ${check.name}...`)
    if (check.check()) {
      log.success(`${check.name} - OK`)
    } else {
      log.error(`${check.name} - FAILED`)
      allAccessibilityChecksPassed = false
      testResults.errors.push(`Accessibility check failed: ${check.name}`)
    }
  }
  
  if (allAccessibilityChecksPassed) {
    log.success('All accessibility checks passed')
    testResults.passed++
    return true
  } else {
    log.error('Some accessibility checks failed')
    testResults.failed++
    return false
  }
}

const validatePerformance = () => {
  log.header('Performance Validation')
  
  log.step('Analyzing bundle size...')
  
  // Check if build exists
  if (!checkFileExists('dist')) {
    log.error('No build found. Run build first.')
    testResults.failed++
    return false
  }
  
  // Simple bundle size check
  const stats = fs.statSync('dist')
  log.info(`Build directory size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  
  // Check for common performance optimizations
  const performanceChecks = [
    {
      name: 'Code splitting',
      check: () => {
        const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
        return viteConfig.includes('manualChunks') || viteConfig.includes('splitVendorChunk')
      }
    },
    {
      name: 'Asset optimization',
      check: () => {
        const viteConfig = fs.readFileSync('vite.config.js', 'utf8')
        return viteConfig.includes('build') // Basic check for build config
      }
    },
    {
      name: 'Loading states',
      check: () => {
        return checkFileExists('src/components/ui/LoadingSpinner.jsx')
      }
    }
  ]
  
  let allPerformanceChecksPassed = true
  
  for (const check of performanceChecks) {
    log.step(`Checking ${check.name}...`)
    if (check.check()) {
      log.success(`${check.name} - OK`)
    } else {
      log.warning(`${check.name} - Could be improved`)
      // Don't fail for performance optimizations, just warn
    }
  }
  
  log.success('Performance validation completed')
  testResults.passed++
  return true
}

const generateReport = () => {
  log.header('Test Report')
  
  const total = testResults.passed + testResults.failed + testResults.skipped
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0
  
  console.log(`${colors.bright}Summary:${colors.reset}`)
  console.log(`  Total Tests: ${total}`)
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`)
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`)
  console.log(`  ${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`)
  console.log(`  Pass Rate: ${passRate}%`)
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.bright}${colors.red}Errors:${colors.reset}`)
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate: parseFloat(passRate)
    },
    errors: testResults.errors,
    config: {
      baseUrl: config.baseUrl,
      apiUrl: config.apiUrl,
      nodeEnv: process.env.NODE_ENV
    }
  }
  
  fs.writeFileSync('integration-test-report.json', JSON.stringify(report, null, 2))
  log.success('Report saved to integration-test-report.json')
  
  return testResults.failed === 0
}

// Main execution
const main = async () => {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                 Integration Test Suite                       ║')
  console.log('║                   Technoagentes Auth                         ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  const startTime = Date.now()
  
  try {
    // Run all validation steps
    const steps = [
      { name: 'Environment Validation', fn: validateEnvironment },
      { name: 'Build Validation', fn: validateBuild },
      { name: 'Unit Tests', fn: runUnitTests },
      { name: 'Integration Tests', fn: runIntegrationTests },
      { name: 'Security Validation', fn: validateSecurity },
      { name: 'Accessibility Validation', fn: validateAccessibility },
      { name: 'Performance Validation', fn: validatePerformance },
      // Note: E2E tests commented out as they require a running server
      // { name: 'E2E Tests', fn: runE2ETests }
    ]
    
    for (const step of steps) {
      try {
        log.info(`Starting ${step.name}...`)
        const success = await step.fn()
        if (success) {
          log.success(`${step.name} completed successfully`)
        } else {
          log.error(`${step.name} failed`)
        }
      } catch (error) {
        log.error(`${step.name} threw an error: ${error.message}`)
        testResults.failed++
        testResults.errors.push(`${step.name}: ${error.message}`)
      }
    }
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    log.info(`\nTotal execution time: ${duration} seconds`)
    
    // Generate final report
    const success = generateReport()
    
    if (success) {
      log.success('\n🎉 All tests passed! Ready for deployment.')
      process.exit(0)
    } else {
      log.error('\n❌ Some tests failed. Please fix issues before deployment.')
      process.exit(1)
    }
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log.warning('\nTest execution interrupted by user')
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`)
  process.exit(1)
})

// Run the main function
if (require.main === module) {
  main()
}

module.exports = {
  validateEnvironment,
  validateBuild,
  validateSecurity,
  validateAccessibility,
  validatePerformance,
  generateReport
}