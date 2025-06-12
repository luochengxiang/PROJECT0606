import { ApiClient } from '../api/ApiClient'
import { EventBus } from '../utils/EventBus'
import { Message, MessageType } from '../types/Message'
import { ChatSession } from '../types/ChatSession'

export class ChatManager {
  private apiClient: ApiClient
  private eventBus: EventBus
  private currentSession: ChatSession
  private isProcessing = false
  private messageHistory: Message[] = []

  constructor(apiClient: ApiClient, eventBus: EventBus) {
    this.apiClient = apiClient
    this.eventBus = eventBus
    this.currentSession = this.createNewSession()
  }

  async initialize(): Promise<void> {
    console.log('💬 初始化聊天管理器...')
    
    // 设置事件监听器
    this.setupEventListeners()
    
    // 检查API连接
    await this.checkApiConnection()
    
    console.log('✅ 聊天管理器初始化完成')
  }

  private setupEventListeners(): void {
    // 监听发送消息快捷键
    this.eventBus.on('shortcut:sendMessage', () => {
      const inputElement = document.getElementById('message-input') as HTMLTextAreaElement
      if (inputElement && inputElement.value.trim()) {
        this.sendMessage(inputElement.value.trim())
      }
    })

    // 监听新建对话快捷键
    this.eventBus.on('shortcut:newChat', () => {
      this.startNewChat()
    })
  }

  private async checkApiConnection(): Promise<void> {
    try {
      const health = await this.apiClient.checkHealth()
      if (health.status === 'healthy') {
        this.eventBus.emit('connection:statusChanged', 'connected')
      } else {
        this.eventBus.emit('connection:statusChanged', 'error')
      }
    } catch (error) {
      console.error('API连接检查失败:', error)
      this.eventBus.emit('connection:statusChanged', 'disconnected')
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (this.isProcessing || !content.trim()) {
      return
    }

    this.isProcessing = true

    try {
      // 创建用户消息
      const userMessage: Message = {
        id: this.generateMessageId(),
        type: MessageType.USER,
        content: content.trim(),
        timestamp: new Date(),
        sessionId: this.currentSession.id
      }

      // 添加到历史记录
      this.messageHistory.push(userMessage)
      
      // 发送用户消息事件
      this.eventBus.emit('message:userSent', userMessage)

      // 显示思考指示器
      this.eventBus.emit('ai:thinking', true)

      // 调用API获取AI响应
      await this.getAIResponse(content)

    } catch (error) {
      console.error('发送消息失败:', error)
      this.eventBus.emit('error:occurred', new Error('发送消息失败，请稍后重试'))
    } finally {
      this.isProcessing = false
      this.eventBus.emit('ai:thinking', false)
    }
  }

  private async getAIResponse(userMessage: string): Promise<void> {
    try {
      // 使用流式API获取响应
      const stream = await this.apiClient.sendMessageStream(userMessage)
      
      // 创建AI消息对象
      const aiMessage: Message = {
        id: this.generateMessageId(),
        type: MessageType.ASSISTANT,
        content: '',
        timestamp: new Date(),
        sessionId: this.currentSession.id,
        isStreaming: true
      }

      // 添加到历史记录
      this.messageHistory.push(aiMessage)
      
      // 发送AI消息开始事件
      this.eventBus.emit('message:aiStart', aiMessage)

      // 处理流式响应
      let fullContent = ''
      
      for await (const chunk of stream) {
        if (chunk.type === 'content' && chunk.content) {
          fullContent += chunk.content
          aiMessage.content = fullContent
          
          // 发送流式内容更新事件
          this.eventBus.emit('message:aiChunk', {
            messageId: aiMessage.id,
            content: chunk.content,
            fullContent: fullContent
          })
        } else if (chunk.type === 'complete') {
          // 流式传输完成
          aiMessage.isStreaming = false
          aiMessage.content = fullContent
          
          // 发送AI消息完成事件
          this.eventBus.emit('message:aiComplete', aiMessage)
          break
        } else if (chunk.type === 'error') {
          throw new Error(chunk.error || '获取AI响应时发生错误')
        }
      }

    } catch (error) {
      console.error('获取AI响应失败:', error)
      
      // 创建错误消息
      const errorMessage: Message = {
        id: this.generateMessageId(),
        type: MessageType.SYSTEM,
        content: '抱歉，获取响应时发生错误，请稍后重试。',
        timestamp: new Date(),
        sessionId: this.currentSession.id,
        isError: true
      }

      this.messageHistory.push(errorMessage)
      this.eventBus.emit('message:error', errorMessage)
    }
  }

  startNewChat(): void {
    console.log('🆕 开始新对话')
    
    // 保存当前会话
    if (this.messageHistory.length > 0) {
      this.currentSession.messages = [...this.messageHistory]
      this.currentSession.updatedAt = new Date()
    }

    // 创建新会话
    this.currentSession = this.createNewSession()
    this.messageHistory = []

    // 发送新对话事件
    this.eventBus.emit('chat:newSession', this.currentSession)
  }

  private createNewSession(): ChatSession {
    return {
      id: this.generateSessionId(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取当前会话
  getCurrentSession(): ChatSession {
    return this.currentSession
  }

  // 获取消息历史
  getMessageHistory(): Message[] {
    return [...this.messageHistory]
  }

  // 获取状态
  getStatus(): object {
    return {
      isProcessing: this.isProcessing,
      currentSessionId: this.currentSession.id,
      messageCount: this.messageHistory.length,
      lastActivity: this.currentSession.updatedAt
    }
  }

  // 重置聊天管理器
  async reset(): Promise<void> {
    this.isProcessing = false
    this.messageHistory = []
    this.currentSession = this.createNewSession()
    
    this.eventBus.emit('chat:reset')
  }

  // 销毁聊天管理器
  destroy(): void {
    this.isProcessing = false
    this.messageHistory = []
  }
}
