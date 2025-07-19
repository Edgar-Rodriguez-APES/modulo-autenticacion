import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const ChatPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const agents = [
    {
      id: 'feedo',
      name: t('agents.feedo.name'),
      description: t('agents.feedo.description'),
      avatar: '🚚'
    },
    {
      id: 'forecaster',
      name: t('agents.forecaster.name'),
      description: t('agents.forecaster.description'),
      avatar: '📊'
    }
  ]

  const handleSendMessage = () => {
    if (!message.trim() || !selectedAgent) return

    const newMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')

    // Simulate agent response
    setTimeout(() => {
      const agentResponse = {
        id: Date.now() + 1,
        text: t('agents.simulatedResponse', { 
          agentName: selectedAgent.name, 
          message: message 
        }),
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentResponse])
    }, 1000)
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

        {/* Agent Selection */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            {t('chat.selectAgent')}
          </h3>
          <div className="space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'bg-primary-100 border-primary-200 text-primary-700'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                } border`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{agent.avatar}</span>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-slate-500 leading-tight">{agent.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            {t('chat.conversationHistory')}
          </h3>
          <div className="text-sm text-slate-500">
            {t('chat.noConversations')}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{selectedAgent.avatar}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedAgent.name}</h3>
                  <p className="text-sm text-slate-500">{selectedAgent.description}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-12">
                  <div className="text-4xl mb-4">{selectedAgent.avatar}</div>
                  <p>{t('chat.startConversation')} {selectedAgent.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('chat.typeMessage')}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  {t('chat.send')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {t('chat.selectAgentTitle')}
              </h3>
              <p className="text-slate-600">
                {t('chat.selectAgentDescription')}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage