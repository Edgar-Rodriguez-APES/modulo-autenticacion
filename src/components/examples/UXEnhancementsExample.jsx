import React, { useState } from 'react'
import { ToastProvider, useToast } from '../ui/Toast'
import { useFormExperience } from '../../hooks/useFormExperience'
import LoadingSpinner from '../ui/LoadingSpinner'
import SuccessAnimation, { ConfettiAnimation, ProgressSuccess } from '../ui/SuccessAnimation'
import { 
  PageTransition, 
  SlideTransition, 
  ScaleTransition, 
  StaggeredAnimation,
  LoadingTransition 
} from '../ui/Transitions'
import {
  AccessibleFormField,
  AccessibleProgress,
  ScreenReaderAnnouncer,
  LoadingAnnouncer,
  FocusTrap,
  AccessibleErrorRecovery
} from '../ui/AccessibilityEnhanced'
import Button from '../ui/Button'
import Card from '../ui/Card'

/**
 * Comprehensive UX Enhancements Example
 * Demonstrates all the new UX components and features
 */
const UXEnhancementsExampleContent = () => {
  const toast = useToast()
  const [currentDemo, setCurrentDemo] = useState('loading')
  const [showModal, setShowModal] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [progressStep, setProgressStep] = useState(0)

  // Form experience hook example
  const {
    formData,
    errors,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    progress,
    resetForm
  } = useFormExperience({
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setFormSubmitted(true)
      return { success: true }
    },
    enableProgressTracking: true,
    successMessage: '¡Formulario enviado exitosamente!',
    autoSave: true
  })

  const progressSteps = [
    { title: 'Información Personal', description: 'Datos básicos del usuario' },
    { title: 'Preferencias', description: 'Configuración de cuenta' },
    { title: 'Verificación', description: 'Confirmar información' },
    { title: 'Completado', description: 'Proceso finalizado' }
  ]

  const demoSections = [
    { id: 'loading', title: 'Estados de Carga', icon: '⏳' },
    { id: 'success', title: 'Animaciones de Éxito', icon: '✅' },
    { id: 'transitions', title: 'Transiciones', icon: '🔄' },
    { id: 'accessibility', title: 'Accesibilidad', icon: '♿' },
    { id: 'forms', title: 'Experiencia de Formularios', icon: '📝' },
    { id: 'notifications', title: 'Notificaciones', icon: '🔔' }
  ]

  const renderLoadingDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Estados de Carga</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Spinner Básico</h4>
          <div className="flex justify-center">
            <LoadingSpinner size="md" showLabel={true} />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Spinner con Variantes</h4>
          <div className="space-y-3">
            <LoadingSpinner size="sm" variant="primary" showLabel={true} label="Cargando datos..." />
            <LoadingSpinner size="md" variant="success" showLabel={true} label="Procesando..." />
            <LoadingSpinner size="lg" variant="danger" showLabel={true} label="Validando..." />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Transición de Carga</h4>
          <LoadingTransition
            isLoading={currentDemo === 'loading'}
            loadingComponent={
              <div className="text-center py-8">
                <LoadingSpinner size="lg" showLabel={true} label="Cargando contenido..." />
              </div>
            }
          >
            <div className="text-center py-8">
              <p className="text-gray-600">¡Contenido cargado!</p>
            </div>
          </LoadingTransition>
        </Card>
      </div>
    </div>
  )

  const renderSuccessDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Animaciones de Éxito</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Animación Simple</h4>
          <div className="flex justify-center">
            <SuccessAnimation 
              message="¡Operación exitosa!"
              size="md"
              showMessage={true}
            />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Progreso de Pasos</h4>
          <ProgressSuccess
            steps={progressSteps}
            currentStep={progressStep}
          />
          <div className="mt-4 flex justify-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setProgressStep(Math.max(0, progressStep - 1))}
              disabled={progressStep === 0}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              onClick={() => setProgressStep(Math.min(progressSteps.length, progressStep + 1))}
              disabled={progressStep === progressSteps.length}
            >
              Siguiente
            </Button>
          </div>
        </Card>

        <Card className="p-4 col-span-full">
          <h4 className="font-medium mb-3">Confetti (Celebración)</h4>
          <div className="text-center">
            <Button
              onClick={() => {
                // Trigger confetti
                const confettiContainer = document.createElement('div')
                document.body.appendChild(confettiContainer)
                
                // Remove after animation
                setTimeout(() => {
                  document.body.removeChild(confettiContainer)
                }, 3000)
              }}
            >
              ¡Celebrar!
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderTransitionsDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Transiciones</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Transición de Escala</h4>
          <div className="text-center">
            <Button onClick={() => setShowModal(true)}>
              Mostrar Modal
            </Button>
          </div>
          
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <ScaleTransition show={showModal}>
                <Card className="p-6 max-w-sm mx-4">
                  <h5 className="font-semibold mb-2">Modal de Ejemplo</h5>
                  <p className="text-gray-600 mb-4">
                    Este modal aparece con una animación de escala suave.
                  </p>
                  <Button onClick={() => setShowModal(false)}>
                    Cerrar
                  </Button>
                </Card>
              </ScaleTransition>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Animación Escalonada</h4>
          <StaggeredAnimation staggerDelay={200} animation="fadeUp">
            <div className="p-3 bg-blue-50 rounded mb-2">Elemento 1</div>
            <div className="p-3 bg-green-50 rounded mb-2">Elemento 2</div>
            <div className="p-3 bg-yellow-50 rounded mb-2">Elemento 3</div>
            <div className="p-3 bg-purple-50 rounded">Elemento 4</div>
          </StaggeredAnimation>
        </Card>
      </div>
    </div>
  )

  const renderAccessibilityDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Mejoras de Accesibilidad</h3>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Progreso Accesible</h4>
          <AccessibleProgress
            steps={progressSteps}
            currentStep={1}
            showLabels={true}
          />
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Campo de Formulario Accesible</h4>
          <AccessibleFormField
            id="demo-field"
            label="Campo de Ejemplo"
            value=""
            onChange={() => {}}
            helperText="Este campo tiene soporte completo de accesibilidad"
            required={true}
          />
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3">Recuperación de Errores</h4>
          <AccessibleErrorRecovery
            error="Error de ejemplo para demostración"
            onRetry={() => toast.info('Reintentando operación...')}
            onDismiss={() => toast.success('Error descartado')}
            recoverySteps={[
              'Verifica tu conexión a internet',
              'Actualiza la página',
              'Contacta soporte si persiste'
            ]}
          />
        </Card>
      </div>
    </div>
  )

  const renderFormsDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Experiencia de Formularios</h3>
      
      <Card className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso del formulario</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <AccessibleFormField
              {...getFieldProps('name')}
              id="name"
              label="Nombre"
              placeholder="Tu nombre completo"
              required={true}
            />

            <AccessibleFormField
              {...getFieldProps('email')}
              id="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              required={true}
            />

            <AccessibleFormField
              {...getFieldProps('message')}
              id="message"
              label="Mensaje"
              placeholder="Escribe tu mensaje aquí..."
              helperText="Mínimo 10 caracteres"
            />

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Limpiar
              </Button>
              
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </form>

        {formSubmitted && (
          <div className="mt-4">
            <SuccessAnimation
              message="¡Formulario enviado!"
              showMessage={true}
            />
          </div>
        )}
      </Card>
    </div>
  )

  const renderNotificationsDemo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sistema de Notificaciones</h3>
      
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => toast.success('¡Operación exitosa!')}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            Éxito
          </Button>
          
          <Button
            onClick={() => toast.error('Error en la operación')}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Error
          </Button>
          
          <Button
            onClick={() => toast.warning('Advertencia importante')}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          >
            Advertencia
          </Button>
          
          <Button
            onClick={() => toast.info('Información útil', {
              action: {
                label: 'Ver más',
                onClick: () => toast.success('Acción ejecutada')
              }
            })}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Info con Acción
          </Button>
        </div>
      </Card>
    </div>
  )

  const renderCurrentDemo = () => {
    switch (currentDemo) {
      case 'loading': return renderLoadingDemo()
      case 'success': return renderSuccessDemo()
      case 'transitions': return renderTransitionsDemo()
      case 'accessibility': return renderAccessibilityDemo()
      case 'forms': return renderFormsDemo()
      case 'notifications': return renderNotificationsDemo()
      default: return renderLoadingDemo()
    }
  }

  return (
    <PageTransition type="slideUp">
      <div className="min-h-screen bg-gray-50 py-8">
        <LoadingAnnouncer 
          isLoading={isSubmitting}
          loadingMessage="Procesando formulario de ejemplo"
        />
        
        <ScreenReaderAnnouncer 
          message={formSubmitted ? "Formulario de ejemplo enviado exitosamente" : ""}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Mejoras de Experiencia de Usuario
            </h1>
            <p className="mt-2 text-gray-600">
              Demostración de todas las mejoras de UX implementadas
            </p>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {demoSections.map((section) => (
                <Button
                  key={section.id}
                  variant={currentDemo === section.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentDemo(section.id)}
                  className="flex items-center space-x-2"
                >
                  <span>{section.icon}</span>
                  <span>{section.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <SlideTransition show={true} key={currentDemo} direction="up">
            {renderCurrentDemo()}
          </SlideTransition>
        </div>
      </div>
    </PageTransition>
  )
}

// Wrap with providers
const UXEnhancementsExample = () => {
  return (
    <ToastProvider>
      <UXEnhancementsExampleContent />
    </ToastProvider>
  )
}

export default UXEnhancementsExample