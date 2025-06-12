import { Message, MessageType } from '../types/Message'
import { marked } from 'marked'
import hljs from 'highlight.js'

export class MessageRenderer {
  private container: HTMLElement | null = null
  private messageElements: Map<string, HTMLElement> = new Map()

  async initialize(): Promise<void> {
    this.container = document.getElementById('chat-messages')
    if (!this.container) {
      throw new Error('聊天消息容器未找到')
    }

    // 配置marked
    marked.setOptions({
      highlight: (code: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value
          } catch (err) {
            console.warn('代码高亮失败:', err)
          }
        }
        return hljs.highlightAuto(code).value
      },
      breaks: true,
      gfm: true
    })

    console.log('📝 消息渲染器初始化完成')
  }

  renderUserMessage(message: Message): void {
    const messageElement = this.createMessageElement(message, 'user')
    this.addMessageToContainer(messageElement)
    this.messageElements.set(message.id, messageElement)
  }

  startAIMessage(message: Message): void {
    const messageElement = this.createMessageElement(message, 'assistant', true)
    this.addMessageToContainer(messageElement)
    this.messageElements.set(message.id, messageElement)
  }

  updateAIMessage(messageId: string, content: string): void {
    const messageElement = this.messageElements.get(messageId)
    if (messageElement) {
      const contentElement = messageElement.querySelector('.message-content')
      if (contentElement) {
        contentElement.textContent += content
      }
    }
  }

  completeAIMessage(message: Message): void {
    const messageElement = this.messageElements.get(message.id)
    if (messageElement) {
      const contentElement = messageElement.querySelector('.message-content')
      if (contentElement) {
        // 渲染Markdown
        contentElement.innerHTML = marked.parse(message.content)

        // 添加代码复制按钮
        this.addCodeCopyButtons(messageElement)

        // 移除流式指示器
        messageElement.classList.remove('streaming')

        // 添加消息操作按钮
        this.addMessageActions(messageElement, message)
      }
    }
  }

  renderErrorMessage(message: Message): void {
    const messageElement = this.createMessageElement(message, 'error')
    this.addMessageToContainer(messageElement)
    this.messageElements.set(message.id, messageElement)
  }

  private createMessageElement(message: Message, type: string, isStreaming = false): HTMLElement {
    const messageDiv = document.createElement('div')
    messageDiv.className = `message ${type}-message ${isStreaming ? 'streaming' : ''}`
    messageDiv.setAttribute('data-message-id', message.id)

    if (type === 'user') {
      messageDiv.innerHTML = `
        <div class="message-wrapper">
          <div class="message-content user-content">
            ${this.escapeHtml(message.content)}
          </div>
          <div class="message-meta">
            <span class="message-time">${this.formatTime(message.timestamp)}</span>
          </div>
        </div>
      `
    } else if (type === 'assistant') {
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
              <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content assistant-content">
              ${isStreaming ? '' : marked.parse(message.content)}
            </div>
            ${isStreaming ? '<div class="typing-cursor"></div>' : ''}
          </div>
        </div>
      `
    } else if (type === 'error') {
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
            ${this.escapeHtml(message.content)}
          </div>
        </div>
      `
    }

    // 添加入场动画
    messageDiv.style.opacity = '0'
    messageDiv.style.transform = 'translateY(20px)'

    return messageDiv
  }

  private addMessageToContainer(messageElement: HTMLElement): void {
    if (!this.container) return

    this.container.appendChild(messageElement)

    // 触发入场动画
    requestAnimationFrame(() => {
      messageElement.style.transition = 'all 0.3s ease-out'
      messageElement.style.opacity = '1'
      messageElement.style.transform = 'translateY(0)'
    })

    // 滚动到底部
    this.scrollToBottom()
  }

  private addCodeCopyButtons(messageElement: HTMLElement): void {
    const codeBlocks = messageElement.querySelectorAll('pre code')
    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement
      if (pre) {
        const copyButton = document.createElement('button')
        copyButton.className = 'code-copy-btn'
        copyButton.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        `
        copyButton.title = '复制代码'

        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(codeBlock.textContent || '')
            copyButton.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            `
            setTimeout(() => {
              copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              `
            }, 2000)
          } catch (err) {
            console.error('复制失败:', err)
          }
        })

        pre.style.position = 'relative'
        pre.appendChild(copyButton)
      }
    })
  }

  private addMessageActions(messageElement: HTMLElement, message: Message): void {
    const actionsContainer = document.createElement('div')
    actionsContainer.className = 'message-actions'

    actionsContainer.innerHTML = `
      <button class="action-btn copy-btn" title="复制消息">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button class="action-btn like-btn" title="点赞">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
        </svg>
      </button>
      <button class="action-btn dislike-btn" title="踩">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
        </svg>
      </button>
    `

    // 添加事件监听器
    const copyBtn = actionsContainer.querySelector('.copy-btn')
    copyBtn?.addEventListener('click', () => this.copyMessage(message))

    const likeBtn = actionsContainer.querySelector('.like-btn')
    likeBtn?.addEventListener('click', () => this.likeMessage(message))

    const dislikeBtn = actionsContainer.querySelector('.dislike-btn')
    dislikeBtn?.addEventListener('click', () => this.dislikeMessage(message))

    const messageBody = messageElement.querySelector('.message-body')
    if (messageBody) {
      messageBody.appendChild(actionsContainer)
    }
  }

  private async copyMessage(message: Message): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content)
      // 显示复制成功提示
      console.log('消息已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  private likeMessage(message: Message): void {
    console.log('点赞消息:', message.id)
    // 实现点赞逻辑
  }

  private dislikeMessage(message: Message): void {
    console.log('踩消息:', message.id)
    // 实现踩逻辑
  }

  private scrollToBottom(): void {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight
    }
  }

  private formatTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) { // 小于1分钟
      return '刚刚'
    } else if (diff < 3600000) { // 小于1小时
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 小于1天
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  clearMessages(): void {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.messageElements.clear()
  }

  destroy(): void {
    this.clearMessages()
    this.container = null
  }
}
