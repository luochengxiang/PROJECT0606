# 🚀 Gemini-Style AI Chat Assistant

基于 **TypeScript** + **AutoGen 0.5.7** + **DeepSeek** + **FastAPI** 的下一代智能聊天助手

## ✨ 特性亮点

### 🎨 前端特性 (TypeScript重构版)
- **🌟 Gemini风格界面**: 完全参考Google Gemini的现代化设计
- **✨ 3D背景渲染**: 基于Three.js的动态3D背景效果
- **🎆 高级粒子系统**: 交互式粒子特效，支持鼠标交互
- **🌈 彩虹渐变动画**: 流动的彩虹背景效果
- **💬 智能气泡对话**: 类似iMessage的优雅消息气泡
- **📡 实时流式显示**: SSE协议实现的打字机效果
- **🎯 TypeScript架构**: 完整的类型安全和模块化设计
- **📱 响应式设计**: 完美适配桌面、平板、手机

### 🤖 后端特性
- **AutoGen集成**: 使用最新AutoGen 0.5.7框架
- **DeepSeek模型**: 集成DeepSeek Chat模型
- **流式输出**: SSE协议实现实时流式响应
- **Markdown支持**: 完整支持Markdown格式回复
- **对话记忆**: 智能上下文记忆功能
- **健康监控**: 完整的服务健康检查

## 🏗️ 项目架构

```
PythonProject0606/
├── frontend/                    # TypeScript前端
│   ├── src/                     # 源代码
│   │   ├── app/                 # 应用核心
│   │   │   ├── App.ts           # 主应用类
│   │   │   ├── ChatManager.ts   # 聊天管理器
│   │   │   └── UIManager.ts     # UI管理器
│   │   ├── components/          # 组件
│   │   │   ├── MessageRenderer.ts    # 消息渲染器
│   │   │   ├── InputHandler.ts       # 输入处理器
│   │   │   └── NotificationManager.ts # 通知管理器
│   │   ├── effects/             # 特效系统
│   │   │   ├── ParticleSystem.ts     # 粒子系统
│   │   │   └── BackgroundRenderer.ts # 3D背景渲染
│   │   ├── api/                 # API客户端
│   │   │   └── ApiClient.ts     # HTTP/SSE客户端
│   │   ├── types/               # 类型定义
│   │   │   ├── Message.ts       # 消息类型
│   │   │   └── ChatSession.ts   # 会话类型
│   │   ├── utils/               # 工具类
│   │   │   ├── EventBus.ts      # 事件总线
│   │   │   └── ThemeManager.ts  # 主题管理
│   │   ├── styles/              # 样式文件
│   │   │   └── main.css         # 主样式
│   │   └── main.ts              # 入口文件
│   ├── index.html               # HTML模板
│   ├── package.json             # 依赖配置
│   ├── tsconfig.json            # TypeScript配置
│   ├── vite.config.ts           # Vite配置
│   └── start_dev.bat            # 开发服务器启动脚本
├── backend/                     # Python后端
│   ├── main.py                  # FastAPI主应用
│   ├── chat_service.py          # AutoGen聊天服务
│   ├── models.py                # 数据模型
│   └── requirements.txt         # Python依赖
├── llms.py                      # 模型客户端配置
├── start_server.bat             # 后端启动脚本
└── README.md                    # 项目说明
```

## 🚀 快速开始

### 🎯 推荐方式：TypeScript前端 + Python后端

#### 1. 启动后端服务
```bash
# Windows
start_server.bat

# Linux/Mac
chmod +x start_server.sh && ./start_server.sh

# 或手动启动
cd backend
pip install -r requirements.txt
python main.py
```

#### 2. 启动前端开发服务器
```bash
cd frontend

# Windows
start_dev.bat

# Linux/Mac/Windows (需要Node.js)
npm install
npm run dev
```

#### 3. 访问应用
- 🎨 **TypeScript前端**: http://localhost:3000 (推荐)
- 📖 **API文档**: http://localhost:8000/docs
- 💬 **聊天API**: http://localhost:8000/chat
- 📡 **流式API**: http://localhost:8000/chat/stream

### 🔧 环境要求
- **Node.js**: 18+ (前端开发)
- **Python**: 3.8+ (后端服务)
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+

## 🔧 配置说明

### DeepSeek API配置
在 `llms.py` 文件中配置您的DeepSeek API密钥：

```python
return OpenAIChatCompletionClient(
    model="deepseek-chat",
    base_url="https://api.deepseek.com/v1",
    api_key="your-api-key-here",  # 替换为您的API密钥
    # ...
)
```

### AutoGen配置
系统使用AutoGen 0.5.7的最新特性：
- `AssistantAgent`: 智能助手代理
- `BufferedChatCompletionContext`: 上下文缓冲管理
- 流式响应支持

