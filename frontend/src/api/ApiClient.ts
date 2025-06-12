import { StreamChunk } from '../types/Message'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface HealthResponse {
  status: string
  timestamp: string
  version: string
  autogen_version: string
  model_status: string
}

export class ApiClient {
  private baseUrl: string
  private isConnected = false

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl
  }

  async initialize(): Promise<void> {
    console.log('🔌 初始化API客户端...')
    
    try {
      await this.checkHealth()
      this.isConnected = true
      console.log('✅ API客户端连接成功')
    } catch (error) {
      console.warn('⚠️ API客户端连接失败:', error)
      this.isConnected = false
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`)
    
    if (!response.ok) {
      throw new Error(`健康检查失败: ${response.status}`)
    }
    
    return await response.json()
  }

  async sendMessage(message: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error(`发送消息失败: ${response.status}`)
    }

    return await response.json()
  }

  async *sendMessageStream(message: string): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error(`流式请求失败: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

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
              yield { type: 'complete' }
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'content' && parsed.content) {
                yield {
                  type: 'content',
                  content: parsed.content,
                  timestamp: parsed.timestamp
                }
              } else if (parsed.type === 'error') {
                yield {
                  type: 'error',
                  error: parsed.error || '未知错误'
                }
                return
              } else if (parsed.type === 'complete') {
                yield { type: 'complete' }
                return
              }
            } catch (parseError) {
              console.warn('解析SSE数据失败:', parseError, data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  async getChatHistory(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/chat/history`)
    
    if (!response.ok) {
      throw new Error(`获取历史失败: ${response.status}`)
    }
    
    return await response.json()
  }

  async clearChatHistory(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/chat/history`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`清空历史失败: ${response.status}`)
    }
    
    return await response.json()
  }

  // 获取连接状态
  getStatus(): object {
    return {
      connected: this.isConnected,
      baseUrl: this.baseUrl,
      timestamp: new Date().toISOString()
    }
  }

  // 销毁客户端
  destroy(): void {
    this.isConnected = false
  }
}
