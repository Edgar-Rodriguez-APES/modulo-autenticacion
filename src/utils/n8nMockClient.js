// Mock N8N Client for development/testing when N8N webhooks are not active

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Generate realistic mock responses
const generateMockResponse = (agentType, message, type = 'text') => {
  const responses = {
    feedo: {
      text: [
        "¡Hola! Soy Feedo, tu especialista en análisis de datos. ¿En qué puedo ayudarte hoy?",
        "He recibido tu mensaje. Estoy listo para procesar y analizar cualquier dato que necesites.",
        "Perfecto, puedo ayudarte con análisis de datos, procesamiento de archivos CSV, Excel, JSON y más.",
        "¿Tienes algún archivo de datos que quieras que analice? Puedo procesar ventas, inventarios, métricas, etc."
      ],
      command: {
        '/status': "📊 Estado actual: Listo para procesar datos. Sin archivos cargados actualmente.",
        '/summary': "📋 Resumen: No hay archivos procesados aún. Sube un archivo para comenzar el análisis."
      },
      file: "✅ Archivo procesado exitosamente. He detectado [RECORDS] registros con las columnas: [COLUMNS]. ¿Qué tipo de análisis te gustaría realizar?"
    },
    forecaster: {
      text: [
        "¡Saludos! Soy Forecaster, experto en pronósticos y análisis de tendencias. ¿Qué proyección necesitas?",
        "Estoy aquí para ayudarte con predicciones, análisis de tendencias y pronósticos de negocio.",
        "Puedo analizar patrones históricos y generar pronósticos precisos para tu negocio.",
        "¿Tienes datos históricos que quieras que analice para crear pronósticos?"
      ],
      command: {
        '/trends': "📈 Análisis de tendencias: Necesito datos históricos para identificar patrones y tendencias.",
        '/forecast': "🔮 Generación de pronósticos: Proporciona datos históricos para crear predicciones precisas."
      }
    }
  }

  if (type === 'command') {
    return responses[agentType].command[message] || `Comando ${message} ejecutado correctamente.`
  }

  if (type === 'file') {
    return responses[agentType].file || "Archivo procesado correctamente."
  }

  const agentResponses = responses[agentType]?.text || responses.feedo.text
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
}

// Mock N8N API
export const mockN8nApi = {
  // Send text message to agent
  sendMessage: async (agentType, message, userId, context = {}) => {
    console.log('🎭 MOCK: Sending message to agent:', { agentType, message: message.substring(0, 50) + '...' })
    
    // Simulate network delay
    await delay(1000 + Math.random() * 2000)
    
    const chatId = `mock_chat_${userId}_${agentType}_${Date.now()}`
    const response = generateMockResponse(agentType, message, context.command ? 'command' : 'text')
    
    const mockResponse = {
      chatId,
      response,
      type: context.command ? 'command' : 'text',
      agentType,
      metadata: {
        processingTime: Math.floor(Math.random() * 2000) + 500,
        mockResponse: true
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('🎭 MOCK: Agent response generated:', { agentType, responseLength: response.length })
    
    return {
      success: true,
      data: mockResponse,
      chatId
    }
  },

  // Upload file to agent
  uploadFile: async (agentType, file, userId, context = {}) => {
    console.log('🎭 MOCK: Uploading file to agent:', { fileName: file.name, agentType })
    
    // Simulate file processing delay
    await delay(2000 + Math.random() * 3000)
    
    const chatId = `mock_chat_${userId}_${agentType}_${Date.now()}`
    
    // Generate mock file analysis
    const mockColumns = file.name.includes('sales') || file.name.includes('ventas') 
      ? ['fecha', 'producto', 'cantidad', 'precio', 'cliente']
      : file.name.includes('inventory') || file.name.includes('inventario')
      ? ['sku', 'producto', 'stock', 'ubicacion', 'proveedor'] 
      : ['columna_1', 'columna_2', 'columna_3', 'columna_4']
    
    const mockRecords = Math.floor(Math.random() * 1000) + 100
    
    const response = generateMockResponse(agentType, '', 'file')
      .replace('[RECORDS]', mockRecords)
      .replace('[COLUMNS]', mockColumns.join(', '))
    
    const mockResponse = {
      chatId,
      response,
      type: 'data',
      agentType,
      metadata: {
        fileName: file.name,
        records: mockRecords,
        columns: mockColumns,
        summary: `Archivo ${file.name} procesado exitosamente`,
        processingTime: Math.floor(Math.random() * 3000) + 1000,
        mockResponse: true
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('🎭 MOCK: File processing completed:', { fileName: file.name, records: mockRecords })
    
    return {
      success: true,
      data: mockResponse,
      chatId
    }
  },

  // Send command to agent
  sendCommand: async (agentType, command, userId, parameters = {}) => {
    console.log('🎭 MOCK: Sending command to agent:', { agentType, command })
    
    await delay(800 + Math.random() * 1200)
    
    const chatId = `mock_chat_${userId}_${agentType}_${Date.now()}`
    const response = generateMockResponse(agentType, command, 'command')
    
    const mockResponse = {
      chatId,
      response,
      type: 'command',
      agentType,
      metadata: {
        command,
        parameters,
        processingTime: Math.floor(Math.random() * 1000) + 300,
        mockResponse: true
      },
      timestamp: new Date().toISOString()
    }
    
    return {
      success: true,
      data: mockResponse,
      chatId
    }
  },

  // Get conversation history (mock)
  getConversationHistory: async (agentType, userId) => {
    console.log('🎭 MOCK: Getting conversation history:', { agentType, userId })
    
    await delay(500)
    
    return {
      success: true,
      data: {
        chatId: `mock_chat_${userId}_${agentType}`,
        response: "Historial de conversación cargado (simulado)",
        type: 'history',
        agentType,
        metadata: { mockResponse: true },
        timestamp: new Date().toISOString()
      }
    }
  },

  // Clear conversation context
  clearContext: (userId, agentType) => {
    console.log('🎭 MOCK: Clearing context:', { userId, agentType })
    return `mock_chat_${userId}_${agentType}_${Date.now()}`
  },

  // Test connection (always succeeds in mock)
  testConnection: async () => {
    console.log('🎭 MOCK: Testing connection...')
    await delay(1000)
    console.log('🎭 MOCK: Connection test successful')
    return { success: true, data: { status: 'connected', mock: true } }
  }
}

// Helper functions (same as real client)
export const mockN8nHelpers = {
  validateAgentResponse: (response) => {
    const requiredFields = ['chatId', 'response', 'type', 'agentType']
    return requiredFields.every(field => response && response.hasOwnProperty(field))
  },

  formatAgentResponse: (response) => {
    return {
      id: Date.now(),
      text: response.response || 'No response received',
      sender: 'agent',
      agentType: response.agentType,
      type: response.type || 'text',
      metadata: response.metadata || {},
      timestamp: new Date(response.timestamp || Date.now())
    }
  },

  isProcessing: (response) => {
    return response.type === 'processing'
  },

  extractFileResults: (response) => {
    if (response.type === 'data' && response.metadata) {
      return {
        fileName: response.metadata.fileName,
        records: response.metadata.records,
        columns: response.metadata.columns,
        summary: response.metadata.summary,
        processedAt: response.timestamp
      }
    }
    return null
  },

  getAgentInfo: (agentType) => {
    const agents = {
      feedo: {
        name: 'Feedo',
        avatar: '🚚',
        description: 'Data analysis and processing specialist',
        capabilities: ['file_upload', 'data_processing', 'analysis']
      },
      forecaster: {
        name: 'Forecaster',
        avatar: '📊',
        description: 'Forecasting and trend analysis expert',
        capabilities: ['predictions', 'trends', 'forecasting']
      }
    }
    
    return agents[agentType] || null
  }
}

export default mockN8nApi