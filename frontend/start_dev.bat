@echo off
cd /d "%~dp0"
echo ========================================
echo    启动 TypeScript 前端开发服务器
echo    Gemini风格 AI Chat Assistant
echo ========================================
echo.
echo 当前目录: %CD%
echo.

echo 📦 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装或未添加到PATH
    echo 请安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo 📦 检查package.json...
if not exist package.json (
    echo ❌ package.json文件不存在
    pause
    exit /b 1
)

echo.
echo 📦 安装依赖包...
npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 🚀 启动开发服务器...
echo 🌐 前端地址: http://localhost:3000
echo 📖 后端API: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
