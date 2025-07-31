import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button'

const FileUpload = ({ onFileUpload, compact = false }) => {
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
      // Notificar al componente padre con los archivos reales para N8N
      if (onFileUpload) {
        onFileUpload(validFiles)
      }
    } else {
      console.warn('No valid files selected')
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

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls,.json,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload-compact"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('file-upload-compact').click()}
          className="flex items-center space-x-2"
        >
          <span>📎</span>
          <span>Upload File</span>
        </Button>
        <span className="text-xs text-slate-500">
          CSV, Excel, JSON, TXT (max 10MB)
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg text-center transition-colors ${
          compact ? 'p-4' : 'p-8'
        } ${
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
              Upload your data for analysis
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Drag files here or click to select
            </p>
            <p className="text-xs text-slate-500">
              Supported formats: CSV, Excel, JSON, TXT (max 10MB)
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
            Select Files
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FileUpload