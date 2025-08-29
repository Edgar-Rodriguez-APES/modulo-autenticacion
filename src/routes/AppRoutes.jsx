import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Public pages
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

// Protected pages
import DashboardPage from '../pages/DashboardPage'

// Components
import ProtectedRoute from '../components/ProtectedRoute'
import Loading from '../components/ui/Loading'

const AppRoutes = () => {
  const { loading } = useAuth()

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-slate-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      {/* Admin Only Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requiredRole={['MASTER', 'ADMIN']}>
            <AdminRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Master Only Routes */}
      <Route 
        path="/settings/*" 
        element={
          <ProtectedRoute requiredRole="MASTER">
            <SettingsRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Chat Routes - Requires access_agents permission */}
      <Route 
        path="/chat/*" 
        element={
          <ProtectedRoute requiredPermission="access_agents">
            <ChatRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Billing Routes - Requires view_billing permission */}
      <Route 
        path="/billing/*" 
        element={
          <ProtectedRoute requiredPermission="view_billing">
            <BillingRoutes />
          </ProtectedRoute>
        } 
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

// Placeholder components for demonstration
const AdminRoutes = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Panel de Administración</h1>
      <p className="text-slate-600">Funcionalidades de administración disponibles aquí</p>
    </div>
  </div>
)

const SettingsRoutes = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Configuración del Sistema</h1>
      <p className="text-slate-600">Solo disponible para usuarios MASTER</p>
    </div>
  </div>
)

const ChatRoutes = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Chat con Agentes IA</h1>
      <p className="text-slate-600">Interfaz de chat con Feedo y Forecaster</p>
    </div>
  </div>
)

const BillingRoutes = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Facturación y Suscripciones</h1>
      <p className="text-slate-600">Gestión de pagos y suscripciones</p>
    </div>
  </div>
)

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-slate-600 mb-8">Página no encontrada</p>
      <a 
        href="/dashboard" 
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
      >
        Volver al Dashboard
      </a>
    </div>
  </div>
)

export default AppRoutes