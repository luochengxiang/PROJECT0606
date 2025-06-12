interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
  life: number
  maxLife: number
}

export class ParticleSystem {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private animationId: number = 0
  private isRunning = false

  private readonly maxParticles = 100
  private readonly colors = [
    '#4285f4', '#ea4335', '#fbbc04', '#34a853',
    '#ff6d01', '#9c27b0', '#00bcd4', '#8bc34a'
  ]

  constructor(container: HTMLElement) {
    this.container = container
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '1'
    
    this.container.appendChild(this.canvas)
    
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }
    this.ctx = ctx

    this.setupCanvas()
    this.setupEventListeners()
  }

  private setupCanvas(): void {
    const updateSize = () => {
      const rect = this.container.getBoundingClientRect()
      this.canvas.width = rect.width * window.devicePixelRatio
      this.canvas.height = rect.height * window.devicePixelRatio
      this.canvas.style.width = `${rect.width}px`
      this.canvas.style.height = `${rect.height}px`
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
  }

  private setupEventListeners(): void {
    // 鼠标移动时创建粒子
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (Math.random() < 0.3) { // 30%概率创建粒子
        this.createParticle(x, y)
      }
    })

    // 点击时创建爆发效果
    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      this.createBurst(x, y)
    })
  }

  private createParticle(x: number, y: number, burst = false): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift() // 移除最老的粒子
    }

    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * (burst ? 8 : 2),
      vy: (Math.random() - 0.5) * (burst ? 8 : 2),
      size: Math.random() * (burst ? 6 : 3) + 1,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      opacity: 1,
      life: 0,
      maxLife: Math.random() * 60 + 30 // 30-90帧生命周期
    }

    this.particles.push(particle)
  }

  private createBurst(x: number, y: number): void {
    const burstCount = 15 + Math.random() * 10
    for (let i = 0; i < burstCount; i++) {
      this.createParticle(x, y, true)
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      // 更新位置
      particle.x += particle.vx
      particle.y += particle.vy
      
      // 应用重力和阻力
      particle.vy += 0.1 // 重力
      particle.vx *= 0.99 // 阻力
      particle.vy *= 0.99
      
      // 更新生命周期
      particle.life++
      particle.opacity = 1 - (particle.life / particle.maxLife)
      
      // 移除死亡的粒子
      if (particle.life >= particle.maxLife || particle.opacity <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  private renderParticles(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    for (const particle of this.particles) {
      this.ctx.save()
      
      // 设置粒子样式
      this.ctx.globalAlpha = particle.opacity
      this.ctx.fillStyle = particle.color
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = particle.color
      
      // 绘制粒子
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.ctx.fill()
      
      this.ctx.restore()
    }
  }

  private animate(): void {
    if (!this.isRunning) return

    this.updateParticles()
    this.renderParticles()
    
    // 随机创建环境粒子
    if (Math.random() < 0.02) {
      const x = Math.random() * this.canvas.width / window.devicePixelRatio
      const y = Math.random() * this.canvas.height / window.devicePixelRatio
      this.createParticle(x, y)
    }

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.animate()
    console.log('✨ 粒子系统已启动')
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    console.log('⏹️ 粒子系统已停止')
  }

  destroy(): void {
    this.stop()
    this.particles = []
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }

  // 设置粒子颜色主题
  setColorTheme(colors: string[]): void {
    this.colors.splice(0, this.colors.length, ...colors)
  }

  // 获取粒子数量
  getParticleCount(): number {
    return this.particles.length
  }
}
