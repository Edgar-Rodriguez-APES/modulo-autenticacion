#!/usr/bin/env node

/**
 * Test runner script
 * Runs different types of tests based on arguments
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
}

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`)
}

/**
 * Run a command and return a promise
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Run unit tests
 */
async function runUnitTests() {
  log.header('Running Unit Tests')
  try {
    await runCommand('npm', ['run', 'test:run'])
    log.success('Unit tests passed!')
  } catch (error) {
    log.error('Unit tests failed!')
    throw error
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  log.header('Running Integration Tests')
  try {
    await runCommand('npm', ['run', 'test:auth'])
    log.success('Integration tests passed!')
  } catch (error) {
    log.error('Integration tests failed!')
    throw error
  }
}

/**
 * Run E2E tests
 */
async function runE2ETests() {
  log.header('Running E2E Tests')
  try {
    await runCommand('npm', ['run', 'test:e2e'])
    log.success('E2E tests passed!')
  } catch (error) {
    log.error('E2E tests failed!')
    throw error
  }
}

/**
 * Run coverage report
 */
async function runCoverage() {
  log.header('Generating Coverage Report')
  try {
    await runCommand('npm', ['run', 'test:coverage'])
    log.success('Coverage report generated!')
  } catch (error) {
    log.error('Coverage generation failed!')
    throw error
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const testType = args[0] || 'all'

  console.log('🧪 Technoagentes Test Runner\n')

  try {
    switch (testType) {
      case 'unit':
        await runUnitTests()
        break

      case 'integration':
        await runIntegrationTests()
        break

      case 'e2e':
        await runE2ETests()
        break

      case 'coverage':
        await runCoverage()
        break

      case 'auth':
        log.header('Running Authentication Tests')
        await runUnitTests()
        await runIntegrationTests()
        log.success('All authentication tests passed!')
        break

      case 'all':
        log.header('Running All Tests')
        await runUnitTests()
        await runIntegrationTests()
        await runE2ETests()
        await runCoverage()
        log.success('All tests passed!')
        break

      case 'ci':
        log.header('Running CI Test Suite')
        await runUnitTests()
        await runIntegrationTests()
        await runCoverage()
        log.success('CI test suite passed!')
        break

      default:
        log.error(`Unknown test type: ${testType}`)
        console.log('\nAvailable test types:')
        console.log('  unit        - Run unit tests only')
        console.log('  integration - Run integration tests only')
        console.log('  e2e         - Run E2E tests only')
        console.log('  auth        - Run all authentication tests')
        console.log('  coverage    - Generate coverage report')
        console.log('  ci          - Run CI test suite (unit + integration + coverage)')
        console.log('  all         - Run all tests')
        process.exit(1)
    }

    console.log('\n🎉 Test execution completed successfully!')

  } catch (error) {
    log.error(`Test execution failed: ${error.message}`)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
  process.exit(1)
})

// Run the main function
main()