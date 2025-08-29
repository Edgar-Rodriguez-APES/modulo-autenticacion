#!/usr/bin/env node

/**
 * Environment validation script
 * Validates environment configuration before build/deployment
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
}

/**
 * Load environment variables from .env file
 */
function loadEnvFile(envFile) {
  try {
    const envPath = join(__dirname, '..', envFile)
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })
    
    return envVars
  } catch (error) {
    log.warning(`Could not load ${envFile}: ${error.message}`)
    return {}
  }
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment(envVars, envName) {
  log.info(`Validating ${envName} environment configuration...`)
  
  const errors = []
  const warnings = []
  
  // Required variables
  const required = [
    'VITE_AUTH_BASE_URL',
    'VITE_TENANT_BASE_URL',
    'VITE_APP_ENV'
  ]
  
  // Check required variables
  required.forEach(key => {
    if (!envVars[key]) {
      errors.push(`Missing required variable: ${key}`)
    }
  })
  
  // Validate URLs
  if (envVars.VITE_AUTH_BASE_URL) {
    if (!isValidUrl(envVars.VITE_AUTH_BASE_URL)) {
      errors.push('VITE_AUTH_BASE_URL is not a valid URL')
    } else if (envVars.VITE_APP_ENV === 'production' && !envVars.VITE_AUTH_BASE_URL.startsWith('https://')) {
      errors.push('VITE_AUTH_BASE_URL must use HTTPS in production')
    }
  }
  
  if (envVars.VITE_TENANT_BASE_URL) {
    if (!isValidUrl(envVars.VITE_TENANT_BASE_URL)) {
      errors.push('VITE_TENANT_BASE_URL is not a valid URL')
    } else if (envVars.VITE_APP_ENV === 'production' && !envVars.VITE_TENANT_BASE_URL.startsWith('https://')) {
      errors.push('VITE_TENANT_BASE_URL must use HTTPS in production')
    }
  }
  
  // Validate environment value
  if (envVars.VITE_APP_ENV && !['development', 'production', 'test'].includes(envVars.VITE_APP_ENV)) {
    errors.push('VITE_APP_ENV must be one of: development, production, test')
  }
  
  // Check security settings for production
  if (envVars.VITE_APP_ENV === 'production') {
    if (envVars.VITE_ENABLE_HTTPS_ONLY !== 'true') {
      warnings.push('VITE_ENABLE_HTTPS_ONLY should be true in production')
    }
    if (envVars.VITE_DEV_MODE === 'true') {
      warnings.push('VITE_DEV_MODE should be false in production')
    }
  }
  
  // Check for test keys in production
  if (envVars.VITE_APP_ENV === 'production' && envVars.VITE_STRIPE_PUBLISHABLE_KEY?.includes('test')) {
    errors.push('Using test Stripe key in production environment')
  }
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    log.success(`${envName} configuration is valid`)
  } else {
    if (errors.length > 0) {
      log.error(`${envName} configuration has errors:`)
      errors.forEach(error => console.error(`  - ${error}`))
    }
    
    if (warnings.length > 0) {
      log.warning(`${envName} configuration has warnings:`)
      warnings.forEach(warning => console.warn(`  - ${warning}`))
    }
  }
  
  return { errors, warnings }
}

/**
 * Main validation function
 */
function main() {
  console.log('🔧 Environment Configuration Validator\n')
  
  const environments = [
    { file: '.env', name: 'Default' },
    { file: '.env.development', name: 'Development' },
    { file: '.env.production', name: 'Production' }
  ]
  
  let totalErrors = 0
  let totalWarnings = 0
  
  environments.forEach(({ file, name }) => {
    const envVars = loadEnvFile(file)
    if (Object.keys(envVars).length > 0) {
      const { errors, warnings } = validateEnvironment(envVars, name)
      totalErrors += errors.length
      totalWarnings += warnings.length
      console.log('')
    }
  })
  
  // Summary
  console.log('📊 Validation Summary:')
  if (totalErrors === 0) {
    log.success('All configurations are valid!')
  } else {
    log.error(`Found ${totalErrors} error(s) that need to be fixed`)
  }
  
  if (totalWarnings > 0) {
    log.warning(`Found ${totalWarnings} warning(s) that should be reviewed`)
  }
  
  // Exit with error code if there are errors
  process.exit(totalErrors > 0 ? 1 : 0)
}

// Run validation
main()