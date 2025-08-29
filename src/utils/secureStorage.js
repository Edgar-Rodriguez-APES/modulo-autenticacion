/**
 * Secure Storage Utility
 * Provides secure token storage with encryption and validation
 */

import { config } from './config'

// Simple encryption/decryption using Web Crypto API
class SecureTokenStorage {
  constructor() {
    this.keyName = 'auth_storage_key'
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
    this.ivLength = 12
  }

  /**
   * Generate or retrieve encryption key
   */
  async getOrCreateKey() {
    try {
      // Try to get existing key from IndexedDB
      const existingKey = await this.getKeyFromStorage()
      if (existingKey) {
        return existingKey
      }

      // Generate new key
      const key = await crypto.subtle.generateKey(
        {
          name: this.algorithm,
          length: this.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      )

      // Store key for future use
      await this.storeKey(key)
      return key
    } catch (error) {
      console.warn('Failed to create encryption key, falling back to plain storage:', error)
      return null
    }
  }

  /**
   * Store encryption key in IndexedDB
   */
  async storeKey(key) {
    try {
      const exportedKey = await crypto.subtle.exportKey('raw', key)
      const keyData = Array.from(new Uint8Array(exportedKey))
      
      // Store in IndexedDB
      const request = indexedDB.open('AuthStorage', 1)
      
      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['keys'], 'readwrite')
          const store = transaction.objectStore('keys')
          store.put({ id: this.keyName, key: keyData })
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
        }
        
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('keys')) {
            db.createObjectStore('keys', { keyPath: 'id' })
          }
        }
      })
    } catch (error) {
      console.warn('Failed to store encryption key:', error)
    }
  }

  /**
   * Retrieve encryption key from IndexedDB
   */
  async getKeyFromStorage() {
    try {
      const request = indexedDB.open('AuthStorage', 1)
      
      return new Promise((resolve, reject) => {
        request.onerror = () => resolve(null)
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('keys')) {
            resolve(null)
            return
          }
          
          const transaction = db.transaction(['keys'], 'readonly')
          const store = transaction.objectStore('keys')
          const getRequest = store.get(this.keyName)
          
          getRequest.onsuccess = async () => {
            if (getRequest.result) {
              try {
                const keyData = new Uint8Array(getRequest.result.key)
                const key = await crypto.subtle.importKey(
                  'raw',
                  keyData,
                  { name: this.algorithm },
                  true,
                  ['encrypt', 'decrypt']
                )
                resolve(key)
              } catch (error) {
                resolve(null)
              }
            } else {
              resolve(null)
            }
          }
          
          getRequest.onerror = () => resolve(null)
        }
      })
    } catch (error) {
      return null
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data) {
    try {
      const key = await this.getOrCreateKey()
      if (!key) {
        return data // Fallback to plain text
      }

      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength))
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedBuffer), iv.length)

      // Convert to base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error)
      return data
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData) {
    try {
      const key = await this.getOrCreateKey()
      if (!key) {
        return encryptedData // Assume plain text
      }

      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength)
      const encrypted = combined.slice(this.ivLength)

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      console.warn('Decryption failed, assuming plain text:', error)
      return encryptedData
    }
  }

  /**
   * Clear all stored keys
   */
  async clearKeys() {
    try {
      const request = indexedDB.open('AuthStorage', 1)
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const db = request.result
          if (db.objectStoreNames.contains('keys')) {
            const transaction = db.transaction(['keys'], 'readwrite')
            const store = transaction.objectStore('keys')
            store.clear()
            transaction.oncomplete = () => resolve()
          } else {
            resolve()
          }
        }
        request.onerror = () => resolve()
      })
    } catch (error) {
      console.warn('Failed to clear keys:', error)
    }
  }
}

// Create singleton instance
const secureStorage = new SecureTokenStorage()

/**
 * Secure token storage interface
 */
export const secureTokenStorage = {
  /**
   * Store token securely
   */
  async setItem(key, value) {
    try {
      const encryptedValue = await secureStorage.encrypt(value)
      
      if (config.security.tokenStorageType === 'sessionStorage') {
        sessionStorage.setItem(key, encryptedValue)
      } else {
        localStorage.setItem(key, encryptedValue)
      }
    } catch (error) {
      console.error('Failed to store token securely:', error)
      // Fallback to regular storage
      if (config.security.tokenStorageType === 'sessionStorage') {
        sessionStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, value)
      }
    }
  },

  /**
   * Retrieve token securely
   */
  async getItem(key) {
    try {
      let encryptedValue
      
      if (config.security.tokenStorageType === 'sessionStorage') {
        encryptedValue = sessionStorage.getItem(key)
      } else {
        encryptedValue = localStorage.getItem(key)
      }

      if (!encryptedValue) {
        return null
      }

      return await secureStorage.decrypt(encryptedValue)
    } catch (error) {
      console.error('Failed to retrieve token securely:', error)
      // Fallback to regular storage
      if (config.security.tokenStorageType === 'sessionStorage') {
        return sessionStorage.getItem(key)
      } else {
        return localStorage.getItem(key)
      }
    }
  },

  /**
   * Remove token securely
   */
  removeItem(key) {
    try {
      if (config.security.tokenStorageType === 'sessionStorage') {
        sessionStorage.removeItem(key)
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  },

  /**
   * Clear all tokens
   */
  async clear() {
    try {
      // Clear storage
      if (config.security.tokenStorageType === 'sessionStorage') {
        sessionStorage.clear()
      } else {
        // Only clear auth-related items from localStorage
        const authKeys = ['accessToken', 'refreshToken', 'user', 'tenant']
        authKeys.forEach(key => localStorage.removeItem(key))
      }

      // Clear encryption keys
      await secureStorage.clearKeys()
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }
}

export default secureTokenStorage