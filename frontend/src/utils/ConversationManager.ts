export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  preview?: string
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map()
  private currentConversationId: string | null = null
  private storageKey = 'gemini-chat-conversations'

  constructor() {
    this.loadFromStorage()
  }

  // 创建新对话
  createNewConversation(): Conversation {
    const conversation: Conversation = {
      id: this.generateId(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.conversations.set(conversation.id, conversation)
    this.currentConversationId = conversation.id
    this.saveToStorage()

    return conversation
  }

  // 获取当前对话
  getCurrentConversation(): Conversation | null {
    if (!this.currentConversationId) {
      return this.createNewConversation()
    }
    return this.conversations.get(this.currentConversationId) || null
  }

  // 切换对话
  switchToConversation(conversationId: string): Conversation | null {
    const conversation = this.conversations.get(conversationId)
    if (conversation) {
      this.currentConversationId = conversationId
      return conversation
    }
    return null
  }

  // 添加消息到当前对话
  addMessage(role: 'user' | 'assistant' | 'system', content: string): ChatMessage {
    const conversation = this.getCurrentConversation()
    if (!conversation) {
      throw new Error('没有活动的对话')
    }

    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date()
    }

    conversation.messages.push(message)
    conversation.updatedAt = new Date()

    // 自动生成标题（基于第一条用户消息）
    if (conversation.title === '新对话' && role === 'user' && conversation.messages.length === 1) {
      conversation.title = this.generateTitle(content)
    }

    // 更新预览
    if (role === 'assistant') {
      conversation.preview = content.slice(0, 50) + (content.length > 50 ? '...' : '')
    }

    this.saveToStorage()
    return message
  }

  // 删除对话
  deleteConversation(conversationId: string): boolean {
    const deleted = this.conversations.delete(conversationId)
    
    if (deleted) {
      // 如果删除的是当前对话，切换到最新的对话或创建新对话
      if (this.currentConversationId === conversationId) {
        const remaining = Array.from(this.conversations.values())
        if (remaining.length > 0) {
          // 切换到最新的对话
          const latest = remaining.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
          this.currentConversationId = latest.id
        } else {
          // 创建新对话
          this.createNewConversation()
        }
      }
      
      this.saveToStorage()
    }
    
    return deleted
  }

  // 清空所有对话
  clearAllConversations(): void {
    this.conversations.clear()
    this.currentConversationId = null
    this.saveToStorage()
    this.createNewConversation()
  }

  // 重命名对话
  renameConversation(conversationId: string, newTitle: string): boolean {
    const conversation = this.conversations.get(conversationId)
    if (conversation) {
      conversation.title = newTitle.trim() || '新对话'
      conversation.updatedAt = new Date()
      this.saveToStorage()
      return true
    }
    return false
  }

  // 获取所有对话（按时间分组）
  getConversationsGrouped(): {
    today: Conversation[]
    yesterday: Conversation[]
    older: Conversation[]
  } {
    const conversations = Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    return {
      today: conversations.filter(c => c.updatedAt >= today),
      yesterday: conversations.filter(c => c.updatedAt >= yesterday && c.updatedAt < today),
      older: conversations.filter(c => c.updatedAt < yesterday)
    }
  }

  // 获取对话数量
  getConversationCount(): number {
    return this.conversations.size
  }

  // 导出对话
  exportConversation(conversationId: string): string | null {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return null

    const content = conversation.messages
      .map(msg => `**${msg.role}**: ${msg.content}`)
      .join('\n\n')

    return `# ${conversation.title}\n\n${content}`
  }

  // 生成ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 生成标题
  private generateTitle(content: string): string {
    // 取前30个字符作为标题
    let title = content.slice(0, 30).trim()
    if (content.length > 30) {
      title += '...'
    }
    return title || '新对话'
  }

  // 保存到本地存储
  private saveToStorage(): void {
    try {
      const data = {
        conversations: Array.from(this.conversations.entries()),
        currentConversationId: this.currentConversationId
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('保存对话到本地存储失败:', error)
    }
  }

  // 从本地存储加载
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const parsed = JSON.parse(data)
        
        // 恢复对话数据
        if (parsed.conversations) {
          this.conversations = new Map(
            parsed.conversations.map(([id, conv]: [string, any]) => [
              id,
              {
                ...conv,
                createdAt: new Date(conv.createdAt),
                updatedAt: new Date(conv.updatedAt),
                messages: conv.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
              }
            ])
          )
        }
        
        this.currentConversationId = parsed.currentConversationId
      }
    } catch (error) {
      console.error('从本地存储加载对话失败:', error)
      this.conversations.clear()
      this.currentConversationId = null
    }

    // 如果没有对话，创建一个新的
    if (this.conversations.size === 0) {
      this.createNewConversation()
    }
  }
}
