import './styles/main.css'
import { ConversationManager, type Conversation, type ChatMessage } from './utils/ConversationManager'

// 全局变量
let conversationManager: ConversationManager
let currentConversation: Conversation | null = null

// 简化版初始化，先确保基本功能正常
console.log('🚀 开始初始化 Gemini-Style AI Assistant...')

// 初始化应用
async function initializeApp() {
  try {
    console.log('📝 开始初始化应用...')

    // 显示加载屏幕
    showLoadingScreen()

    // 延迟一下模拟加载过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 初始化基本功能
    await initializeBasicFeatures()

    // 隐藏加载屏幕，显示主界面
    hideLoadingScreen()

    console.log('✅ Gemini-Style AI Assistant 初始化完成')
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
    showErrorMessage('应用初始化失败，请刷新页面重试')
  }
}

// 初始化基本功能
async function initializeBasicFeatures() {
  console.log('🎨 初始化基本UI功能...')

  // 初始化对话管理器
  conversationManager = new ConversationManager()
  currentConversation = conversationManager.getCurrentConversation()

  // 初始化UI组件
  initializeInputHandlers()
  initializeSidebarHandlers()
  initializeSuggestionCards()

  // 渲染对话历史
  renderConversationHistory()

  // 加载当前对话
  loadCurrentConversation()

  console.log('✅ 基本UI功能初始化完成')
}

// 初始化输入处理器
function initializeInputHandlers() {
  const messageInput = document.getElementById('message-input') as HTMLTextAreaElement
  const sendBtn = document.getElementById('send-btn') as HTMLButtonElement

  if (messageInput && sendBtn) {
    // 输入框事件
    messageInput.addEventListener('input', () => {
      sendBtn.disabled = messageInput.value.trim().length === 0
    })

    // 发送按钮事件
    sendBtn.addEventListener('click', () => {
      sendMessage(messageInput.value.trim())
    })

    // 回车发送
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage(messageInput.value.trim())
      }
    })
  }
}

// 初始化侧边栏处理器
function initializeSidebarHandlers() {
  // 新建对话按钮
  const newChatBtn = document.getElementById('new-chat-btn')
  if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewConversation)
  }

  // 侧边栏切换按钮
  const sidebarToggle = document.getElementById('sidebar-toggle')
  const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle')

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar)
  }

  if (mobileSidebarToggle) {
    mobileSidebarToggle.addEventListener('click', toggleMobileSidebar)
  }

  // 清空所有对话按钮
  const clearAllBtn = document.getElementById('clear-all-btn')
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllConversations)
  }

  // 编辑标题按钮
  const editTitleBtn = document.getElementById('edit-title-btn')
  if (editTitleBtn) {
    editTitleBtn.addEventListener('click', editConversationTitle)
  }
}

// 初始化建议卡片
function initializeSuggestionCards() {
  const suggestionCards = document.querySelectorAll('.suggestion-card')
  suggestionCards.forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt')
      if (prompt) {
        const messageInput = document.getElementById('message-input') as HTMLTextAreaElement
        if (messageInput) {
          messageInput.value = prompt
          sendMessage(prompt)
        }
      }
    })
  })
}

// 创建新对话
function createNewConversation() {
  console.log('🆕 创建新对话')

  currentConversation = conversationManager.createNewConversation()

  // 清空聊天界面
  clearChatMessages()

  // 显示欢迎屏幕
  showWelcomeScreen()

  // 更新UI
  updateConversationTitle()
  renderConversationHistory()
}

// 切换对话
function switchConversation(conversationId: string) {
  console.log('🔄 切换对话:', conversationId)

  const conversation = conversationManager.switchToConversation(conversationId)
  if (conversation) {
    currentConversation = conversation
    loadCurrentConversation()
    updateConversationTitle()
    renderConversationHistory()
  }
}

