import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button'

const FileUpload = ({ onFileUpload }) => {
  const { t } = useTranslation()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const handleFiles = (files) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      const validTypes = ['.csv', '.xlsx', '.xls', '.json', '.txt']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      return validTypes.includes(fileExtension) && file.size <= 10 * 1024 * 1024 // 10MB max
    })

    if (validFiles.length > 0) {
      // Simular procesamiento de archivos
      const processedFiles = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: 'processed',
        preview: generateFilePreview(file)
      }))

      setUploadedFiles(prev => [...prev, ...processedFiles])
      
      // Notificar al componente padre
      if (onFileUpload) {
        onFileUpload(processedFiles)
      }

      // Simular mensaje de Feedo
      setTimeout(() => {
        const message = `He procesado ${validFiles.length} archivo(s): ${validFiles.map(f => f.name).join(', ')}. Los datos están listos para análisis. ¿Qué tipo de análisis te gustaría realizar?`
        
        // Aquí podrías integrar con el sistema de chat
        console.log('Feedo response:', message)
      }, 1500)
    }
  }

  const generateFilePreview = (file) => {
    // Generar preview simulado basado en el tipo de archivo
    if (file.name.includes('sales') || file.name.includes('ventas')) {
      return {
        type: 'sales',
        records: Math.floor(Math.random() * 1000) + 100,
        columns: ['fecha', 'producto', 'cantidad', 'precio', 'cliente'],
        summary: 'Datos de ventas detectados'
      }
    } else if (file.name.includes('inventory') || file.name.includes('inventario')) {
      return {
        type: 'inventory',
        records: Math.floor(Math.random() * 500) + 50,
        columns: ['sku', 'producto', 'stock', 'ubicacion', 'proveedor'],
        summary: 'Datos de inventario detectados'
      }
    } else {
      return {
        type: 'general',
        records: Math.floor(Math.random() * 200) + 20,
        columns: ['columna_1', 'columna_2', 'columna_3'],
        summary: 'Datos generales detectados'
      }
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📊</div>
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Sube tus datos para análisis
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-slate-500">
              Formatos soportados: CSV, Excel, JSON, TXT (máx. 10MB)
            </p>
          </div>
          
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.json,.txt"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload').click()}
          >
            Seleccionar Archivos
          </Button>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900">Archivos Procesados:</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {file.preview.type === 'sales' ? '💰' : 
                     file.preview.type === 'inventory' ? '📦' : '📄'}
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-900">{file.name}</h5>
                    <p className="text-sm text-slate-600">
                      {(file.size / 1024).toFixed(1)} KB • {file.preview.records} registros
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-white rounded p-3 text-sm">
                <p className="text-slate-700 mb-2">{file.preview.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {file.preview.columns.map((col, index) => (
                    <span key={index} className="bg-slate-100 px-2 py-1 rounded text-xs">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload