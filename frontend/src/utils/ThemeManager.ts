export type Theme = 'light' | 'dark' | 'auto'

export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: Theme = 'dark'
  private mediaQuery: MediaQueryList

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this))
  }

  static initialize(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
      ThemeManager.instance.loadSavedTheme()
    }
    return ThemeManager.instance
  }

  static getInstance(): ThemeManager {
    return ThemeManager.instance || ThemeManager.initialize()
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      this.setTheme(savedTheme)
    } else {
      this.setTheme('dark') // 默认深色主题
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme
    this.applyTheme()
    this.saveTheme()
  }

  private applyTheme(): void {
    const root = document.documentElement
    
    if (this.currentTheme === 'auto') {
      const systemTheme = this.mediaQuery.matches ? 'dark' : 'light'
      root.setAttribute('data-theme', systemTheme)
    } else {
      root.setAttribute('data-theme', this.currentTheme)
    }

    // 更新meta标签颜色
    this.updateMetaThemeColor()
  }

  private updateMetaThemeColor(): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    const isDark = this.getEffectiveTheme() === 'dark'
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0a0a0a' : '#ffffff')
    }
  }

  private saveTheme(): void {
    localStorage.setItem('theme', this.currentTheme)
  }

  private handleSystemThemeChange(): void {
    if (this.currentTheme === 'auto') {
      this.applyTheme()
    }
  }

  getCurrentTheme(): Theme {
    return this.currentTheme
  }

  getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light'
    }
    return this.currentTheme
  }

  toggleTheme(): void {
    const themes: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex])
  }

  // 获取主题相关的CSS变量
  getThemeVariables(): Record<string, string> {
    const isDark = this.getEffectiveTheme() === 'dark'
    
    return {
      '--primary-color': isDark ? '#4285f4' : '#1a73e8',
      '--background-color': isDark ? '#0a0a0a' : '#ffffff',
      '--surface-color': isDark ? '#1a1a1a' : '#f8f9fa',
      '--text-color': isDark ? '#e8eaed' : '#202124',
      '--text-secondary': isDark ? '#9aa0a6' : '#5f6368',
      '--border-color': isDark ? '#3c4043' : '#dadce0',
      '--shadow-color': isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'
    }
  }

  // 应用自定义CSS变量
  applyCustomVariables(variables: Record<string, string>): void {
    const root = document.documentElement
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }
}
