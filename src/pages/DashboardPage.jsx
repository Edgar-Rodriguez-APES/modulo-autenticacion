import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LogoutButton from '../components/LogoutButton'

const DashboardPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-slate-900">Technoagentes</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Bienvenido, {user?.name || 'Usuario'}
              </span>
              <LogoutButton variant="outline" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agentes Card */}
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('dashboard.agents')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('dashboard.agentsDescription')}
              </p>
              <Button onClick={() => navigate('/chat')}>
                {t('dashboard.openChat')}
              </Button>
            </div>
          </Card>

          {/* Conversaciones Card */}
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('dashboard.conversations')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('dashboard.conversationsDescription')}
              </p>
              <Button variant="outline">
                {t('dashboard.viewHistory')}
              </Button>
            </div>
          </Card>

          {/* Usuarios Card */}
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('dashboard.users')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('dashboard.usersDescription')}
              </p>
              <Button variant="outline">
                {t('dashboard.manage')}
              </Button>
            </div>
          </Card>

          {/* Suscripción Card */}
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('dashboard.subscription')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('dashboard.subscriptionDescription')}
              </p>
              <Button variant="outline">
                {t('dashboard.viewDetails')}
              </Button>
            </div>
          </Card>

          {/* Configuración Card */}
          <Card>
            <div className="text-center py-6">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('dashboard.settings')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('dashboard.settingsDescription')}
              </p>
              <Button variant="outline">
                {t('dashboard.configure')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage