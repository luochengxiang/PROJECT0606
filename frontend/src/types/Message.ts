export enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: Date
  sessionId: string
  isStreaming?: boolean
  isError?: boolean
  metadata?: {
    model?: string
    tokens?: number
    duration?: number
    [key: string]: any
  }
}

export interface StreamChunk {
  type: 'content' | 'complete' | 'error' | 'start'
  content?: string
  error?: string
  messageId?: string
  timestamp?: string
}

export interface MessageAction {
  id: string
  label: string
  icon: string
  handler: (message: Message) => void
}
