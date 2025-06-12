import { EventBus } from '../utils/EventBus'
import { Message, MessageType } from '../types/Message'
import { MessageRenderer } from '../components/MessageRenderer'
import { InputHandler } from '../components/InputHandler'
import { NotificationManager } from '../components/NotificationManager'

export class UIManager {
  private eventBus: EventBus
  private messageRenderer: MessageRenderer
  private inputHandler: InputHandler
  private notificationManager: NotificationManager
  private isWelcomeScreenVisible = true

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
    this.messageRenderer = new MessageRenderer()
    this.inputHandler = new InputHandler(eventBus)
    this.notificationManager = new NotificationManager()
  }

  async initialize(): Promise<void> {
    console.log('🎨 初始化UI管理器...')
    
    // 初始化组件
    await this.messageRenderer.initialize()
    await this.inputHandler.initialize()
    await this.notificationManager.initialize()
    
    // 设置事件监听器
    this.setupEventListeners()
    
    // 初始化UI状态
    this.initializeUIState()
    
    console.log('✅ UI管理器初始化完成')
  }

  private setupEventListeners(): void {
    // 监听消息事件
    this.eventBus.on('message:userSent', (message: Message) => {
      this.handleUserMessage(message)
    })

    this.eventBus.on('message:aiStart', (message: Message) => {
      this.handleAIMessageStart(message)
    })

    this.eventBus.on('message:aiChunk', (data: any) => {
      this.handleAIMessageChunk(data)
    })

    this.eventBus.on('message:aiComplete', (message: Message) => {
      this.handleAIMessageComplete(message)
    })

    this.eventBus.on('message:error', (message: Message) => {
      this.handleErrorMessage(message)
    })

    // 监听AI思考状态
    this.eventBus.on('ai:thinking', (isThinking: boolean) => {
      this.updateThinkingIndicator(isThinking)
    })

    // 监听连接状态变化
    this.eventBus.on('connection:statusChanged', (status: string) => {
      this.updateConnectionStatus(status)
    })

    // 监听新对话事件
    this.eventBus.on('chat:newSession', () => {
      this.resetToWelcomeScreen()
    })

    // 监听建议卡片点击
    this.setupSuggestionCards()

    // 监听快捷键
    this.eventBus.on('shortcut:focusInput', () => {
      this.inputHandler.focus()
    })

    this.eventBus.on('shortcut:escape', () => {
      this.closeModals()
    })
  }

  private initializeUIState(): void {
    // 设置初始主题
    this.applyTheme('dark')
    
    // 初始化连接状态
    this.updateConnectionStatus('connecting')
    
    // 设置欢迎屏幕
    this.showWelcomeScreen()
  }

  private setupSuggestionCards(): void {
    const suggestionCards = document.querySelectorAll('.suggestion-card')
    suggestionCards.forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt')
        if (prompt) {
          this.inputHandler.setInputValue(prompt)
          this.eventBus.emit('user:sendMessage', prompt)
        }
      })
    })
  }

  private handleUserMessage(message: Message): void {
    // 隐藏欢迎屏幕
    if (this.isWelcomeScreenVisible) {
      this.hideWelcomeScreen()
    }

    // 渲染用户消息
    this.messageRenderer.renderUserMessage(message)
    
    // 清空输入框
    this.inputHandler.clearInput()
    
    // 滚动到底部
    this.scrollToBottom()
  }

  private handleAIMessageStart(message: Message): void {
    // 开始渲染AI消息
    this.messageRenderer.startAIMessage(message)
    this.scrollToBottom()
  }

  private handleAIMessageChunk(data: any): void {
    // 更新AI消息内容
    this.messageRenderer.updateAIMessage(data.messageId, data.content)
    this.scrollToBottom()
  }

  private handleAIMessageComplete(message: Message): void {
    // 完成AI消息渲染
    this.messageRenderer.completeAIMessage(message)
    this.scrollToBottom()
  }

  private handleErrorMessage(message: Message): void {
    // 渲染错误消息
    this.messageRenderer.renderErrorMessage(message)
    this.scrollToBottom()
  }

  private updateThinkingIndicator(isThinking: boolean): void {
    const indicator = document.getElementById('thinking-indicator')
    if (indicator) {
      if (isThinking) {
        indicator.classList.remove('hidden')
      } else {
        indicator.classList.add('hidden')
      }
    }
  }

  updateConnectionStatus(status: string): void {
    const statusDot = document.querySelector('.status-dot')
    const statusText = document.querySelector('.status-text')
    
    if (statusDot && statusText) {
      statusDot.className = `status-dot ${status}`
      
      switch (status) {
        case 'connected':
          statusText.textContent = '在线'
          break
        case 'connecting':
          statusText.textContent = '连接中'
          break
        case 'disconnected':
          statusText.textContent = '离线'
          break
        case 'error':
          statusText.textContent = '错误'
          break
        default:
          statusText.textContent = '未知'
      }
    }
  }

  applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme)
    
    // 保存主题设置
    localStorage.setItem('theme', theme)
  }

  showError(message: string): void {
    this.notificationManager.showError(message)
  }

  showSuccess(message: string): void {
    this.notificationManager.showSuccess(message)
  }

  showInfo(message: string): void {
    this.notificationManager.showInfo(message)
  }

  displayAIMessage(data: any): void {
    // 处理AI消息显示
    if (data.isComplete) {
      this.handleAIMessageComplete(data.message)
    } else {
      this.handleAIMessageChunk(data)
    }
  }

  private showWelcomeScreen(): void {
    const welcomeScreen = document.getElementById('welcome-screen')
    const chatMessages = document.getElementById('chat-messages')
    
    if (welcomeScreen && chatMessages) {
      welcomeScreen.classList.remove('hidden')
      chatMessages.classList.add('hidden')
      this.isWelcomeScreenVisible = true
    }
  }

  private hideWelcomeScreen(): void {
    const welcomeScreen = document.getElementById('welcome-screen')
    const chatMessages = document.getElementById('chat-messages')
    
    if (welcomeScreen && chatMessages) {
      welcomeScreen.classList.add('hidden')
      chatMessages.classList.remove('hidden')
      this.isWelcomeScreenVisible = false
    }
  }

  private resetToWelcomeScreen(): void {
    // 清空消息容器
    this.messageRenderer.clearMessages()
    
    // 显示欢迎屏幕
    this.showWelcomeScreen()
    
    // 重置输入框
    this.inputHandler.clearInput()
  }

  private scrollToBottom(): void {
    const chatMessages = document.getElementById('chat-messages')
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight
    }
  }

  private closeModals(): void {
    // 关闭所有模态框
    const modals = document.querySelectorAll('.modal')
    modals.forEach(modal => {
      modal.classList.add('hidden')
    })
  }

  // 重置UI管理器
  async reset(): Promise<void> {
    this.messageRenderer.clearMessages()
    this.inputHandler.clearInput()
    this.resetToWelcomeScreen()
  }

  // 销毁UI管理器
  destroy(): void {
    this.messageRenderer.destroy()
    this.inputHandler.destroy()
    this.notificationManager.destroy()
  }
}
