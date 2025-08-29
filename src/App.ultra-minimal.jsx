import React from 'react'

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          🚀 Technoagentes
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#64748b',
          marginBottom: '2rem'
        }}>
          Plataforma de Agentes AI
        </p>
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #16a34a',
          color: '#15803d',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          ✅ Aplicación desplegada exitosamente en AWS Amplify
        </div>
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #2563eb',
          color: '#1d4ed8',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          🔧 Versión mínima sin dependencias externas
        </div>
      </div>
    </div>
  )
}

export default App