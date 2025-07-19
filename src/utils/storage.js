// Local storage helpers with error handling
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  },

  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  },

  exists: (key) => {
    return localStorage.getItem(key) !== null
  }
}

// Session storage helpers
export const sessionStorage = {
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error saving to sessionStorage:', error)
      return false
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Error reading from sessionStorage:', error)
      return defaultValue
    }
  },

  remove: (key) => {
    try {
      window.sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from sessionStorage:', error)
      return false
    }
  },

  clear: () => {
    try {
      window.sessionStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing sessionStorage:', error)
      return false
    }
  }
}

export default storage