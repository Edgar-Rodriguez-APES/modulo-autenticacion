#!/usr/bin/env node

/**
 * Security Audit Script
 * Performs comprehensive security analysis of the application
 */

import { readFileSync, writeFileSync } from 'fs'
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
}

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.magenta}🔒 ${msg}${colors.reset}`)
}

/**
 * Audit environment configuration
 */
function auditEnvironmentConfig() {
  log.header('Auditing Environment Configuration...')
  
  const issues = []
  const recommendations = []

  try {
    // Check .env files
    const envFiles = ['.env', '.env.production', '.env.development']
    
    envFiles.forEach(file => {
      try {
        const envPath = join(__dirname, '..', file)
        const envContent = readFileSync(envPath, 'utf8')
        
        // Check for HTTPS URLs
        if (envContent.includes('http://') && !envContent.includes('localhost')) {
          issues.push(`${file}: Contains non-HTTPS URLs`)
          recommendations.push(`Update ${file} to use HTTPS URLs only`)
        }
        
        // Check for security settings
        if (!envContent.includes('VITE_ENABLE_HTTPS_ONLY=true') && file.includes('production')) {
          issues.push(`${file}: HTTPS not enforced`)
          recommendations.push(`Set VITE_ENABLE_HTTPS_ONLY=true in ${file}`)
        }
        
        if (!envContent.includes('VITE_ENABLE_CSRF_PROTECTION=true')) {
          issues.push(`${file}: CSRF protection not enabled`)
          recommendations.push(`Set VITE_ENABLE_CSRF_PROTECTION=true in ${file}`)
        }
        
        log.success(`${file} configuration checked`)
        
      } catch (error) {
        if (file === '.env') {
          issues.push(`Missing ${file} file`)
          recommendations.push(`Create ${file} file with proper configuration`)
        }
      }
    })
    
  } catch (error) {
    log.error(`Environment audit failed: ${error.message}`)
  }

  return { issues, recommendations }
}

/**
 * Audit source code for security issues
 */
function auditSourceCode() {
  log.header('Auditing Source Code...')
  
  const issues = []
  const recommendations = []

  try {
    // Check for common security anti-patterns
    const srcFiles = [
      'src/utils/api.js',
      'src/utils/tokenManager.js',
      'src/context/AuthContext.jsx'
    ]

    srcFiles.forEach(file => {
      try {
        const filePath = join(__dirname, '..', file)
        const content = readFileSync(filePath, 'utf8')
        
        // Check for hardcoded secrets
        if (content.match(/(?:password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/i)) {
          issues.push(`${file}: Potential hardcoded secrets`)
          recommendations.push(`Remove hardcoded secrets from ${file}`)
        }
        
        // Check for console.log in production code
        if (content.includes('console.log') && !content.includes('config.app.debugLogs')) {
          issues.push(`${file}: Contains console.log statements`)
          recommendations.push(`Remove or guard console.log statements in ${file}`)
        }
        
        // Check for eval usage
        if (content.includes('eval(')) {
          issues.push(`${file}: Uses eval() function`)
          recommendations.push(`Remove eval() usage from ${file}`)
        }
        
        log.success(`${file} security checked`)
        
      } catch (error) {
        log.warning(`Could not read ${file}: ${error.message}`)
      }
    })
    
  } catch (error) {
    log.error(`Source code audit failed: ${error.message}`)
  }

  return { issues, recommendations }
}

/**
 * Audit dependencies for known vulnerabilities
 */
function auditDependencies() {
  log.header('Auditing Dependencies...')
  
  const issues = []
  const recommendations = []

  try {
    const packageJsonPath = join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    
    // Check for known vulnerable packages (simplified check)
    const vulnerablePackages = [
      'lodash', // Example - check for old versions
      'moment', // Example - deprecated
    ]
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    vulnerablePackages.forEach(pkg => {
      if (allDeps[pkg]) {
        issues.push(`Potentially vulnerable package: ${pkg}`)
        recommendations.push(`Review and update ${pkg} to latest secure version`)
      }
    })
    
    // Check for missing security-related packages
    const securityPackages = [
      '@testing-library/jest-dom',
      'vitest'
    ]
    
    securityPackages.forEach(pkg => {
      if (!allDeps[pkg]) {
        recommendations.push(`Consider adding ${pkg} for better security testing`)
      }
    })
    
    log.success('Dependencies security checked')
    
  } catch (error) {
    log.error(`Dependencies audit failed: ${error.message}`)
  }

  return { issues, recommendations }
}

/**
 * Audit build configuration
 */
function auditBuildConfig() {
  log.header('Auditing Build Configuration...')
  
  const issues = []
  const recommendations = []

  try {
    // Check Vite configuration
    const viteConfigPath = join(__dirname, '..', 'vite.config.js')
    const viteConfig = readFileSync(viteConfigPath, 'utf8')
    
    // Check for source maps in production
    if (!viteConfig.includes('sourcemap: true')) {
      recommendations.push('Enable source maps for better debugging')
    }
    
    // Check for security headers configuration
    if (!viteConfig.includes('headers')) {
      issues.push('Missing security headers configuration in Vite')
      recommendations.push('Add security headers to Vite configuration')
    }
    
    log.success('Build configuration checked')
    
  } catch (error) {
    log.warning(`Build config audit failed: ${error.message}`)
  }

  return { issues, recommendations }
}

/**
 * Generate security report
 */
function generateSecurityReport(auditResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      recommendations: 0
    },
    categories: {},
    overallScore: 0
  }

  // Aggregate results
  Object.entries(auditResults).forEach(([category, results]) => {
    report.categories[category] = results
    report.summary.totalIssues += results.issues.length
    report.summary.recommendations += results.recommendations.length
    
    // Count critical issues (simplified)
    const criticalKeywords = ['secret', 'eval', 'https', 'csrf']
    results.issues.forEach(issue => {
      if (criticalKeywords.some(keyword => issue.toLowerCase().includes(keyword))) {
        report.summary.criticalIssues++
      }
    })
  })

  // Calculate overall score
  const maxPossibleIssues = 20 // Arbitrary baseline
  const issueScore = Math.max(0, maxPossibleIssues - report.summary.totalIssues)
  report.overallScore = Math.round((issueScore / maxPossibleIssues) * 100)

  return report
}

/**
 * Main audit function
 */
async function runSecurityAudit() {
  console.log('🔒 Security Audit Tool\n')

  const auditResults = {
    environment: auditEnvironmentConfig(),
    sourceCode: auditSourceCode(),
    dependencies: auditDependencies(),
    buildConfig: auditBuildConfig()
  }

  // Generate report
  const report = generateSecurityReport(auditResults)

  // Display summary
  console.log('\n📊 Security Audit Summary:')
  console.log(`Overall Score: ${report.overallScore}/100`)
  console.log(`Total Issues: ${report.summary.totalIssues}`)
  console.log(`Critical Issues: ${report.summary.criticalIssues}`)
  console.log(`Recommendations: ${report.summary.recommendations}`)

  // Display issues by category
  Object.entries(report.categories).forEach(([category, results]) => {
    if (results.issues.length > 0) {
      console.log(`\n❌ ${category.toUpperCase()} Issues:`)
      results.issues.forEach(issue => console.log(`  - ${issue}`))
    }
  })

  // Display recommendations
  const allRecommendations = Object.values(report.categories)
    .flatMap(results => results.recommendations)

  if (allRecommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    allRecommendations.forEach(rec => console.log(`  - ${rec}`))
  }

  // Save report to file
  const reportPath = join(__dirname, '..', 'security-audit-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log.success(`Security report saved to: ${reportPath}`)

  // Exit with appropriate code
  if (report.summary.criticalIssues > 0) {
    log.error('Critical security issues found!')
    process.exit(1)
  } else if (report.summary.totalIssues > 0) {
    log.warning('Security issues found that should be addressed')
    process.exit(0)
  } else {
    log.success('No security issues found!')
    process.exit(0)
  }
}

// Run the audit
runSecurityAudit().catch(error => {
  log.error(`Security audit failed: ${error.message}`)
  process.exit(1)
})