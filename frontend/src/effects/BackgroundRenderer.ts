// 简化版背景渲染器，使用Canvas 2D API
export class BackgroundRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number = 0
  private isRunning = false
  private time = 0
  private gradientOffset = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    this.ctx = ctx

    this.setupCanvas()
    this.setupEventListeners()
  }

  private setupCanvas(): void {
    const updateSize = () => {
      this.canvas.width = window.innerWidth * window.devicePixelRatio
      this.canvas.height = window.innerHeight * window.devicePixelRatio
      this.canvas.style.width = `${window.innerWidth}px`
      this.canvas.style.height = `${window.innerHeight}px`
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
  }

  private setupEventListeners(): void {
    // 鼠标移动事件（可选）
    window.addEventListener('mousemove', (event) => {
      // 可以根据鼠标位置调整渐变效果
    })
  }

  private animate(): void {
    if (!this.isRunning) return

    this.time += 0.016 // 约60FPS
    this.gradientOffset += 0.5

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 创建彩虹渐变
    this.drawRainbowBackground()

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  private drawRainbowBackground(): void {
    const width = this.canvas.width / window.devicePixelRatio
    const height = this.canvas.height / window.devicePixelRatio

    // 创建径向渐变
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.max(width, height) / 2

    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)

    // 动态彩虹色彩
    const colors = [
      `hsl(${(this.gradientOffset + 0) % 360}, 70%, 50%)`,
      `hsl(${(this.gradientOffset + 60) % 360}, 70%, 50%)`,
      `hsl(${(this.gradientOffset + 120) % 360}, 70%, 50%)`,
      `hsl(${(this.gradientOffset + 180) % 360}, 70%, 50%)`,
      `hsl(${(this.gradientOffset + 240) % 360}, 70%, 50%)`,
      `hsl(${(this.gradientOffset + 300) % 360}, 70%, 50%)`
    ]

    gradient.addColorStop(0, colors[0] + '20') // 20% 透明度
    gradient.addColorStop(0.2, colors[1] + '15')
    gradient.addColorStop(0.4, colors[2] + '10')
    gradient.addColorStop(0.6, colors[3] + '15')
    gradient.addColorStop(0.8, colors[4] + '20')
    gradient.addColorStop(1, colors[5] + '25')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, width, height)

    // 添加一些动态圆形
    this.drawFloatingCircles()
  }

  private drawFloatingCircles(): void {
    const width = this.canvas.width / window.devicePixelRatio
    const height = this.canvas.height / window.devicePixelRatio

    for (let i = 0; i < 5; i++) {
      const x = (Math.sin(this.time * 0.5 + i) * 0.3 + 0.5) * width
      const y = (Math.cos(this.time * 0.3 + i * 1.5) * 0.3 + 0.5) * height
      const radius = 50 + Math.sin(this.time + i) * 20

      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `hsl(${(this.gradientOffset + i * 60) % 360}, 80%, 60%, 0.3)`)
      gradient.addColorStop(1, `hsl(${(this.gradientOffset + i * 60) % 360}, 80%, 60%, 0)`)

      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(x, y, radius, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.animate()
    console.log('🌈 彩虹背景渲染器已启动')
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    console.log('⏹️ 彩虹背景渲染器已停止')
  }

  destroy(): void {
    this.stop()
    // 清理画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  // 设置颜色主题
  setColorTheme(colors: string[]): void {
    console.log('设置彩虹背景颜色主题:', colors)
  }

  // 获取渲染信息
  getRenderInfo(): object {
    return {
      isRunning: this.isRunning,
      time: this.time,
      gradientOffset: this.gradientOffset
    }
  }
}
