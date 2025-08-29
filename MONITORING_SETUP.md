# Production Monitoring and Alerting Setup

This document outlines the monitoring and alerting setup for the Technoagentes authentication system in production.

## Overview

The monitoring strategy covers:
- Application performance monitoring
- Error tracking and logging
- User experience monitoring
- Security event monitoring
- Infrastructure health monitoring

## Application Performance Monitoring (APM)

### Frontend Performance Monitoring

#### Core Web Vitals Tracking
```javascript
// src/utils/performance.js
export const trackWebVitals = () => {
  // Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    
    // Send to analytics
    gtag('event', 'web_vitals', {
      event_category: 'Performance',
      event_label: 'LCP',
      value: Math.round(lastEntry.startTime)
    })
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: 'FID',
        value: Math.round(entry.processingStart - entry.startTime)
      })
    })
  }).observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    })
    
    gtag('event', 'web_vitals', {
      event_category: 'Performance',
      event_label: 'CLS',
      value: Math.round(clsValue * 1000)
    })
  }).observe({ entryTypes: ['layout-shift'] })
}
```

#### Page Load Performance
```javascript
// Track page load times
export const trackPageLoad = (pageName) => {
  const navigationTiming = performance.getEntriesByType('navigation')[0]
  
  const metrics = {
    dns_lookup: navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
    tcp_connect: navigationTiming.connectEnd - navigationTiming.connectStart,
    request_response: navigationTiming.responseEnd - navigationTiming.requestStart,
    dom_processing: navigationTiming.domContentLoadedEventEnd - navigationTiming.responseEnd,
    total_load_time: navigationTiming.loadEventEnd - navigationTiming.navigationStart
  }
  
  // Send to analytics
  Object.entries(metrics).forEach(([metric, value]) => {
    gtag('event', 'page_performance', {
      event_category: 'Performance',
      event_label: `${pageName}_${metric}`,
      value: Math.round(value)
    })
  })
}
```

### Error Tracking

#### JavaScript Error Monitoring
```javascript
// src/utils/errorTracking.js
export const initErrorTracking = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    trackError({
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  })

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    trackError({
      type: 'unhandled_promise_rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    })
  })
}

const trackError = (errorData) => {
  // Send to error tracking service (e.g., Sentry, LogRocket)
  console.error('Error tracked:', errorData)
  
  // Send to analytics
  gtag('event', 'exception', {
    description: errorData.message,
    fatal: false
  })
  
  // Send to custom logging endpoint
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  }).catch(() => {
    // Silently fail if logging endpoint is unavailable
  })
}
```

#### Authentication Error Tracking
```javascript
// src/utils/authErrorTracking.js
export const trackAuthError = (errorType, errorDetails) => {
  const errorData = {
    type: 'auth_error',
    subtype: errorType,
    details: errorDetails,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  }
  
  // Track specific auth error types
  const authErrorTypes = {
    'login_failed': 'Login attempt failed',
    'registration_failed': 'Registration attempt failed',
    'token_refresh_failed': 'Token refresh failed',
    'session_expired': 'User session expired',
    'invalid_credentials': 'Invalid credentials provided',
    'email_verification_failed': 'Email verification failed',
    'password_reset_failed': 'Password reset failed'
  }
  
  gtag('event', 'auth_error', {
    event_category: 'Authentication',
    event_label: authErrorTypes[errorType] || errorType,
    value: 1
  })
  
  // Send to logging service
  trackError(errorData)
}
```

### User Experience Monitoring

#### User Flow Tracking
```javascript
// src/utils/userFlowTracking.js
export const trackUserFlow = (flowName, stepName, status = 'started') => {
  gtag('event', 'user_flow', {
    event_category: 'User Experience',
    event_label: `${flowName}_${stepName}`,
    custom_parameter_1: status,
    value: status === 'completed' ? 1 : 0
  })
}

// Usage examples:
// trackUserFlow('registration', 'step_1_company_info', 'started')
// trackUserFlow('registration', 'step_1_company_info', 'completed')
// trackUserFlow('login', 'credentials_entered', 'completed')
// trackUserFlow('password_reset', 'email_sent', 'completed')
```

#### Form Interaction Tracking
```javascript
// src/utils/formTracking.js
export const trackFormInteraction = (formName, fieldName, interactionType) => {
  gtag('event', 'form_interaction', {
    event_category: 'Form Usage',
    event_label: `${formName}_${fieldName}_${interactionType}`,
    value: 1
  })
}

// Track form abandonment
export const trackFormAbandonment = (formName, completionPercentage) => {
  gtag('event', 'form_abandonment', {
    event_category: 'Form Usage',
    event_label: formName,
    value: Math.round(completionPercentage)
  })
}
```

## Security Event Monitoring

### Security Event Tracking
```javascript
// src/utils/securityTracking.js
export const trackSecurityEvent = (eventType, details) => {
  const securityEvent = {
    type: 'security_event',
    subtype: eventType,
    details: details,
    userAgent: navigator.userAgent,
    ip: getUserIP(), // Implement IP detection
    url: window.location.href,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  }
  
  // Send to security monitoring service
  fetch('/api/security-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(securityEvent)
  })
  
  // Track in analytics (without sensitive details)
  gtag('event', 'security_event', {
    event_category: 'Security',
    event_label: eventType,
    value: 1
  })
}

// Security event types to track:
// - multiple_failed_login_attempts
// - suspicious_registration_pattern
// - token_manipulation_attempt
// - csrf_token_mismatch
// - rate_limit_exceeded
// - unusual_user_agent
// - suspicious_ip_address
```

## Infrastructure Monitoring

### AWS CloudWatch Metrics

#### Custom Metrics for Amplify
```yaml
# CloudWatch Dashboard Configuration
Resources:
  TechnoagentesAuthDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: TechnoagentesAuth
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Amplify", "Requests", "AppId", "${AmplifyAppId}"],
                  [".", "BytesDownloaded", ".", "."],
                  [".", "BytesUploaded", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "Amplify Metrics"
              }
            },
            {
              "type": "log",
              "properties": {
                "query": "SOURCE '/aws/amplify/${AmplifyAppId}' | fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 100",
                "region": "us-east-1",
                "title": "Recent Errors"
              }
            }
          ]
        }
```

### Uptime Monitoring
```javascript
// Health check endpoint monitoring
const healthCheckConfig = {
  endpoints: [
    {
      name: 'Frontend Application',
      url: 'https://app.technoagentes.com/health',
      expectedStatus: 200,
      timeout: 5000,
      interval: 60000 // Check every minute
    },
    {
      name: 'Auth API',
      url: 'https://api.technoagentes.com/health',
      expectedStatus: 200,
      timeout: 5000,
      interval: 60000
    }
  ],
  alerting: {
    email: ['ops@technoagentes.com'],
    slack: '#alerts',
    threshold: 3 // Alert after 3 consecutive failures
  }
}
```

## Alerting Configuration

### Critical Alerts (Immediate Response Required)

1. **Application Down**
   - Trigger: 3+ consecutive health check failures
   - Channels: Email, SMS, Slack
   - Escalation: 5 minutes

2. **High Error Rate**
   - Trigger: Error rate > 5% over 5 minutes
   - Channels: Email, Slack
   - Escalation: 10 minutes

3. **Authentication Failures Spike**
   - Trigger: Failed login attempts > 100/minute
   - Channels: Email, Slack (Security team)
   - Escalation: Immediate

4. **Security Events**
   - Trigger: Any security event detected
   - Channels: Email, Slack (Security team)
   - Escalation: Immediate

### Warning Alerts (Monitor and Investigate)

1. **Performance Degradation**
   - Trigger: Page load time > 3 seconds (95th percentile)
   - Channels: Slack
   - Escalation: 30 minutes

2. **Increased Error Rate**
   - Trigger: Error rate > 2% over 10 minutes
   - Channels: Slack
   - Escalation: 20 minutes

3. **Form Abandonment Spike**
   - Trigger: Form abandonment rate > 50%
   - Channels: Slack (Product team)
   - Escalation: 1 hour

### Info Alerts (Daily/Weekly Reports)

1. **Daily Performance Summary**
   - Metrics: Page load times, error rates, user flows
   - Schedule: Daily at 9 AM
   - Channel: Email

2. **Weekly Security Report**
   - Metrics: Security events, failed login attempts, suspicious activity
   - Schedule: Monday at 9 AM
   - Channel: Email (Security team)

## Monitoring Tools Integration

### Google Analytics 4
```javascript
// GA4 Configuration
gtag('config', 'GA_MEASUREMENT_ID', {
  // Enhanced ecommerce for user journey tracking
  enhanced_ecommerce: true,
  
  // Custom dimensions
  custom_map: {
    'custom_parameter_1': 'user_type',
    'custom_parameter_2': 'tenant_id',
    'custom_parameter_3': 'auth_method'
  },
  
  // Privacy settings
  anonymize_ip: true,
  allow_google_signals: false
})
```

### Sentry Error Tracking
```javascript
// Sentry Configuration
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: 0.1,
  
  // Error filtering
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values[0]
      if (error.type === 'ChunkLoadError') {
        return null // Ignore chunk load errors
      }
    }
    return event
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'auth-frontend'
    }
  }
})
```

### LogRocket Session Replay
```javascript
// LogRocket Configuration
import LogRocket from 'logrocket'

LogRocket.init(process.env.VITE_LOGROCKET_APP_ID, {
  // Privacy settings
  shouldCaptureIP: false,
  
  // Performance settings
  mergeIframes: true,
  
  // Network request sanitization
  network: {
    requestSanitizer: request => {
      // Remove sensitive headers
      if (request.headers.authorization) {
        request.headers.authorization = '[REDACTED]'
      }
      return request
    },
    
    responseSanitizer: response => {
      // Remove sensitive response data
      if (response.body && response.body.token) {
        response.body.token = '[REDACTED]'
      }
      return response
    }
  }
})
```

## Monitoring Checklist

### Pre-Deployment
- [ ] All monitoring tools are configured
- [ ] Error tracking is set up and tested
- [ ] Performance monitoring is active
- [ ] Security event tracking is configured
- [ ] Alert thresholds are properly set
- [ ] Notification channels are tested

### Post-Deployment
- [ ] Verify all metrics are being collected
- [ ] Test alert notifications
- [ ] Confirm dashboard accessibility
- [ ] Validate error tracking functionality
- [ ] Check performance baseline establishment
- [ ] Ensure security monitoring is active

### Ongoing Maintenance
- [ ] Weekly review of alert thresholds
- [ ] Monthly performance trend analysis
- [ ] Quarterly security audit of monitoring
- [ ] Annual review of monitoring strategy
- [ ] Regular testing of alert escalation procedures

## Troubleshooting Common Issues

### Missing Metrics
1. Check environment variable configuration
2. Verify network connectivity to monitoring services
3. Confirm API keys and credentials
4. Review browser console for tracking errors

### False Positive Alerts
1. Review alert thresholds and adjust if necessary
2. Add filters to exclude known non-critical events
3. Implement alert suppression during maintenance windows
4. Consider alert fatigue and consolidation opportunities

### Performance Monitoring Gaps
1. Ensure all critical user journeys are tracked
2. Add custom timing marks for important operations
3. Implement resource timing monitoring
4. Consider real user monitoring (RUM) implementation

## Contact Information

### On-Call Rotation
- **Primary**: DevOps Team Lead
- **Secondary**: Senior Frontend Developer
- **Escalation**: CTO

### Team Contacts
- **Development Team**: dev-team@technoagentes.com
- **Security Team**: security@technoagentes.com
- **Operations Team**: ops@technoagentes.com
- **Product Team**: product@technoagentes.com