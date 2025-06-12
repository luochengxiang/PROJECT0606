import asyncio
import json
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from models import ChatMessage, ChatResponse, ErrorResponse, HealthResponse
from chat_service import chat_service

# 创建FastAPI应用
app = FastAPI(
    title="AI Chat Assistant API",
    description="基于AutoGen和DeepSeek的智能聊天助手API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件服务（前端）
import os
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
try:
    if os.path.exists(frontend_path):
        app.mount("/static", StaticFiles(directory=frontend_path), name="static")
        print(f"✅ 静态文件已挂载: {frontend_path}")
    else:
        print(f"⚠️ 前端目录不存在: {frontend_path}")
except Exception as e:
    print(f"⚠️ 无法挂载静态文件: {e}")

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print("🚀 AI Chat Assistant API 启动中...")
    print("📡 AutoGen版本: 0.5.7")
    print("🤖 模型: DeepSeek Chat")
    print("✅ 服务启动完成")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    print("🔄 正在关闭服务...")
    await chat_service.close()
    print("✅ 服务已关闭")

@app.get("/", response_model=Dict[str, str])
async def root():
    """根路径"""
    return {
        "message": "AI Chat Assistant API",
        "version": "1.0.0",
        "docs": "/docs",
        "frontend": "/static/index.html"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查接口"""
    try:
        health_info = await chat_service.health_check()
        return HealthResponse(**health_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"健康检查失败: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """非流式聊天接口"""
    try:
        response = await chat_service.chat(message.message)
        return ChatResponse(**response)
    except Exception as e:
        print(f"❌ 聊天接口错误: {e}")
        raise HTTPException(status_code=500, detail=f"聊天处理失败: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(message: ChatMessage):
    """流式聊天接口 - SSE"""

    async def generate_stream():
        """生成SSE流"""
        try:
            # 发送开始信号
            yield f"data: {json.dumps({'type': 'start', 'timestamp': datetime.now().isoformat()})}\n\n"

            # 流式处理聊天
            async for chunk in chat_service.chat_stream(message.message):
                if "error" in chunk:
                    # 发送错误信息
                    yield f"data: {json.dumps({'type': 'error', 'error': chunk['error']})}\n\n"
                    break
                elif chunk.get("is_complete", False):
                    # 发送完成信号
                    yield f"data: {json.dumps({'type': 'complete', 'full_response': chunk.get('full_response', '')})}\n\n"
                    yield "data: [DONE]\n\n"
                    break
                else:
                    # 发送内容块
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk['content']})}\n\n"

                # 小延迟，避免发送过快
                await asyncio.sleep(0.01)

        except Exception as e:
            print(f"❌ 流式响应错误: {e}")
            error_data = {
                "type": "error",
                "error": f"流式处理失败: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

@app.get("/chat/history")
async def get_chat_history():
    """获取聊天历史"""
    try:
        history = chat_service.get_conversation_history()
        return {
            "history": history,
            "count": len(history),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史失败: {str(e)}")

@app.delete("/chat/history")
async def clear_chat_history():
    """清空聊天历史"""
    try:
        chat_service.clear_history()
        return {
            "message": "聊天历史已清空",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清空历史失败: {str(e)}")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    print(f"❌ 全局异常: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error=f"服务器内部错误: {str(exc)}",
            code=500
        ).dict()
    )

if __name__ == "__main__":
    print("🚀 启动AI Chat Assistant服务器...")
    print("📖 API文档: http://localhost:8000/docs")
    print("🌐 前端界面: http://localhost:8000/static/index.html")
    print("💬 聊天API: http://localhost:8000/chat")
    print("📡 流式API: http://localhost:8000/chat/stream")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
