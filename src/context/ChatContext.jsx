import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { n8nApi, n8nHelpers } from '../utils/n8nClient'

console.log('🔧 Using REAL N8N client for production')
import { useAuth } from './DevAuthContext'

const ChatContext = createContext()

const initialState = {
  // Conversations by agent type
  conversations: {
    feedo: {
      messages: [],
      chatId: null,
      isProcessing: false,
      lastActivity: null
    },
    forecaster: {
      messages: [],
      chatId: null,
      isProcessing: false,
      lastActivity: null
    }
  },
  
  // Current active agent
  activeAgent: null,
  
  // File processing state
  fileProcessing: {
    isUploading: false,
    uploadProgress: 0,
    processedFiles: [],
    errors: []
  },
  
  // Global chat state
  loading: false,
  error: null,
  
  // Connection status
  connectionStatus: 'disconnected' // disconnected, connecting, connected, error
}

const chatReducer = (state, action) => {
  console.log('🔄 Chat Action:', action.type, action.payload)
  
  switch (action.type) {
    case 'SET_ACTIVE_AGENT':
      console.log('👤 Setting active agent:', action.payload)
      return {
        ...state,
        activeAgent: action.payload,
        error: null
      }
    
    case 'ADD_MESSAGE':
      const { agentType, message } = action.payload
      console.log('💬 Adding message:', { agentType, sender: message.sender, text: message.text?.substring(0, 50) })
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [agentType]: {
            ...state.conversations[agentType],
            messages: [...state.conversations[agentType].messages, message],
            lastActivity: new Date().toISOString()
          }
        }
      }
    
    case 'SET_CHAT_ID':
      console.log('🆔 Setting chat ID:', action.payload)
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.payload.agentType]: {
            ...state.conversations[action.payload.agentType],
            chatId: action.payload.chatId
          }
        }
      }
    
    case 'SET_PROCESSING':
      console.log('⏳ Setting processing state:', action.payload)
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.payload.agentType]: {
            ...state.conversations[action.payload.agentType],
            isProcessing: action.payload.isProcessing
          }
        }
      }
    
    case 'START_FILE_UPLOAD':
      console.log('📎 Starting file upload')
      return {
        ...state,
        fileProcessing: {
          ...state.fileProcessing,
          isUploading: true,
          uploadProgress: 0,
          errors: []
        }
      }
    
    case 'UPDATE_UPLOAD_PROGRESS':
      return {
        ...state,
        fileProcessing: {
          ...state.fileProcessing,
          uploadProgress: action.payload
        }
      }
    
    case 'FILE_UPLOAD_SUCCESS':
      console.log('✅ File upload successful:', action.payload)
      return {
        ...state,
        fileProcessing: {
          ...state.fileProcessing,
          isUploading: false,
          uploadProgress: 100,
          processedFiles: [...state.fileProcessing.processedFiles, action.payload]
        }
      }
    
    case 'FILE_UPLOAD_ERROR':
      console.error('❌ File upload error:', action.payload)
      return {
        ...state,
        fileProcessing: {
          ...state.fileProcessing,
          isUploading: false,
          uploadProgress: 0,
          errors: [...state.fileProcessing.errors, action.payload]
        }
      }
    
    case 'CLEAR_CONVERSATION':
      console.log('🗑️ Clearing conversation:', action.payload)
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.payload]: {
            messages: [],
            chatId: null,
            isProcessing: false,
            lastActivity: null
          }
        }
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      console.error('❌ Chat error:', action.payload)
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    case 'SET_CONNECTION_STATUS':
      console.log('🔗 Connection status:', action.payload)
      return {
        ...state,
        connectionStatus: action.payload
      }
    
    case 'LOAD_CONVERSATIONS':
      console.log('📚 Loading conversations from storage')
      return {
        ...state,
        conversations: {
          ...state.conversations,
          ...action.payload
        }
      }
    
    default:
      return state
  }
}

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { user, isAuthenticated } = useAuth()

  // Load conversation history from localStorage on mount
  useEffect(() => {
    if (user?.user_id) {
      loadConversationHistory()
      testN8NConnection()
    }
  }, [user])

  // Save conversations to localStorage when they change
  useEffect(() => {
    if (user?.user_id && isAuthenticated) {
      saveConversationHistory()
    }
  }, [state.conversations, user, isAuthenticated])

  const loadConversationHistory = () => {
    try {
      const savedConversations = localStorage.getItem(`conversations_${user.user_id}`)
      if (savedConversations) {
        const conversations = JSON.parse(savedConversations)
        // Restore conversations but reset processing states
        Object.keys(conversations).forEach(agentType => {
          conversations[agentType].isProcessing = false
        })
        dispatch({ type: 'LOAD_CONVERSATIONS', payload: conversations })
        console.log('📚 Loaded conversation history for user:', user.user_id)
      }
    } catch (error) {
      console.warn('⚠️ Failed to load conversation history:', error)
    }
  }

  const saveConversationHistory = () => {
    try {
      localStorage.setItem(
        `conversations_${user.user_id}`,
        JSON.stringify(state.conversations)
      )
    } catch (error) {
      console.warn('⚠️ Failed to save conversation history:', error)
    }
  }

  const testN8NConnection = async () => {
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' })
    
    try {
      const result = await n8nApi.testConnection()
      if (result.success) {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
        console.log('✅ N8N connection established')
      } else if (result.needsActivation) {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'needs_activation' })
        console.warn('⚠️ N8N webhooks need activation in N8N interface')
        dispatch({ type: 'SET_ERROR', payload: 'N8N webhooks need to be activated. Please click "Execute workflow" in N8N.' })
      } else {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' })
        console.error('❌ N8N connection failed:', result.error)
      }
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' })
      console.error('❌ N8N connection test failed:', error)
    }
  }

  const setActiveAgent = (agentType) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Please log in to use agents' })
      return
    }
    
    dispatch({ type: 'SET_ACTIVE_AGENT', payload: agentType })
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const sendMessage = async (agentType, message, context = {}) => {
    if (!user?.user_id) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' })
      return
    }

    if (!message.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Message cannot be empty' })
      return
    }

    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }
    
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { agentType, message: userMessage } 
    })

    // Set processing state
    dispatch({ 
      type: 'SET_PROCESSING', 
      payload: { agentType, isProcessing: true } 
    })

    try {
      console.log('📤 Sending message to agent:', { agentType, message: message.substring(0, 50) + '...' })
      
      // Send message to n8n
      const response = await n8nApi.sendMessage(agentType, message, user.user_id, context)
      
      if (response.success) {
        // Update chatId if new
        if (response.chatId) {
          dispatch({ 
            type: 'SET_CHAT_ID', 
            payload: { agentType, chatId: response.chatId } 
          })
        }

        // Validate and format agent response
        if (response.data && n8nHelpers.validateAgentResponse(response.data)) {
          const agentMessage = n8nHelpers.formatAgentResponse(response.data)
          
          dispatch({ 
            type: 'ADD_MESSAGE', 
            payload: { agentType, message: agentMessage } 
          })
          
          console.log('📥 Agent response added to conversation')
        } else {
          // Handle case where response is not in expected format
          const fallbackMessage = {
            id: Date.now(),
            text: response.data?.response || 'Agent response received but format was unexpected',
            sender: 'agent',
            timestamp: new Date(),
            type: 'text',
            agentType
          }
          
          dispatch({ 
            type: 'ADD_MESSAGE', 
            payload: { agentType, message: fallbackMessage } 
          })
          
          console.warn('⚠️ Agent response format was unexpected, using fallback')
        }
      } else {
        throw new Error(response.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('❌ Message send failed:', error)
      
      // Add error message to conversation
      const errorMessage = {
        id: Date.now(),
        text: `❌ Error: ${error.message}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      }
      
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { agentType, message: errorMessage } 
      })
      
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      // Clear processing state
      dispatch({ 
        type: 'SET_PROCESSING', 
        payload: { agentType, isProcessing: false } 
      })
    }
  }

  const uploadFile = async (agentType, file, context = {}) => {
    if (!user?.user_id) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' })
      return
    }

    dispatch({ type: 'START_FILE_UPLOAD' })

    // Add file upload message to conversation
    const fileMessage = {
      id: Date.now(),
      text: `📎 Uploading file: ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      type: 'file',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    }
    
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { agentType, message: fileMessage } 
    })

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        dispatch({ 
          type: 'UPDATE_UPLOAD_PROGRESS', 
          payload: Math.min(90, Math.random() * 80 + 10) 
        })
      }, 500)

      console.log('📎 Uploading file to agent:', { fileName: file.name, agentType })

      // Upload file to n8n
      const response = await n8nApi.uploadFile(agentType, file, user.user_id, context)
      
      clearInterval(progressInterval)
      
      if (response.success) {
        // Update chatId if new
        if (response.chatId) {
          dispatch({ 
            type: 'SET_CHAT_ID', 
            payload: { agentType, chatId: response.chatId } 
          })
        }

        // Process file results
        const fileResults = n8nHelpers.extractFileResults(response.data)
        
        dispatch({ 
          type: 'FILE_UPLOAD_SUCCESS', 
          payload: {
            fileName: file.name,
            results: fileResults,
            uploadedAt: new Date()
          }
        })

        // Add agent response about file processing
        if (response.data && n8nHelpers.validateAgentResponse(response.data)) {
          const agentMessage = n8nHelpers.formatAgentResponse(response.data)
          
          dispatch({ 
            type: 'ADD_MESSAGE', 
            payload: { agentType, message: agentMessage } 
          })
        } else {
          // Fallback success message
          const successMessage = {
            id: Date.now(),
            text: `✅ File "${file.name}" uploaded and processed successfully`,
            sender: 'agent',
            timestamp: new Date(),
            type: 'text',
            agentType
          }
          
          dispatch({ 
            type: 'ADD_MESSAGE', 
            payload: { agentType, message: successMessage } 
          })
        }
        
        console.log('✅ File upload completed successfully')
      } else {
        throw new Error(response.error || 'File upload failed')
      }
    } catch (error) {
      console.error('❌ File upload failed:', error)
      
      dispatch({ 
        type: 'FILE_UPLOAD_ERROR', 
        payload: {
          fileName: file.name,
          error: error.message,
          timestamp: new Date()
        }
      })
      
      // Add error message to conversation
      const errorMessage = {
        id: Date.now(),
        text: `❌ Error uploading ${file.name}: ${error.message}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      }
      
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { agentType, message: errorMessage } 
      })
    }
  }

  const sendCommand = async (agentType, command, parameters = {}) => {
    if (!user?.user_id) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' })
      return
    }

    dispatch({ 
      type: 'SET_PROCESSING', 
      payload: { agentType, isProcessing: true } 
    })

    // Add command message to conversation
    const commandMessage = {
      id: Date.now(),
      text: `⚡ ${command}`,
      sender: 'user',
      timestamp: new Date(),
      type: 'command'
    }
    
    dispatch({ 
      type: 'ADD_MESSAGE', 
      payload: { agentType, message: commandMessage } 
    })

    try {
      console.log('⚡ Sending command to agent:', { agentType, command })
      
      const response = await n8nApi.sendCommand(agentType, command, user.user_id, parameters)
      
      if (response.success && response.data && n8nHelpers.validateAgentResponse(response.data)) {
        const agentMessage = n8nHelpers.formatAgentResponse(response.data)
        
        dispatch({ 
          type: 'ADD_MESSAGE', 
          payload: { agentType, message: agentMessage } 
        })
      } else {
        throw new Error(response.error || 'Invalid command response')
      }
    } catch (error) {
      console.error('❌ Command failed:', error)
      
      const errorMessage = {
        id: Date.now(),
        text: `❌ Command failed: ${error.message}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      }
      
      dispatch({ 
        type: 'ADD_MESSAGE', 
        payload: { agentType, message: errorMessage } 
      })
      
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ 
        type: 'SET_PROCESSING', 
        payload: { agentType, isProcessing: false } 
      })
    }
  }

  const clearConversation = (agentType) => {
    dispatch({ type: 'CLEAR_CONVERSATION', payload: agentType })
    
    // Clear chatId from n8n client
    if (user?.user_id) {
      n8nApi.clearContext(user.user_id, agentType)
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const retryLastMessage = async (agentType) => {
    const conversation = state.conversations[agentType]
    if (!conversation || !conversation.messages.length) return
    
    // Find the last user message
    const lastUserMessage = [...conversation.messages]
      .reverse()
      .find(msg => msg.sender === 'user' && msg.type === 'text')
    
    if (lastUserMessage) {
      console.log('🔄 Retrying last message:', lastUserMessage.text)
      await sendMessage(agentType, lastUserMessage.text)
    }
  }

  const value = {
    // State
    ...state,
    
    // Actions
    setActiveAgent,
    sendMessage,
    uploadFile,
    sendCommand,
    clearConversation,
    clearError,
    retryLastMessage,
    testN8NConnection,
    
    // Computed values
    activeConversation: state.activeAgent ? state.conversations[state.activeAgent] : null,
    hasActiveAgent: !!state.activeAgent,
    totalMessages: Object.values(state.conversations).reduce(
      (total, conv) => total + conv.messages.length, 0
    ),
    isConnected: state.connectionStatus === 'connected'
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export default ChatContext