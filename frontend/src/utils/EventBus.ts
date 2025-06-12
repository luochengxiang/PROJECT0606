export type EventHandler = (...args: any[]) => void

export class EventBus {
  private events: Map<string, EventHandler[]> = new Map()

  // 监听事件
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(handler)
  }

  // 监听事件（只触发一次）
  once(event: string, handler: EventHandler): void {
    const onceHandler = (...args: any[]) => {
      handler(...args)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  // 移除事件监听器
  off(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 触发事件
  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`事件处理器错误 [${event}]:`, error)
        }
      })
    }
  }

  // 移除所有监听器
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  // 获取事件列表
  getEvents(): string[] {
    return Array.from(this.events.keys())
  }

  // 获取事件监听器数量
  getListenerCount(event: string): number {
    return this.events.get(event)?.length || 0
  }
}
