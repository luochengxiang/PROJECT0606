from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    """聊天消息模型"""
    message: str = Field(..., description="用户输入的消息", max_length=2000)
    
class ChatResponse(BaseModel):
    """聊天响应模型"""
    content: str = Field(..., description="AI回复内容")
    timestamp: datetime = Field(default_factory=datetime.now, description="响应时间")
    model_info: Optional[Dict[str, Any]] = Field(None, description="模型信息")

class StreamChunk(BaseModel):
    """流式响应块模型"""
    content: str = Field(..., description="响应内容片段")
    is_complete: bool = Field(False, description="是否完成")
    
class ErrorResponse(BaseModel):
    """错误响应模型"""
    error: str = Field(..., description="错误信息")
    code: int = Field(..., description="错误代码")
    timestamp: datetime = Field(default_factory=datetime.now, description="错误时间")

class HealthResponse(BaseModel):
    """健康检查响应模型"""
    status: str = Field(..., description="服务状态")
    timestamp: datetime = Field(default_factory=datetime.now, description="检查时间")
    version: str = Field("1.0.0", description="API版本")
    autogen_version: str = Field(..., description="AutoGen版本")
    model_status: str = Field(..., description="模型状态")
