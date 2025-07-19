// Common validation functions
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s-()]+$/
    return phoneRegex.test(phone)
  },

  strongPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
  },

  required: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== ''
  },

  minLength: (value, min) => {
    return value && value.toString().length >= min
  },

  maxLength: (value, max) => {
    return value && value.toString().length <= max
  },

  isNumber: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value))
  },

  isPositiveNumber: (value) => {
    return validators.isNumber(value) && parseFloat(value) > 0
  }
}

// Form validation helper
export const validateForm = (data, rules) => {
  const errors = {}

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field]
    const value = data[field]

    fieldRules.forEach(rule => {
      if (typeof rule === 'function') {
        const result = rule(value)
        if (result !== true) {
          errors[field] = result
        }
      } else if (typeof rule === 'object') {
        const { validator, message } = rule
        if (!validator(value)) {
          errors[field] = message
        }
      }
    })
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export default validators