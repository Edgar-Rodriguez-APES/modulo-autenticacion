import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.minimal.jsx'
import './index.css'
// import './i18n/config.js' // Temporalmente deshabilitado

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)