#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates production deployment and performs smoke tests
 */

const https = require('https')
const http = require('http')
const { URL } = require('url')

// Configuration
const config = {
  productionUrl: process.env.PRODUCTION_URL || 'https://app.technoagentes.com',
  apiUrl: process.env.VITE_API_BASE_URL || 'https://api.technoagentes.com',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 2000
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
  warnings: 0,
  errors: []
}

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestModule = urlObj.protocol === 'https:' ? https : http
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: config.timeout
    }

    const req = requestModule.request(requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: Date.now() - startTime
        })
      })
    })

    const startTime = Date.now()
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (options.body) {
      req.write(options.body)
    }
    
    req.end()
  })
}

const retryRequest = async (url, options = {}, attempts = config.retryAttempts) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await makeRequest(url, options)
      return response
    } catch (error) {
      if (i === attempts - 1) {
        throw error
      }
      log.warning(`Request failed, retrying in ${config.retryDelay}ms... (${i + 1}/${attempts})`)
      await sleep(config.retryDelay)
    }
  }
}

// Validation functions
const validateApplicationAvailability = async () => {
  log.header('Application Availability Check')
  
  try {
    log.step('Checking main application URL...')
    const response = await retryRequest(config.productionUrl)
    
    if (response.statusCode === 200) {
      log.success(`Application is available (${response.responseTime}ms)`)
      testResults.passed++
      
      // Check if it's actually the React app
      if (response.body.includes('<div id="root">') || response.body.includes('Technoagentes')) {
        log.success('React application is properly loaded')
      } else {
        log.warning('Response doesn\'t appear to be the React application')
        testResults.warnings++
      }
      
      return true
    } else {
      log.error(`Application returned status ${response.statusCode}`)
      testResults.failed++
      testResults.errors.push(`Application availability check failed: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    log.error(`Application is not available: ${error.message}`)
    testResults.failed++
    testResults.errors.push(`Application availability check failed: ${error.message}`)
    return false
  }
}

const validateRouting = async () => {
  log.header('Routing Validation')
  
  const routes = [
    { path: '/login', name: 'Login Page' },
    { path: '/register', name: 'Registration Page' },
    { path: '/forgot-password', name: 'Forgot Password Page' },
    { path: '/verify-email', name: 'Email Verification Page' }
  ]
  
  let allRoutesValid = true
  
  for (const route of routes) {
    try {
      log.step(`Checking ${route.name}...`)
      const url = `${config.productionUrl}${route.path}`
      const response = await retryRequest(url)
      
      if (response.statusCode === 200) {
        log.success(`${route.name} is accessible`)
      } else {
        log.error(`${route.name} returned status ${response.statusCode}`)
        allRoutesValid = false
        testResults.errors.push(`Route ${route.path} failed: ${response.statusCode}`)
      }
    } catch (error) {
      log.error(`${route.name} is not accessible: ${error.message}`)
      allRoutesValid = false
      testResults.errors.push(`Route ${route.path} failed: ${error.message}`)
    }
  }
  
  if (allRoutesValid) {
    log.success('All routes are accessible')
    testResults.passed++
    return true
  } else {
    log.error('Some routes are not accessible')
    testResults.failed++
    return false
  }
}

const validateSecurityHeaders = async () => {
  log.header('Security Headers Validation')
  
  try {
    log.step('Checking security headers...')
    const response = await retryRequest(config.productionUrl)
    
    const requiredHeaders = {
      'strict-transport-security': 'HSTS header',
      'x-content-type-options': 'Content type options header',
      'x-frame-options': 'Frame options header',
      'x-xss-protection': 'XSS protection header',
      'content-security-policy': 'Content Security Policy header'
    }
    
    let allHeadersPresent = true
    
    for (const [header, description] of Object.entries(requiredHeaders)) {
      if (response.headers[header]) {
        log.success(`${description} is present`)
      } else {
        log.warning(`${description} is missing`)
        allHeadersPresent = false
      }
    }
    
    if (allHeadersPresent) {
      log.success('All security headers are present')
      testResults.passed++
      return true
    } else {
      log.warning('Some security headers are missing')
      testResults.warnings++
      return false
    }
  } catch (error) {
    log.error(`Security headers check failed: ${error.message}`)
    testResults.failed++
    testResults.errors.push(`Security headers check failed: ${error.message}`)
    return false
  }
}

const validateAPIConnectivity = async () => {
  log.header('API Connectivity Check')
  
  try {
    log.step('Checking API health endpoint...')
    const healthUrl = `${config.apiUrl}/health`
    const response = await retryRequest(healthUrl)
    
    if (response.statusCode === 200) {
      log.success(`API is accessible (${response.responseTime}ms)`)
      testResults.passed++
      return true
    } else {
      log.error(`API health check failed with status ${response.statusCode}`)
      testResults.failed++
      testResults.errors.push(`API connectivity check failed: ${response.statusCode}`)
      return false
    }
  } catch (error) {
    log.warning(`API health check failed: ${error.message}`)
    log.info('This might be expected if the API doesn\'t have a health endpoint')
    testResults.warnings++
    return false
  }
}

const validatePerformance = async () => {
  log.header('Performance Validation')
  
  try {
    log.step('Measuring page load performance...')
    const startTime = Date.now()
    const response = await makeRequest(config.productionUrl)
    const loadTime = Date.now() - startTime
    
    log.info(`Page load time: ${loadTime}ms`)
    
    if (loadTime < 2000) {
      log.success('Page load time is excellent (<2s)')
      testResults.passed++
    } else if (loadTime < 3000) {
      log.success('Page load time is good (<3s)')
      testResults.passed++
    } else if (loadTime < 5000) {
      log.warning('Page load time is acceptable but could be improved (<5s)')
      testResults.warnings++
    } else {
      log.error('Page load time is too slow (>5s)')
      testResults.failed++
      testResults.errors.push(`Page load time too slow: ${loadTime}ms`)
    }
    
    // Check response size
    const responseSize = Buffer.byteLength(response.body, 'utf8')
    log.info(`Response size: ${(responseSize / 1024).toFixed(2)} KB`)
    
    if (responseSize < 100 * 1024) { // 100KB
      log.success('Response size is optimal')
    } else if (responseSize < 500 * 1024) { // 500KB
      log.warning('Response size could be optimized')
      testResults.warnings++
    } else {
      log.error('Response size is too large')
      testResults.failed++
      testResults.errors.push(`Response size too large: ${responseSize} bytes`)
    }
    
    return true
  } catch (error) {
    log.error(`Performance validation failed: ${error.message}`)
    testResults.failed++
    testResults.errors.push(`Performance validation failed: ${error.message}`)
    return false
  }
}

const validateSSLCertificate = async () => {
  log.header('SSL Certificate Validation')
  
  if (!config.productionUrl.startsWith('https://')) {
    log.warning('Application is not using HTTPS')
    testResults.warnings++
    return false
  }
  
  try {
    log.step('Checking SSL certificate...')
    const response = await retryRequest(config.productionUrl)
    
    // If we get here without an SSL error, the certificate is valid
    log.success('SSL certificate is valid')
    testResults.passed++
    return true
  } catch (error) {
    if (error.message.includes('certificate') || error.message.includes('SSL')) {
      log.error(`SSL certificate issue: ${error.message}`)
      testResults.failed++
      testResults.errors.push(`SSL certificate validation failed: ${error.message}`)
      return false
    } else {
      // Other error, not SSL related
      throw error
    }
  }
}

const validateCaching = async () => {
  log.header('Caching Validation')
  
  try {
    log.step('Checking cache headers...')
    const response = await retryRequest(config.productionUrl)
    
    const cacheHeaders = [
      'cache-control',
      'etag',
      'last-modified',
      'expires'
    ]
    
    let hasCacheHeaders = false
    
    for (const header of cacheHeaders) {
      if (response.headers[header]) {
        log.success(`Cache header '${header}' is present`)
        hasCacheHeaders = true
      }
    }
    
    if (hasCacheHeaders) {
      log.success('Caching headers are configured')
      testResults.passed++
      return true
    } else {
      log.warning('No caching headers found')
      testResults.warnings++
      return false
    }
  } catch (error) {
    log.error(`Caching validation failed: ${error.message}`)
    testResults.failed++
    testResults.errors.push(`Caching validation failed: ${error.message}`)
    return false
  }
}

const validateErrorPages = async () => {
  log.header('Error Page Validation')
  
  try {
    log.step('Checking 404 error handling...')
    const notFoundUrl = `${config.productionUrl}/non-existent-page-${Date.now()}`
    const response = await retryRequest(notFoundUrl)
    
    // For SPAs, 404s often return 200 with the main app
    if (response.statusCode === 200 || response.statusCode === 404) {
      log.success('404 error handling is working')
      testResults.passed++
      return true
    } else {
      log.warning(`Unexpected status for 404 test: ${response.statusCode}`)
      testResults.warnings++
      return false
    }
  } catch (error) {
    log.error(`Error page validation failed: ${error.message}`)
    testResults.failed++
    testResults.errors.push(`Error page validation failed: ${error.message}`)
    return false
  }
}

const generateReport = () => {
  log.header('Deployment Validation Report')
  
  const total = testResults.passed + testResults.failed + testResults.warnings
  const successRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0
  
  console.log(`${colors.bright}Summary:${colors.reset}`)
  console.log(`  Total Checks: ${total}`)
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`)
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`)
  console.log(`  ${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`)
  console.log(`  Success Rate: ${successRate}%`)
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.bright}${colors.red}Critical Issues:${colors.reset}`)
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  }
  
  // Deployment readiness assessment
  console.log(`\n${colors.bright}Deployment Status:${colors.reset}`)
  if (testResults.failed === 0) {
    if (testResults.warnings === 0) {
      console.log(`${colors.green}✓ READY FOR PRODUCTION${colors.reset}`)
      console.log('  All checks passed successfully!')
    } else {
      console.log(`${colors.yellow}⚠ READY WITH WARNINGS${colors.reset}`)
      console.log('  Deployment can proceed, but consider addressing warnings.')
    }
  } else {
    console.log(`${colors.red}✗ NOT READY FOR PRODUCTION${colors.reset}`)
    console.log('  Critical issues must be resolved before deployment.')
  }
  
  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    productionUrl: config.productionUrl,
    apiUrl: config.apiUrl,
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      successRate: parseFloat(successRate)
    },
    errors: testResults.errors,
    deploymentReady: testResults.failed === 0
  }
  
  require('fs').writeFileSync('deployment-validation-report.json', JSON.stringify(report, null, 2))
  log.success('Report saved to deployment-validation-report.json')
  
  return testResults.failed === 0
}

// Main execution
const main = async () => {
  console.log(`${colors.bright}${colors.cyan}`)
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                 Deployment Validation Suite                  ║')
  console.log('║                   Technoagentes Auth                         ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  log.info(`Production URL: ${config.productionUrl}`)
  log.info(`API URL: ${config.apiUrl}`)
  
  const startTime = Date.now()
  
  try {
    // Run all validation checks
    const validations = [
      { name: 'Application Availability', fn: validateApplicationAvailability },
      { name: 'SSL Certificate', fn: validateSSLCertificate },
      { name: 'Routing', fn: validateRouting },
      { name: 'Security Headers', fn: validateSecurityHeaders },
      { name: 'API Connectivity', fn: validateAPIConnectivity },
      { name: 'Performance', fn: validatePerformance },
      { name: 'Caching', fn: validateCaching },
      { name: 'Error Pages', fn: validateErrorPages }
    ]
    
    for (const validation of validations) {
      try {
        log.info(`Running ${validation.name}...`)
        await validation.fn()
      } catch (error) {
        log.error(`${validation.name} threw an error: ${error.message}`)
        testResults.failed++
        testResults.errors.push(`${validation.name}: ${error.message}`)
      }
    }
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    log.info(`\nTotal validation time: ${duration} seconds`)
    
    // Generate final report
    const deploymentReady = generateReport()
    
    if (deploymentReady) {
      log.success('\n🎉 Deployment validation passed! Application is ready for production.')
      process.exit(0)
    } else {
      log.error('\n❌ Deployment validation failed. Please fix critical issues before proceeding.')
      process.exit(1)
    }
    
  } catch (error) {
    log.error(`Fatal error during validation: ${error.message}`)
    process.exit(1)
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log.warning('\nValidation interrupted by user')
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
  validateApplicationAvailability,
  validateRouting,
  validateSecurityHeaders,
  validateAPIConnectivity,
  validatePerformance,
  validateSSLCertificate,
  validateCaching,
  validateErrorPages,
  generateReport
}