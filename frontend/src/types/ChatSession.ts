import { Message } from './Message'

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  metadata?: {
    model?: string
    totalTokens?: number
    totalMessages?: number
    [key: string]: any
  }
}

export interface ChatHistory {
  sessions: ChatSession[]
  currentSessionId?: string
  totalSessions: number
  lastActivity: Date
}