// 删除对话
function deleteConversation(conversationId: string) {
  console.log('🗑️ 删除对话:', conversationId)

  if (confirm('确定要删除这个对话吗？')) {
    conversationManager.deleteConversation(conversationId)
    currentConversation = conversationManager.getCurrentConversation()
    loadCurrentConversation()
    updateConversationTitle()
    renderConversationHistory()
  }
}

// 清空所有对话
function clearAllConversations() {
  console.log('🗑️ 清空所有对话')

  if (confirm('确定要清空所有对话吗？此操作不可恢复。')) {
    conversationManager.clearAllConversations()
    currentConversation = conversationManager.getCurrentConversation()
    clearChatMessages()
    showWelcomeScreen()
    updateConversationTitle()
    renderConversationHistory()
  }
}

// 编辑对话标题
function editConversationTitle() {
  if (!currentConversation) return

  const newTitle = prompt('请输入新的对话标题:', currentConversation.title)
  if (newTitle !== null && newTitle.trim() !== '') {
    conversationManager.renameConversation(currentConversation.id, newTitle.trim())
    currentConversation.title = newTitle.trim()
    updateConversationTitle()
    renderConversationHistory()
  }
}

// 发送消息函数
async function sendMessage(message: string) {
  if (!message || !currentConversation) return

  console.log('📤 发送消息:', message)

  // 隐藏欢迎屏幕，显示聊天界面
  const welcomeScreen = document.getElementById('welcome-screen')
  const chatMessages = document.getElementById('chat-messages')

  if (welcomeScreen && chatMessages) {
    welcomeScreen.classList.add('hidden')
    chatMessages.classList.remove('hidden')
  }

  // 添加用户消息到对话管理器
  const userMessage = conversationManager.addMessage('user', message)

  // 添加用户消息到UI
  addUserMessage(message)

  // 清空输入框
  const messageInput = document.getElementById('message-input') as HTMLTextAreaElement
  if (messageInput) {
    messageInput.value = ''
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement
    if (sendBtn) sendBtn.disabled = true
  }

  // 显示思考指示器
  showThinkingIndicator()

  try {
    // 调用后端API
    const response = await fetch('http://localhost:8000/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 处理流式响应
    await handleStreamResponse(response)

  } catch (error) {
    console.error('❌ 发送消息失败:', error)
    addErrorMessage('发送消息失败，请检查后端服务是否启动')
  } finally {
    hideThinkingIndicator()
    // 更新对话历史显示
    renderConversationHistory()
  }
}

// 处理流式响应
async function handleStreamResponse(response: Response) {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''
  let fullResponse = ''
  let messageId = 'ai-' + Date.now()

  // 开始AI消息
  startAIMessage(messageId)

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            completeAIMessage(messageId, fullResponse)
            // 添加AI消息到对话管理器
            if (currentConversation && fullResponse) {
              conversationManager.addMessage('assistant', fullResponse)
            }
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content' && parsed.content) {
              fullResponse += parsed.content
              updateAIMessage(messageId, parsed.content)
            }
          } catch (e) {
            console.warn('解析SSE数据失败:', e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// 渲染对话历史
function renderConversationHistory() {
  const grouped = conversationManager.getConversationsGrouped()

  // 渲染今天的对话
  renderConversationGroup('today-chats', grouped.today)

  // 渲染昨天的对话
  renderConversationGroup('yesterday-chats', grouped.yesterday)

  // 渲染更早的对话
  renderConversationGroup('older-chats', grouped.older)
}

// 渲染对话组
function renderConversationGroup(containerId: string, conversations: Conversation[]) {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = ''

  conversations.forEach(conversation => {
    const chatItem = document.createElement('div')
    chatItem.className = `chat-item ${currentConversation?.id === conversation.id ? 'active' : ''}`
    chatItem.setAttribute('data-conversation-id', conversation.id)

    chatItem.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${escapeHtml(conversation.title)}</div>
        ${conversation.preview ? `<div class="chat-item-preview">${escapeHtml(conversation.preview)}</div>` : ''}
        <div class="chat-item-time">${formatRelativeTime(conversation.updatedAt)}</div>
      </div>
      <div class="chat-item-actions">
        <button class="chat-action-btn delete" title="删除对话" data-action="delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18l-2 13H5L3 6zm5 0V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
            <path d="M10 11v6m4-6v6"/>
          </svg>
        </button>
      </div>
    `

    // 点击切换对话
    chatItem.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.chat-action-btn')) {
        switchConversation(conversation.id)
        closeMobileSidebar()
      }
    })

    // 删除按钮
    const deleteBtn = chatItem.querySelector('[data-action="delete"]')
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        deleteConversation(conversation.id)
      })
    }

    container.appendChild(chatItem)
  })
}

// 加载当前对话
function loadCurrentConversation() {
  if (!currentConversation) return

  clearChatMessages()

  if (currentConversation.messages.length === 0) {
    showWelcomeScreen()
  } else {
    hideWelcomeScreen()

    // 渲染所有消息
    currentConversation.messages.forEach(message => {
      if (message.role === 'user') {
        addUserMessage(message.content)
      } else if (message.role === 'assistant') {
        const messageId = 'ai-' + message.id
        startAIMessage(messageId)
        completeAIMessage(messageId, message.content)
      }
    })
  }
}

// 更新对话标题
function updateConversationTitle() {
  const titleElement = document.getElementById('conversation-name')
  if (titleElement && currentConversation) {
    titleElement.textContent = currentConversation.title
  }
}

// 侧边栏控制
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('collapsed')
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  if (sidebar) {
    sidebar.classList.toggle('open')

    // 添加/移除遮罩层
    let overlay = document.querySelector('.sidebar-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.className = 'sidebar-overlay'
      document.body.appendChild(overlay)

      overlay.addEventListener('click', closeMobileSidebar)
    }

    if (sidebar.classList.contains('open')) {
      overlay.classList.add('show')
    } else {
      overlay.classList.remove('show')
    }
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.querySelector('.sidebar-overlay')

  if (sidebar) {
    sidebar.classList.remove('open')
  }

  if (overlay) {
    overlay.classList.remove('show')
  }
}

// 显示加载屏幕
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  const mainInterface = document.getElementById('main-interface')

  if (loadingScreen && mainInterface) {
    loadingScreen.classList.remove('hidden')
    mainInterface.classList.add('hidden')

    // 模拟加载进度
    const progressBar = loadingScreen.querySelector('.progress-bar') as HTMLElement
    if (progressBar) {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
        }
        progressBar.style.width = `${progress}%`
      }, 150)
    }
  }
}

// 隐藏加载屏幕
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen')
  const mainInterface = document.getElementById('main-interface')

  if (loadingScreen && mainInterface) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden')
      mainInterface.classList.remove('hidden')

      // 添加入场动画
      mainInterface.style.animation = 'fadeInUp 0.8s ease-out'
    }, 1000) // 缩短加载时间
  }
}

// 添加用户消息
function addUserMessage(message: string) {
  const chatMessages = document.getElementById('chat-messages')
  if (!chatMessages) return

  const messageDiv = document.createElement('div')
  messageDiv.className = 'message user-message'
  messageDiv.innerHTML = `
    <div class="message-wrapper">
      <div class="message-content user-content">
        ${escapeHtml(message)}
      </div>
      <div class="message-meta">
        <span class="message-time">刚刚</span>
      </div>
    </div>
  `

  chatMessages.appendChild(messageDiv)
  scrollToBottom()
}

// 开始AI消息
function startAIMessage(messageId: string) {
  const chatMessages = document.getElementById('chat-messages')
  if (!chatMessages) return

  const messageDiv = document.createElement('div')
  messageDiv.className = 'message assistant-message streaming'
  messageDiv.setAttribute('data-message-id', messageId)
  messageDiv.innerHTML = `
    <div class="message-wrapper">
      <div class="message-avatar">
        <div class="avatar-container">
          <div class="avatar-sparkle"></div>
        </div>
      </div>
      <div class="message-body">
        <div class="message-header">
          <span class="sender-name">Gemini</span>
          <span class="message-time">刚刚</span>
        </div>
        <div class="message-content assistant-content">
          <div class="typing-cursor"></div>
        </div>
      </div>
    </div>
  `

  chatMessages.appendChild(messageDiv)
  scrollToBottom()
}

// 更新AI消息
function updateAIMessage(messageId: string, content: string) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
  if (!messageElement) return

  const contentElement = messageElement.querySelector('.assistant-content')
  if (contentElement) {
    // 移除光标，添加内容
    const cursor = contentElement.querySelector('.typing-cursor')
    if (cursor) cursor.remove()

    contentElement.textContent += content

    // 重新添加光标
    const newCursor = document.createElement('div')
    newCursor.className = 'typing-cursor'
    contentElement.appendChild(newCursor)
  }

  scrollToBottom()
}

// 完成AI消息
function completeAIMessage(messageId: string, fullContent: string) {
  const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
  if (!messageElement) return

  const contentElement = messageElement.querySelector('.assistant-content')
  if (contentElement) {
    // 移除光标
    const cursor = contentElement.querySelector('.typing-cursor')
    if (cursor) cursor.remove()

    // 渲染Markdown（简化版）
    contentElement.innerHTML = formatMarkdown(fullContent)
  }

  messageElement.classList.remove('streaming')
  scrollToBottom()
}

// 添加错误消息
function addErrorMessage(message: string) {
  const chatMessages = document.getElementById('chat-messages')
  if (!chatMessages) return

  const messageDiv = document.createElement('div')
  messageDiv.className = 'message error-message'
  messageDiv.innerHTML = `
    <div class="message-wrapper error-wrapper">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="message-content error-content">
        ${escapeHtml(message)}
      </div>
    </div>
  `

  chatMessages.appendChild(messageDiv)
  scrollToBottom()
}

// 显示/隐藏欢迎屏幕
function showWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen')
  const chatMessages = document.getElementById('chat-messages')

  if (welcomeScreen && chatMessages) {
    welcomeScreen.classList.remove('hidden')
    chatMessages.classList.add('hidden')
  }
}

function hideWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen')
  const chatMessages = document.getElementById('chat-messages')

  if (welcomeScreen && chatMessages) {
    welcomeScreen.classList.add('hidden')
    chatMessages.classList.remove('hidden')
  }
}

// 清空聊天消息
function clearChatMessages() {
  const chatMessages = document.getElementById('chat-messages')
  if (chatMessages) {
    chatMessages.innerHTML = ''
  }
}

// 显示/隐藏思考指示器
function showThinkingIndicator() {
  const indicator = document.getElementById('thinking-indicator')
  if (indicator) {
    indicator.classList.remove('hidden')
  }
}

function hideThinkingIndicator() {
  const indicator = document.getElementById('thinking-indicator')
  if (indicator) {
    indicator.classList.add('hidden')
  }
}

// 格式化相对时间
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) { // 小于1分钟
    return '刚刚'
  } else if (diff < 3600000) { // 小于1小时
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 小于1天
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 172800000) { // 小于2天
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

// 滚动到底部
function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages')
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

// HTML转义
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 简化的Markdown格式化
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 显示错误消息
function showErrorMessage(message: string) {
  console.error('❌ 错误:', message)

  // 创建简单的错误提示
  const notification = document.createElement('div')
  notification.className = 'notification error show'
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="notification-body">
        <div class="notification-message">${escapeHtml(message)}</div>
      </div>
      <button class="notification-close">×</button>
    </div>
  `

  // 添加到页面
  let container = document.getElementById('notification-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'notification-container'
    container.className = 'notification-container'
    document.body.appendChild(container)
  }

  container.appendChild(notification)

  // 关闭按钮事件
  const closeBtn = notification.querySelector('.notification-close')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.remove()
    })
  }

  // 自动移除通知
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 5000)
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM加载完成，开始初始化应用...')
  initializeApp()
})

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  console.log('🔄 页面卸载，清理资源...')
})

console.log('📝 main.ts 加载完成')
