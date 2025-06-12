@echo off
cd /d "%~dp0"
echo ========================================
echo    TypeScript Frontend Development Server
echo    Gemini-Style AI Chat Assistant
echo ========================================
echo.
echo Current directory: %CD%
echo.

echo Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Checking package.json...
if not exist package.json (
    echo package.json not found!
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