## 📡 API接口

### 聊天接口
```http
POST /chat
Content-Type: application/json

{
  "message": "你好，请介绍一下AutoGen"
}
```

### 流式聊天接口
```http
POST /chat/stream
Content-Type: application/json

{
  "message": "请详细解释机器学习的概念"
}
```

### 健康检查
```http
GET /health
```

### 聊天历史
```http
GET /chat/history     # 获取历史
DELETE /chat/history  # 清空历史
```

## 🎨 界面预览

### 主要特色
- **科技感背景**: 动态粒子 + 彩虹渐变
- **现代化设计**: 类Gemini风格界面
- **流畅动画**: 消息滑入、按钮悬停效果
- **智能交互**: 自动调整输入框高度
- **状态指示**: 在线状态、加载动画、错误提示

### 响应式设计
- 桌面端：最佳体验
- 平板端：自适应布局
- 手机端：优化触控交互

## 🔍 技术栈

### 🎨 前端技术栈
- **TypeScript**: 类型安全的JavaScript超集
- **Vite**: 现代化构建工具，极速热重载
- **Three.js**: 3D图形渲染库，创建动态背景
- **GSAP**: 高性能动画库
- **CSS3**: 现代样式、动画、渐变、毛玻璃效果
- **Web APIs**: SSE、Clipboard、Intersection Observer
- **模块化架构**: 事件驱动、组件化设计

### 🚀 后端技术栈
- **FastAPI**: 现代Python异步Web框架
- **AutoGen 0.5.7**: 微软多代理对话框架
- **DeepSeek**: 高性能大语言模型
- **SSE**: 服务器发送事件，实现流式响应
- **Uvicorn**: 高性能ASGI服务器
- **Pydantic**: 数据验证和序列化

### 🎯 设计特色
- **Gemini风格**: 完全参考Google Gemini的UI/UX设计
- **毛玻璃效果**: 现代化的半透明界面元素
- **流体动画**: 丝滑的过渡动画和微交互
- **响应式布局**: 适配所有设备尺寸
- **无障碍设计**: 支持键盘导航和屏幕阅读器

## 🐛 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 升级pip
   pip install --upgrade pip
   # 使用国内镜像
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
   ```

2. **AutoGen版本问题**
   ```bash
   # 确保安装正确版本
   pip install autogen-agentchat==0.5.7 autogen-ext[models]==0.5.7
   ```

3. **API密钥错误**
   - 检查 `llms.py` 中的API密钥是否正确
   - 确认DeepSeek账户余额充足

4. **端口占用**
   ```bash
   # 查看端口占用
   netstat -ano | findstr :8000
   # 或修改main.py中的端口号
   ```

## 📝 开发说明

### 自定义配置
- 修改 `backend/chat_service.py` 中的系统提示词
- 调整 `frontend/particles-config.js` 中的粒子效果
- 在 `frontend/style.css` 中自定义界面样式

### 扩展功能
- 添加用户认证
- 集成更多AI模型
- 实现对话导出
- 添加语音交互

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 🎯 开发说明

### TypeScript版本特色
- **完整类型安全**: 所有组件都有完整的TypeScript类型定义
- **模块化架构**: 清晰的分层架构，易于维护和扩展
- **事件驱动**: 使用EventBus实现组件间解耦通信
- **性能优化**: 虚拟滚动、懒加载、防抖等优化技术
- **开发体验**: 热重载、类型检查、代码提示

### 自定义配置
- **主题系统**: 支持亮色/暗色/自动主题切换
- **特效配置**: 可调整粒子数量、颜色、动画速度
- **API配置**: 支持不同的后端服务地址
- **快捷键**: 自定义键盘快捷键

### 扩展功能建议
- **多语言支持**: 国际化(i18n)
- **语音交互**: 语音输入和语音播放
- **文件上传**: 支持图片、文档上传
- **对话导出**: 导出为PDF、Markdown等格式
- **插件系统**: 支持第三方插件扩展

## 🚀 部署指南

### 生产环境部署
```bash
# 构建前端
cd frontend
npm run build

# 部署到服务器
# 将dist目录部署到Web服务器
# 配置反向代理到后端API
```

### Docker部署
```dockerfile
# 可以创建Docker镜像进行容器化部署
# 前端使用Nginx服务静态文件
# 后端使用Python镜像运行FastAPI
```

---

**🎉 享受下一代AI聊天体验！**

> 💡 **提示**: 这个项目展示了现代Web技术栈的最佳实践，包括TypeScript、模块化架构、响应式设计、性能优化等。非常适合向领导展示技术实力和创新能力！
