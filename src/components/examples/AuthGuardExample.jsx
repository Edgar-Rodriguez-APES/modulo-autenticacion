import React from 'react'
import { useAuthGuard } from '../ProtectedRoute'
import Button from '../ui/Button'

/**
 * Example component demonstrating how to use useAuthGuard hook
 * for protecting specific actions within components
 */
const AuthGuardExample = () => {
  const { 
    user, 
    requireAuth, 
    requireRole, 
    requirePermission 
  } = useAuthGuard()

  const handleBasicAction = () => {
    requireAuth(() => {
      console.log('Performing basic authenticated action')
      alert('Acción básica ejecutada')
    })
  }

  const handleAdminAction = () => {
    requireRole('ADMIN', () => {
      console.log('Performing admin action')
      alert('Acción de administrador ejecutada')
    })
  }

  const handleMasterAction = () => {
    requireRole('MASTER', () => {
      console.log('Performing master action')
      alert('Acción de master ejecutada')
    })
  }

  const handleBillingAction = () => {
    requirePermission('view_billing', () => {
      console.log('Accessing billing information')
      alert('Accediendo a información de facturación')
    })
  }

  const handleUserManagement = () => {
    requirePermission('manage_users', () => {
      console.log('Managing users')
      alert('Gestionando usuarios')
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Ejemplo de Protección de Acciones
      </h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Información del Usuario
        </h3>
        <div className="space-y-2 text-sm">
          <p><strong>Nombre:</strong> {user?.name || 'No disponible'}</p>
          <p><strong>Email:</strong> {user?.email || 'No disponible'}</p>
          <p><strong>Rol:</strong> {user?.role || 'No disponible'}</p>
          <p><strong>Tenant ID:</strong> {user?.tenant_id || 'No disponible'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Acciones Protegidas
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Acción Básica (Requiere Autenticación)</h4>
            <Button onClick={handleBasicAction} variant="outline">
              Ejecutar Acción Básica
            </Button>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Acción de Admin (Requiere Rol ADMIN o MASTER)</h4>
            <Button onClick={handleAdminAction} variant="outline">
              Ejecutar Acción de Admin
            </Button>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Acción de Master (Requiere Rol MASTER)</h4>
            <Button onClick={handleMasterAction} variant="outline">
              Ejecutar Acción de Master
            </Button>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Ver Facturación (Requiere Permiso view_billing)</h4>
            <Button onClick={handleBillingAction} variant="outline">
              Ver Información de Facturación
            </Button>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">Gestionar Usuarios (Requiere Permiso manage_users)</h4>
            <Button onClick={handleUserManagement} variant="outline">
              Gestionar Usuarios
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">Nota:</h4>
          <p className="text-sm text-slate-600">
            Las acciones que no tengas permisos para ejecutar mostrarán una advertencia en la consola 
            y no se ejecutarán. Esto permite proteger funcionalidades específicas dentro de componentes 
            sin necesidad de crear rutas separadas.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthGuardExample