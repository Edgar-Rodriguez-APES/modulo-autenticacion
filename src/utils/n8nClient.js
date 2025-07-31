import axios from 'axios'

// N8N Endpoints Configuration
const N8N_CONFIG = {
  MESSAGES_ENDPOINT: 'https://sebasduque.app.n8n.cloud/webhook/cacf2ea9-bd03-4772-aac8-65decab7cc6b',
  FILES_ENDPOINT: 'https://sebasduque.app.n8n.cloud/webhook/ba4f9473-3c18-46f3-a4a9-da9240728f3a',
  WEBHOOK_SECRET: 'T3CHN04G3NT3S2025@',
  TIMEOUT: 30000 // 30 seconds for agent processing
}

// Create axios instance for N8N communication
const n8nClient = axios.create({
  timeout: N8N_CONFIG.TIMEOUT,
  headers: {
    //'Authorization': 'Bearer ',
    'Content-Type': 'application/json',
    'Feedo-Webhook-Secret': N8N_CONFIG.WEBHOOK_SECRET
  }
})

// Request interceptor to add authentication
n8nClient.interceptors.request.use(
  (config) => {
    // Add webhook secret to headers
    config.headers['Feedo-Webhook-Secret'] = N8N_CONFIG.WEBHOOK_SECRET

    // Add timestamp for request tracking
    config.headers['X-Request-Timestamp'] = new Date().toISOString()

    console.log('🚀 N8N Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      timestamp: new Date().toISOString()
    })

    return config
  },
  (error) => {
    console.error('❌ N8N Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
n8nClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log('✅ N8N Response:', {
      endpoint: response.config.url,
      status: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    })
    return response
  },
  (error) => {
    // Enhanced error handling for N8N specific issues
    const errorInfo = {
      endpoint: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    }

    console.error('❌ N8N Error:', errorInfo)

    // Handle specific N8N errors
    if (error.response?.status === 401) {
      throw new Error('Webhook authentication failed. Check Feedo-Webhook-Secret.')
    } else if (error.response?.status === 413) {
      throw new Error('File too large. Maximum size is 10MB.')
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Agent processing timeout. Please try again.')
    } else if (error.response?.status >= 500) {
      throw new Error('N8N server error. Please try again later.')
    }

    return Promise.reject(error)
  }
)

// Generate persistent chatId for conversation continuity
const generateChatId = () => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get or create chatId for user session
const getChatId = (userId, agentType) => {
  const storageKey = `chatId_${userId}_${agentType}`
  let chatId = localStorage.getItem(storageKey)

  if (!chatId) {
    chatId = generateChatId()
    localStorage.setItem(storageKey, chatId)
    console.log('🆕 New ChatId created:', { userId, agentType, chatId })
  } else {
    console.log('♻️ Existing ChatId found:', { userId, agentType, chatId })
  }

  return chatId
}

