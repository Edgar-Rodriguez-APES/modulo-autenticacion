import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../components/ui/Toast'

/**
 * Enhanced Form Experience Hook
 * Provides comprehensive UX enhancements for authentication forms
 */
export const useFormExperience = ({
  onSubmit,
  validationSchema,
  autoSave = false,
  autoSaveDelay = 2000,
  successMessage = '¡Operación completada exitosamente!',
  loadingMessage = 'Procesando...',
  enableProgressTracking = false
}) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const toast = useToast()
  const autoSaveTimeoutRef = useRef(null)
  const validationTimeoutRef = useRef(null)

  // Calculate form completion progress
  const calculateProgress = useCallback(() => {
    if (!enableProgressTracking) return 0
    
    const totalFields = Object.keys(validationSchema?.fields || {}).length
    if (totalFields === 0) return 0
    
    const completedFields = Object.keys(formData).filter(key => {
      const value = formData[key]
      return value && value.toString().trim().length > 0
    }).length
    
    return Math.round((completedFields / totalFields) * 100)
  }, [formData, validationSchema, enableProgressTracking])

  // Update progress when form data changes
  useEffect(() => {
    const newProgress = calculateProgress()
    setProgress(newProgress)
  }, [calculateProgress])

  // Debounced validation
  const validateField = useCallback(async (fieldName, value) => {
    if (!validationSchema) return

    try {
      setIsValidating(true)
      
      // Clear previous validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      // Debounce validation
      validationTimeoutRef.current = setTimeout(async () => {
        try {
          await validationSchema.validateAt(fieldName, { [fieldName]: value })
          setErrors(prev => ({ ...prev, [fieldName]: null }))
        } catch (error) {
          setErrors(prev => ({ ...prev, [fieldName]: error.message }))
        } finally {
          setIsValidating(false)
        }
      }, 300)
    } catch (error) {
      setIsValidating(false)
    }
  }, [validationSchema])

  // Handle field changes
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    // Validate field if it's been touched or submit was attempted
    if (touched[fieldName] || submitAttempted) {
      validateField(fieldName, value)
    }

    // Auto-save functionality
    if (autoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Save to localStorage or perform auto-save action
        try {
          localStorage.setItem('formAutoSave', JSON.stringify({
            ...formData,
            [fieldName]: value,
            timestamp: Date.now()
          }))
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }, autoSaveDelay)
    }
  }, [formData, touched, submitAttempted, validateField, autoSave, autoSaveDelay])

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }))
    
    if (formData[fieldName] !== undefined) {
      validateField(fieldName, formData[fieldName])
    }
  }, [formData, validateField])

  // Validate entire form
  const validateForm = useCallback(async () => {
    if (!validationSchema) return true

    try {
      await validationSchema.validate(formData, { abortEarly: false })
      setErrors({})
      return true
    } catch (error) {
      const newErrors = {}
      error.inner?.forEach(err => {
        newErrors[err.path] = err.message
      })
      setErrors(newErrors)
      return false
    }
  }, [formData, validationSchema])

  // Enhanced form submission
  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault()
    }

    setSubmitAttempted(true)
    setIsSubmitting(true)

    try {
      // Validate form
      const isValid = await validateForm()
      if (!isValid) {
        toast.error('Por favor corrige los errores en el formulario')
        return false
      }

      // Show loading toast
      const loadingToastId = toast.info(loadingMessage, { duration: 0 })

      try {
        // Call the actual submit function
        const result = await onSubmit(formData)
        
        // Remove loading toast
        toast.removeToast(loadingToastId)
        
        // Show success message
        toast.success(successMessage)
        
        // Clear auto-saved data on successful submit
        if (autoSave) {
          localStorage.removeItem('formAutoSave')
        }
        
        return result
      } catch (error) {
        // Remove loading toast
        toast.removeToast(loadingToastId)
        
        // Show error message
        const errorMessage = error.message || 'Ocurrió un error inesperado'
        toast.error(errorMessage)
        
        throw error
      }
    } catch (error) {
      console.error('Form submission error:', error)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSubmit, toast, loadingMessage, successMessage, autoSave])

  // Load auto-saved data on mount
  useEffect(() => {
    if (autoSave) {
      try {
        const saved = localStorage.getItem('formAutoSave')
        if (saved) {
          const { timestamp, ...savedData } = JSON.parse(saved)
          
          // Only restore if saved within last 24 hours
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setFormData(savedData)
            toast.info('Se restauraron los datos guardados automáticamente', {
              action: {
                label: 'Descartar',
                onClick: () => {
                  setFormData({})
                  localStorage.removeItem('formAutoSave')
                }
              }
            })
          }
        }
      } catch (error) {
        console.warn('Failed to load auto-saved data:', error)
      }
    }
  }, [autoSave, toast])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  // Get field props for easy integration
  const getFieldProps = useCallback((fieldName) => ({
    value: formData[fieldName] || '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e
      handleFieldChange(fieldName, value)
    },
    onBlur: () => handleFieldBlur(fieldName),
    error: touched[fieldName] && errors[fieldName],
    'aria-invalid': touched[fieldName] && !!errors[fieldName],
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined
  }), [formData, handleFieldChange, handleFieldBlur, touched, errors])

  // Check if form has any errors
  const hasErrors = Object.values(errors).some(error => error)
  
  // Check if form is valid and complete
  const isFormValid = !hasErrors && Object.keys(touched).length > 0
  
  // Check if form has unsaved changes
  const hasUnsavedChanges = Object.keys(formData).length > 0

  return {
    // Form state
    formData,
    errors,
    touched,
    isSubmitting,
    isValidating,
    submitAttempted,
    progress,
    hasErrors,
    isFormValid,
    hasUnsavedChanges,
    
    // Form handlers
    handleSubmit,
    handleFieldChange,
    handleFieldBlur,
    getFieldProps,
    
    // Utility functions
    setFormData,
    setErrors,
    validateForm,
    validateField,
    
    // Reset form
    resetForm: () => {
      setFormData({})
      setErrors({})
      setTouched({})
      setSubmitAttempted(false)
      setProgress(0)
      if (autoSave) {
        localStorage.removeItem('formAutoSave')
      }
    }
  }
}

/**
 * Simple form experience hook for basic forms
 */
export const useSimpleForm = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }, [])

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  const getFieldProps = useCallback((fieldName) => ({
    value: formData[fieldName] || '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e
      handleChange(fieldName, value)
    }
  }), [formData, handleChange])

  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    getFieldProps,
    setFormData
  }
}

export default useFormExperience