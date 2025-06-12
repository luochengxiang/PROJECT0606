import { ChatManager } from './ChatManager'
import { UIManager } from './UIManager'
import { EventBus } from '../utils/EventBus'
import { ApiClient } from '../api/ApiClient'

export class App {
  private chatManager: ChatManager
  private uiManager: UIManager
  private apiClient: ApiClient
  private eventBus: EventBus
  private isInitialized = false

  constructor() {
    this.eventBus = new EventBus()
    this.apiClient = new ApiClient()
    this.uiManager = new UIManager(this.eventBus)
    this.chatManager = new ChatManager(this.apiClient, this.eventBus)
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      console.log('🔧 初始化应用组件...')
      
      // 初始化API客户端
      await this.apiClient.initialize()
      
      // 初始化UI管理器
      await this.uiManager.initialize()
      
      // 初始化聊天管理器
      await this.chatManager.initialize()
      
      // 设置事件监听器
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ 应用初始化完成')
      
      // 发送初始化完成事件
      this.eventBus.emit('app:initialized')
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    // 监听用户发送消息事件
    this.eventBus.on('user:sendMessage', (message: string) => {
      this.chatManager.sendMessage(message)
    })

    // 监听AI响应事件
    this.eventBus.on('ai:messageReceived', (data: any) => {
      this.uiManager.displayAIMessage(data)
    })

    // 监听错误事件
    this.eventBus.on('error:occurred', (error: Error) => {
      this.uiManager.showError(error.message)
    })

    // 监听连接状态变化
    this.eventBus.on('connection:statusChanged', (status: string) => {
      this.uiManager.updateConnectionStatus(status)
    })

    // 监听主题切换事件
    this.eventBus.on('theme:changed', (theme: string) => {
      this.uiManager.applyTheme(theme)
    })

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.eventBus.emit('window:resized')
    })

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.eventBus.emit('app:hidden')
      } else {
        this.eventBus.emit('app:visible')
      }
    })

    // 监听键盘快捷键
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event)
    })
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl/Cmd + Enter 发送消息
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      this.eventBus.emit('shortcut:sendMessage')
    }

    // Ctrl/Cmd + K 聚焦输入框
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      this.eventBus.emit('shortcut:focusInput')
    }

    // Ctrl/Cmd + N 新建对话
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault()
      this.eventBus.emit('shortcut:newChat')
    }

    // Escape 关闭模态框
    if (event.key === 'Escape') {
      this.eventBus.emit('shortcut:escape')
    }
  }

  // 获取应用状态
  getStatus(): object {
    return {
      initialized: this.isInitialized,
      chatManager: this.chatManager.getStatus(),
      apiClient: this.apiClient.getStatus(),
      timestamp: new Date().toISOString()
    }
  }

  // 重置应用
  async reset(): Promise<void> {
    console.log('🔄 重置应用...')
    
    await this.chatManager.reset()
    await this.uiManager.reset()
    
    this.eventBus.emit('app:reset')
    console.log('✅ 应用重置完成')
  }

  // 销毁应用
  destroy(): void {
    console.log('🗑️ 销毁应用...')
    
    this.chatManager.destroy()
    this.uiManager.destroy()
    this.apiClient.destroy()
    this.eventBus.removeAllListeners()
    
    this.isInitialized = false
    console.log('✅ 应用销毁完成')
  }
}
