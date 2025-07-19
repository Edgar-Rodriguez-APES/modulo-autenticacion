// Formatting utilities
export const formatters = {
  currency: (amount, locale = 'es-ES', currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  },

  date: (date, locale = 'es-ES', options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
      .format(new Date(date))
  },

  dateTime: (date, locale = 'es-ES') => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  },

  relativeTime: (date, locale = 'es-ES') => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    const now = new Date()
    const target = new Date(date)
    const diffInSeconds = (target - now) / 1000
    const diffInMinutes = diffInSeconds / 60
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (Math.abs(diffInDays) >= 1) {
      return rtf.format(Math.round(diffInDays), 'day')
    } else if (Math.abs(diffInHours) >= 1) {
      return rtf.format(Math.round(diffInHours), 'hour')
    } else {
      return rtf.format(Math.round(diffInMinutes), 'minute')
    }
  },

  truncateText: (text, maxLength = 100) => {
    if (!text) return ''
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  },

  capitalize: (text) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  formatNumber: (number, locale = 'es-ES') => {
    return new Intl.NumberFormat(locale).format(number)
  },

  formatPercentage: (value, locale = 'es-ES', decimals = 1) => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100)
  }
}

export default formatters