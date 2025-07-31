import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/DevAuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import FileUpload from '../components/FileUpload'
import Loading from '../components/ui/Loading'

const ChatPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    conversations,
    activeAgent,
    activeConversation,
    fileProcessing,
    connectionStatus,
    error,
    setActiveAgent,
    sendMessage,
    uploadFile,
    sendCommand,
    clearConversation,
    clearError,
    retryLastMessage,
    testN8NConnection,
    isConnected
  } = useChat()
  
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const agents = [
    {
      id: 'feedo',
      name: 'Feedo',
      description: 'Data analysis and processing specialist',
      avatar: '🚚',
      color: 'bg-blue-100 text-blue-700',
      capabilities: ['file_upload', 'data_processing', 'analysis']
    },
    {
      id: 'forecaster',
      name: 'Forecaster',
      description: 'Forecasting and trend analysis expert',
      avatar: '📊',
      color: 'bg-green-100 text-green-700',
      capabilities: ['predictions', 'trends', 'forecasting']
    }
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages])

  // Focus input when agent changes
  useEffect(() => {
    if (activeAgent && inputRef.current) {
      inputRef.current.focus()
    }
  }, [activeAgent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !activeAgent) return

    const messageText = message.trim()
    setMessage('')

    // Send message to n8n via ChatContext
    await sendMessage(activeAgent, messageText)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAgentSelect = (agentId) => {
    setActiveAgent(agentId)
    clearError()
  }

  const handleFileUpload = async (files) => {
    if (!activeAgent || !files.length) return

    // Upload each file to the active agent
    for (const file of files) {
      await uploadFile(activeAgent, file)
    }
  }

  const handleClearConversation = () => {
    if (activeAgent && window.confirm('¿Estás seguro de que quieres limpiar esta conversación?')) {
      clearConversation(activeAgent)
    }
  }

  const handleQuickCommand = async (command) => {
    if (!activeAgent) return
    await sendCommand(activeAgent, command)
  }

  return (
    <div className="h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Technoagentes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              ← Dashboard
            </Button>
          </div>
          <Button className="w-full">
            {t('chat.newConversation')}
          </Button>
        </div>

        {/* Connection Status */}
        <div className="px-4 pb-2">
          <div className={`flex items-center text-xs ${
            connectionStatus === 'connected' ? 'text-green-600' : 
            connectionStatus === 'connecting' ? 'text-yellow-600' :
            connectionStatus === 'needs_activation' ? 'text-orange-600' :
            'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              connectionStatus === 'needs_activation' ? 'bg-orange-500' :
              'bg-red-500'
            }`}></div>
            {connectionStatus === 'connected' ? 'Connected to N8N' : 
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'needs_activation' ? 'N8N needs activation' :
             'Disconnected'}
          </div>
          {(connectionStatus === 'error' || connectionStatus === 'needs_activation') && (
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              🔄 Retry connection
            </button>
          )}
        </div>

        {/* Agent Selection */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-700">
              Select Agent
            </h3>
            <div className="flex items-center space-x-2">
              {connectionStatus !== 'connected' && (
                <button
                  onClick={() => testN8NConnection()}
                  className="text-xs text-blue-500 hover:text-blue-700"
                  title="Retry N8N connection"
                >
                  🔄
                </button>
              )}
              {activeAgent && (
                <button
                  onClick={handleClearConversation}
                  className="text-xs text-slate-500 hover:text-slate-700"
                  title="Clear conversation"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {agents.map(agent => {
              const conversation = conversations[agent.id]
              const messageCount = conversation?.messages?.length || 0
              const isActive = activeAgent === agent.id
              
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 border-primary-200 text-primary-700 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  } border`}
                >
                  <div className="flex items-start">
                    <div className="relative">
                      <span className="text-2xl mr-3">{agent.avatar}</span>
                      {conversation?.isProcessing && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{agent.name}</div>
                        {messageCount > 0 && (
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                            {messageCount}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 leading-tight mt-1 line-clamp-2">
                        {agent.description}
                      </div>
                      {conversation?.lastActivity && (
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(conversation.lastActivity).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* File Processing Status */}
        {fileProcessing.isUploading && (
          <div className="p-4 border-t border-slate-200">
            <div className="text-sm font-medium text-slate-700 mb-2">
              Processing file...
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${fileProcessing.uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Quick Commands for Active Agent */}
        {activeAgent && (
          <div className="p-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Quick Commands
            </h4>
            <div className="space-y-1">
              {activeAgent === 'feedo' && (
                <>
                  <button
                    onClick={() => handleQuickCommand('/status')}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-800 py-1"
                  >
                    📊 View data status
                  </button>
                  <button
                    onClick={() => handleQuickCommand('/summary')}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-800 py-1"
                  >
                    📋 File summary
                  </button>
                </>
              )}
              {activeAgent === 'forecaster' && (
                <>
                  <button
                    onClick={() => handleQuickCommand('/trends')}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-800 py-1"
                  >
                    📈 Analyze trends
                  </button>
                  <button
                    onClick={() => handleQuickCommand('/forecast')}
                    className="w-full text-left text-xs text-slate-600 hover:text-slate-800 py-1"
                  >
                    🔮 Generate forecast
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeAgent ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {agents.find(a => a.id === activeAgent)?.avatar}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {agents.find(a => a.id === activeAgent)?.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {activeConversation?.isProcessing ? (
                        <span className="flex items-center">
                          <Loading size="sm" />
                          <span className="ml-2">Processing...</span>
                        </span>
                      ) : (
                        `${activeConversation?.messages?.length || 0} messages`
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Chat ID Display (for debugging) */}
                {process.env.NODE_ENV === 'development' && activeConversation?.chatId && (
                  <div className="text-xs text-slate-400 font-mono">
                    ID: {activeConversation.chatId.slice(-8)}
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">{error}</span>
                  <button
                    onClick={clearError}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {!activeConversation?.messages?.length ? (
                <div className="text-center text-slate-500 mt-12">
                  <div className="text-4xl mb-4">
                    {agents.find(a => a.id === activeAgent)?.avatar}
                  </div>
                  <p className="mb-6">
                    Start conversation with {agents.find(a => a.id === activeAgent)?.name}
                  </p>
                  
                  {/* Show file upload for Feedo */}
                  {activeAgent === 'feedo' && (
                    <div className="max-w-md mx-auto">
                      <FileUpload onFileUpload={handleFileUpload} />
                    </div>
                  )}
                  
                  {/* Show capabilities */}
                  <div className="mt-8 max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                      Capabilities:
                    </h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {agents.find(a => a.id === activeAgent)?.capabilities.map(cap => (
                        <span key={cap} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                          {cap.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeConversation.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'ml-12' : 'mr-12'}`}>
                        {/* Message bubble */}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            msg.sender === 'user'
                              ? 'bg-primary-600 text-white'
                              : msg.sender === 'system'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          {/* Message content */}
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                          
                          {/* File metadata */}
                          {msg.type === 'file' && msg.metadata && (
                            <div className="mt-2 text-xs opacity-75">
                              📎 {msg.metadata.fileName} ({(msg.metadata.fileSize / 1024).toFixed(1)} KB)
                            </div>
                          )}
                          
                          {/* Agent metadata */}
                          {msg.sender === 'agent' && msg.metadata && (
                            <div className="mt-2 text-xs opacity-75">
                              {msg.metadata.processingTime && (
                                <span>⏱️ {msg.metadata.processingTime}ms</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <div className={`text-xs text-slate-500 mt-1 ${
                          msg.sender === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Processing indicator */}
                  {activeConversation.isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 px-4 py-2 rounded-lg mr-12">
                        <div className="flex items-center space-x-2">
                          <Loading size="sm" />
                          <span className="text-slate-600 text-sm">
                            {agents.find(a => a.id === activeAgent)?.name} is processing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {/* File upload area for active conversation */}
              {activeAgent === 'feedo' && activeConversation?.messages?.length > 0 && (
                <div className="mb-3">
                  <FileUpload 
                    onFileUpload={handleFileUpload}
                    compact={true}
                  />
                </div>
              )}
              
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={activeConversation?.isProcessing}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!message.trim() || activeConversation?.isProcessing}
                  loading={activeConversation?.isProcessing}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="text-center max-w-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Select an Agent
              </h3>
              <p className="text-slate-600 mb-6">
                Choose an AI agent to start your conversation
              </p>
              
              {/* Agent preview cards */}
              <div className="grid grid-cols-2 gap-3">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                    className="p-3 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="text-2xl mb-2">{agent.avatar}</div>
                    <div className="text-sm font-medium text-slate-900">{agent.name}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage