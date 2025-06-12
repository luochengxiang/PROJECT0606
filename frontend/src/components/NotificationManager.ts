export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationOptions {
  title?: string
  message: string
  type: NotificationType
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  handler: () => void
  style?: 'primary' | 'secondary'
}

export class NotificationManager {
  private container: HTMLElement | null = null
  private notifications: Map<string, HTMLElement> = new Map()
  private notificationCount = 0

  async initialize(): Promise<void> {
    this.container = document.getElementById('notification-container')
    if (!this.container) {
      // 创建通知容器
      this.container = document.createElement('div')
      this.container.id = 'notification-container'
      this.container.className = 'notification-container'
      document.body.appendChild(this.container)
    }

    console.log('🔔 通知管理器初始化完成')
  }

  showSuccess(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'success',
      ...options
    })
  }

  showError(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'error',
      duration: 0, // 错误通知默认不自动消失
      ...options
    })
  }

  showInfo(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'info',
      ...options
    })
  }

  showWarning(message: string, options?: Partial<NotificationOptions>): string {
    return this.show({
      message,
      type: 'warning',
      ...options
    })
  }

  show(options: NotificationOptions): string {
    if (!this.container) {
      console.error('通知容器未初始化')
      return ''
    }

    const id = `notification-${++this.notificationCount}`
    const notification = this.createNotificationElement(id, options)
    
    this.notifications.set(id, notification)
    this.container.appendChild(notification)

    // 触发入场动画
    requestAnimationFrame(() => {
      notification.classList.add('show')
    })

    // 自动移除（如果设置了持续时间）
    if (!options.persistent && options.duration !== 0) {
      const duration = options.duration || this.getDefaultDuration(options.type)
      setTimeout(() => {
        this.remove(id)
      }, duration)
    }

    return id
  }

  remove(id: string): void {
    const notification = this.notifications.get(id)
    if (notification) {
      notification.classList.add('removing')
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
        this.notifications.delete(id)
      }, 300) // 等待退场动画完成
    }
  }

  removeAll(): void {
    this.notifications.forEach((_, id) => {
      this.remove(id)
    })
  }

  private createNotificationElement(id: string, options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div')
    notification.className = `notification ${options.type}`
    notification.setAttribute('data-notification-id', id)

    const icon = this.getIcon(options.type)
    const hasActions = options.actions && options.actions.length > 0

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${icon}
        </div>
        <div class="notification-body">
          ${options.title ? `<div class="notification-title">${this.escapeHtml(options.title)}</div>` : ''}
          <div class="notification-message">${this.escapeHtml(options.message)}</div>
          ${hasActions ? '<div class="notification-actions"></div>' : ''}
        </div>
        <button class="notification-close" title="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `

    // 添加关闭按钮事件
    const closeButton = notification.querySelector('.notification-close')
    closeButton?.addEventListener('click', () => {
      this.remove(id)
    })

    // 添加操作按钮
    if (hasActions) {
      const actionsContainer = notification.querySelector('.notification-actions')
      if (actionsContainer && options.actions) {
        options.actions.forEach(action => {
          const button = document.createElement('button')
          button.className = `notification-action ${action.style || 'secondary'}`
          button.textContent = action.label
          button.addEventListener('click', () => {
            action.handler()
            this.remove(id)
          })
          actionsContainer.appendChild(button)
        })
      }
    }

    // 点击通知本身也可以关闭（除非有操作按钮）
    if (!hasActions) {
      notification.addEventListener('click', () => {
        this.remove(id)
      })
    }

    return notification
  }

  private getIcon(type: NotificationType): string {
    switch (type) {
      case 'success':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        `
      case 'error':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        `
      case 'warning':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        `
      case 'info':
      default:
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        `
    }
  }

  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 3000
      case 'info':
        return 4000
      case 'warning':
        return 5000
      case 'error':
        return 0 // 错误通知不自动消失
      default:
        return 4000
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // 获取当前通知数量
  getNotificationCount(): number {
    return this.notifications.size
  }

  // 检查是否有特定类型的通知
  hasNotificationType(type: NotificationType): boolean {
    for (const notification of this.notifications.values()) {
      if (notification.classList.contains(type)) {
        return true
      }
    }
    return false
  }

  destroy(): void {
    this.removeAll()
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.notifications.clear()
  }
}
