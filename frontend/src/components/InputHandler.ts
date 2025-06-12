import { EventBus } from '../utils/EventBus'

export class InputHandler {
  private eventBus: EventBus
  private inputElement: HTMLTextAreaElement | null = null
  private sendButton: HTMLButtonElement | null = null
  private charCountElement: HTMLElement | null = null
  private isComposing = false

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  async initialize(): Promise<void> {
    this.inputElement = document.getElementById('message-input') as HTMLTextAreaElement
    this.sendButton = document.getElementById('send-btn') as HTMLButtonElement
    this.charCountElement = document.querySelector('.char-count')

    if (!this.inputElement || !this.sendButton) {
      throw new Error('输入元素未找到')
    }

    this.setupEventListeners()
    this.updateSendButton()
    
    console.log('⌨️ 输入处理器初始化完成')
  }

  private setupEventListeners(): void {
    if (!this.inputElement || !this.sendButton) return

    // 输入事件
    this.inputElement.addEventListener('input', () => {
      this.handleInput()
    })

    // 键盘事件
    this.inputElement.addEventListener('keydown', (e) => {
      this.handleKeyDown(e)
    })

    // 组合输入事件（中文输入法）
    this.inputElement.addEventListener('compositionstart', () => {
      this.isComposing = true
    })

    this.inputElement.addEventListener('compositionend', () => {
      this.isComposing = false
      this.handleInput()
    })

    // 粘贴事件
    this.inputElement.addEventListener('paste', (e) => {
      this.handlePaste(e)
    })

    // 发送按钮点击
    this.sendButton.addEventListener('click', () => {
      this.sendMessage()
    })

    // 聚焦和失焦事件
    this.inputElement.addEventListener('focus', () => {
      this.inputElement?.parentElement?.classList.add('focused')
    })

    this.inputElement.addEventListener('blur', () => {
      this.inputElement?.parentElement?.classList.remove('focused')
    })

    // 监听快捷键事件
    this.eventBus.on('shortcut:sendMessage', () => {
      this.sendMessage()
    })

    this.eventBus.on('shortcut:focusInput', () => {
      this.focus()
    })
  }

  private handleInput(): void {
    if (this.isComposing) return

    this.adjustTextareaHeight()
    this.updateCharCount()
    this.updateSendButton()
    this.showTypingIndicator()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Enter键发送消息（Shift+Enter换行）
    if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
      e.preventDefault()
      this.sendMessage()
    }

    // Escape键清空输入
    if (e.key === 'Escape') {
      this.clearInput()
    }

    // Tab键插入缩进
    if (e.key === 'Tab') {
      e.preventDefault()
      this.insertText('  ')
    }
  }

  private handlePaste(e: ClipboardEvent): void {
    const clipboardData = e.clipboardData
    if (!clipboardData) return

    // 处理文件粘贴
    const files = Array.from(clipboardData.files)
    if (files.length > 0) {
      e.preventDefault()
      this.handleFileUpload(files)
      return
    }

    // 处理文本粘贴
    const text = clipboardData.getData('text/plain')
    if (text) {
      // 延迟处理，确保文本已插入
      setTimeout(() => {
        this.handleInput()
      }, 0)
    }
  }

  private adjustTextareaHeight(): void {
    if (!this.inputElement) return

    // 重置高度以获取正确的scrollHeight
    this.inputElement.style.height = 'auto'
    
    // 计算新高度（最小24px，最大200px）
    const newHeight = Math.min(Math.max(this.inputElement.scrollHeight, 24), 200)
    this.inputElement.style.height = `${newHeight}px`
  }

  private updateCharCount(): void {
    if (!this.inputElement || !this.charCountElement) return

    const currentLength = this.inputElement.value.length
    const maxLength = parseInt(this.inputElement.getAttribute('maxlength') || '2000')
    
    this.charCountElement.textContent = `${currentLength}/${maxLength}`
    
    // 根据字符数量改变颜色
    if (currentLength > maxLength * 0.9) {
      this.charCountElement.style.color = 'var(--primary-red)'
    } else if (currentLength > maxLength * 0.8) {
      this.charCountElement.style.color = 'var(--primary-yellow)'
    } else {
      this.charCountElement.style.color = 'var(--text-tertiary)'
    }
  }

  private updateSendButton(): void {
    if (!this.inputElement || !this.sendButton) return

    const hasText = this.inputElement.value.trim().length > 0
    this.sendButton.disabled = !hasText
    
    if (hasText) {
      this.sendButton.classList.add('active')
    } else {
      this.sendButton.classList.remove('active')
    }
  }

  private showTypingIndicator(): void {
    // 显示正在输入指示器（可选）
    this.eventBus.emit('user:typing', true)
    
    // 3秒后隐藏
    setTimeout(() => {
      this.eventBus.emit('user:typing', false)
    }, 3000)
  }

  private sendMessage(): void {
    if (!this.inputElement) return

    const message = this.inputElement.value.trim()
    if (!message) return

    // 发送消息事件
    this.eventBus.emit('user:sendMessage', message)
    
    // 清空输入框
    this.clearInput()
  }

  private insertText(text: string): void {
    if (!this.inputElement) return

    const start = this.inputElement.selectionStart
    const end = this.inputElement.selectionEnd
    const value = this.inputElement.value

    this.inputElement.value = value.substring(0, start) + text + value.substring(end)
    this.inputElement.selectionStart = this.inputElement.selectionEnd = start + text.length

    this.handleInput()
  }

  private handleFileUpload(files: File[]): void {
    console.log('处理文件上传:', files)
    // 实现文件上传逻辑
    this.eventBus.emit('file:upload', files)
  }

  // 公共方法
  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus()
    }
  }

  blur(): void {
    if (this.inputElement) {
      this.inputElement.blur()
    }
  }

  clearInput(): void {
    if (this.inputElement) {
      this.inputElement.value = ''
      this.adjustTextareaHeight()
      this.updateCharCount()
      this.updateSendButton()
      this.focus()
    }
  }

  setInputValue(value: string): void {
    if (this.inputElement) {
      this.inputElement.value = value
      this.handleInput()
      this.focus()
    }
  }

  getInputValue(): string {
    return this.inputElement?.value || ''
  }

  setPlaceholder(placeholder: string): void {
    if (this.inputElement) {
      this.inputElement.placeholder = placeholder
    }
  }

  setMaxLength(maxLength: number): void {
    if (this.inputElement) {
      this.inputElement.setAttribute('maxlength', maxLength.toString())
      this.updateCharCount()
    }
  }

  disable(): void {
    if (this.inputElement && this.sendButton) {
      this.inputElement.disabled = true
      this.sendButton.disabled = true
    }
  }

  enable(): void {
    if (this.inputElement && this.sendButton) {
      this.inputElement.disabled = false
      this.updateSendButton()
    }
  }

  destroy(): void {
    // 移除事件监听器
    this.eventBus.off('shortcut:sendMessage', () => {})
    this.eventBus.off('shortcut:focusInput', () => {})
    
    this.inputElement = null
    this.sendButton = null
    this.charCountElement = null
  }
}
