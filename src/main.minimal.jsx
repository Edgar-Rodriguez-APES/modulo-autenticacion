import React from 'react'
import ReactDOM from 'react-dom/client'

// Aplicación completamente mínima sin dependencias externas
function App() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  }, 
    React.createElement('div', {
      style: {
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px'
      }
    },
      React.createElement('h1', {
        style: {
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }
      }, 'Technoagentes'),
      React.createElement('p', {
        style: {
          fontSize: '1.125rem',
          color: '#6b7280',
          marginBottom: '2rem'
        }
      }, 'Plataforma de Agentes AI'),
      React.createElement('div', {
        style: {
          backgroundColor: '#dcfce7',
          border: '1px solid #16a34a',
          color: '#15803d',
          padding: '1rem',
          borderRadius: '6px',
          fontSize: '1rem'
        }
      }, '✅ Aplicación desplegada exitosamente'),
      React.createElement('p', {
        style: {
          marginTop: '1rem',
          fontSize: '0.875rem',
          color: '#9ca3af'
        }
      }, 'Sin dependencias externas - Versión mínima funcional')
    )
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
)