// N8N API methods
export const n8nApi = {
  // Send text message to agent
  sendMessage: async (agentType, message, userId, context = {}) => {
    const chatId = getChatId(userId, agentType)

    const payload = {
      chatId,
      message,
      type: 'text',
      agentType,
      userId,
      timestamp: new Date().toISOString(),
      context
    }

    console.log('📤 Sending message to agent:', { agentType, message: message.substring(0, 50) + '...', chatId })

    try {
      const response = await n8nClient.post(N8N_CONFIG.MESSAGES_ENDPOINT, payload)

      console.log('📥 Agent response received:', {
        agentType,
        responseType: response.data?.type,
        chatId: response.data?.chatId
      })

      return {
        success: true,
        data: response.data,
        chatId
      }
    } catch (error) {
      console.error('❌ Message send failed:', { agentType, error: error.message })
      return {
        success: false,
        error: error.message,
        chatId
      }
    }
  },

  // Upload file to agent
  uploadFile: async (agentType, file, userId, context = {}) => {
    const chatId = getChatId(userId, agentType)

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      console.error('❌ File too large:', { fileName: file.name, size: file.size, maxSize })
      return {
        success: false,
        error: 'File size exceeds 10MB limit',
        chatId
      }
    }

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json', '.txt']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      console.error('❌ Invalid file type:', { fileName: file.name, extension: fileExtension })
      return {
        success: false,
        error: `File type ${fileExtension} not supported. Allowed: ${allowedTypes.join(', ')}`,
        chatId
      }
    }

    console.log('📎 Uploading file:', {
      fileName: file.name,
      size: file.size,
      type: fileExtension,
      agentType,
      chatId
    })

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatId', chatId)
    formData.append('type', 'file')
    formData.append('agentType', agentType)
    formData.append('userId', userId)
    formData.append('timestamp', new Date().toISOString())
    formData.append('context', JSON.stringify(context))

    try {
      const response = await n8nClient.post(N8N_CONFIG.FILES_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Feedo-Webhook-Secret': N8N_CONFIG.WEBHOOK_SECRET
        }
      })

      console.log('📥 File upload response:', {
        fileName: file.name,
        agentType,
        responseType: response.data?.type
      })

      return {
        success: true,
        data: response.data,
        chatId
      }
    } catch (error) {
      console.error('❌ File upload failed:', { fileName: file.name, error: error.message })
      return {
        success: false,
        error: error.message,
        chatId
      }
    }
  },

  // Send command to agent
  sendCommand: async (agentType, command, userId, parameters = {}) => {
    const chatId = getChatId(userId, agentType)

    const payload = {
      chatId,
      message: command,
      type: 'command',
      agentType,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        command: true,
        parameters
      }
    }

    console.log('⚡ Sending command to agent:', { agentType, command, parameters })

    try {
      const response = await n8nClient.post(N8N_CONFIG.MESSAGES_ENDPOINT, payload)
      return {
        success: true,
        data: response.data,
        chatId
      }
    } catch (error) {
      console.error('❌ Command failed:', { agentType, command, error: error.message })
      return {
        success: false,
        error: error.message,
        chatId
      }
    }
  },

  // Get conversation history (if supported by n8n workflow)
  getConversationHistory: async (agentType, userId) => {
    const chatId = getChatId(userId, agentType)

    const payload = {
      chatId,
      message: '/history',
      type: 'command',
      agentType,
      userId,
      timestamp: new Date().toISOString(),
      context: {
        command: true,
        action: 'get_history'
      }
    }

    try {
      const response = await n8nClient.post(N8N_CONFIG.MESSAGES_ENDPOINT, payload)
      return {
        success: true,
        data: response.data,
        chatId
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        chatId
      }
    }
  },

  // Clear conversation context
  clearContext: (userId, agentType) => {
    const storageKey = `chatId_${userId}_${agentType}`
    localStorage.removeItem(storageKey)
    console.log('🗑️ Conversation context cleared:', { userId, agentType })
    return generateChatId()
  },

  // Test connection to N8N
  testConnection: async () => {
    console.log('🔍 Testing N8N connection...')

    try {
      const testPayload = {
        chatId: 'test_connection',
        message: 'Connection test',
        type: 'test',
        agentType: 'feedo',
        userId: 'test_user',
        timestamp: new Date().toISOString(),
        context: { test: true }
      }

      const response = await n8nClient.post(N8N_CONFIG.MESSAGES_ENDPOINT, testPayload)
      console.log('✅ N8N connection successful')
      return { success: true, data: response.data }
    } catch (error) {
      // Handle specific N8N webhook errors
      if (error.response?.status === 404 && error.response?.data?.message?.includes('not registered')) {
        console.warn('⚠️ N8N webhook in test mode - needs to be activated')
        return {
          success: false,
          error: 'N8N webhook in test mode. Please activate the workflow in N8N.',
          needsActivation: true
        }
      }

      console.error('❌ N8N connection failed:', error.message)
      return { success: false, error: error.message }
    }
  }
}

// Helper functions
export const n8nHelpers = {
  // Validate response from agent
  validateAgentResponse: (response) => {
    const requiredFields = ['chatId', 'response', 'type', 'agentType']
    const isValid = requiredFields.every(field => response && response.hasOwnProperty(field))

    if (!isValid) {
      console.warn('⚠️ Invalid agent response structure:', { response, requiredFields })
    }

    return isValid
  },

  // Format agent response for UI
  formatAgentResponse: (response) => {
    const formatted = {
      id: Date.now(),
      text: response.response || 'No response received',
      sender: 'agent',
      agentType: response.agentType,
      type: response.type || 'text',
      metadata: response.metadata || {},
      timestamp: new Date(response.timestamp || Date.now())
    }

    console.log('🎨 Formatted agent response:', formatted)
    return formatted
  },

  // Check if agent is processing
  isProcessing: (response) => {
    const processing = response.type === 'processing' ||
      (response.response && response.response.toLowerCase().includes('procesando'))

    if (processing) {
      console.log('⏳ Agent is processing...')
    }

    return processing
  },

  // Extract file processing results
  extractFileResults: (response) => {
    if (response.type === 'data' && response.metadata) {
      const results = {
        fileName: response.metadata.fileName,
        records: response.metadata.records,
        columns: response.metadata.columns,
        summary: response.metadata.summary,
        processedAt: response.timestamp
      }

      console.log('📊 File processing results:', results)
      return results
    }
    return null
  },

  // Get agent display info
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

// Export configuration for debugging
export const n8nConfig = N8N_CONFIG

export default n8nClient