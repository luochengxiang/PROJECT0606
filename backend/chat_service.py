import asyncio
import json
import sys
import os
from typing import AsyncGenerator, Dict, Any
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.messages import TextMessage
from autogen_core.model_context import BufferedChatCompletionContext
from llms import get_model_client

class ChatService:
    """聊天服务类，基于AutoGen实现"""
    
    def __init__(self):
        self.model_client = None
        self.agent = None
        self.conversation_history = []
        self._initialize_agent()
    
    def _initialize_agent(self):
        """初始化AutoGen代理"""
        try:
            # 获取模型客户端
            self.model_client = get_model_client()
            
            # 创建助手代理
            self.agent = AssistantAgent(
                name="ai_assistant",
                model_client=self.model_client,
                system_message="""你是一个智能AI助手，基于AutoGen和DeepSeek技术。你的特点：

1. 友好、专业、有帮助
2. 能够理解中文和英文
3. 回答准确、详细且有条理
4. 支持Markdown格式输出
5. 能够进行多轮对话，记住上下文

请用Markdown格式回复，让回答更加清晰易读。对于代码，请使用代码块格式。""",
                model_context=BufferedChatCompletionContext(buffer_size=10),  # 保留最近10条消息
                model_client_stream=True,  # 启用流式输出
            )
            
            print("✅ AutoGen代理初始化成功")
            
        except Exception as e:
            print(f"❌ 初始化AutoGen代理失败: {e}")
            raise
    
    async def chat_stream(self, message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """流式聊天响应"""
        try:
            print(f"📝 收到用户消息: {message}")
            
            # 记录用户消息到历史
            self.conversation_history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now()
            })
            
            # 使用AutoGen代理进行流式响应
            full_response = ""
            
            async for response_item in self.agent.run_stream(task=message):
                # 处理不同类型的响应
                if hasattr(response_item, 'content'):
                    if hasattr(response_item, 'type'):
                        # 处理流式响应块
                        if response_item.type == 'ModelClientStreamingChunkEvent':
                            chunk_content = response_item.content
                            full_response += chunk_content
                            
                            yield {
                                "content": chunk_content,
                                "is_complete": False,
                                "timestamp": datetime.now().isoformat()
                            }
                        
                        # 处理完整的文本消息
                        elif response_item.type == 'TextMessage':
                            if response_item.content and response_item.content != full_response:
                                # 如果是完整消息且与流式内容不同，使用完整消息
                                full_response = response_item.content
                    else:
                        # 处理TaskResult或其他类型
                        if hasattr(response_item, 'messages') and response_item.messages:
                            last_message = response_item.messages[-1]
                            if hasattr(last_message, 'content'):
                                full_response = last_message.content
            
            # 记录AI回复到历史
            self.conversation_history.append({
                "role": "assistant", 
                "content": full_response,
                "timestamp": datetime.now()
            })
            
            # 发送完成信号
            yield {
                "content": "",
                "is_complete": True,
                "full_response": full_response,
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"✅ 回复完成，长度: {len(full_response)}")
            
        except Exception as e:
            print(f"❌ 聊天流式响应错误: {e}")
            yield {
                "error": f"处理消息时发生错误: {str(e)}",
                "is_complete": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def chat(self, message: str) -> Dict[str, Any]:
        """非流式聊天响应"""
        try:
            print(f"📝 收到用户消息: {message}")
            
            # 记录用户消息
            self.conversation_history.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now()
            })
            
            # 使用AutoGen代理获取响应
            result = await self.agent.run(task=message)
            
            # 提取回复内容
            response_content = ""
            if result.messages:
                last_message = result.messages[-1]
                if hasattr(last_message, 'content'):
                    response_content = last_message.content
            
            # 记录AI回复
            self.conversation_history.append({
                "role": "assistant",
                "content": response_content,
                "timestamp": datetime.now()
            })
            
            print(f"✅ 回复完成: {response_content[:100]}...")
            
            return {
                "content": response_content,
                "timestamp": datetime.now().isoformat(),
                "model_info": {
                    "model": "deepseek-chat",
                    "provider": "DeepSeek"
                }
            }
            
        except Exception as e:
            print(f"❌ 聊天响应错误: {e}")
            raise
    
    def get_conversation_history(self) -> list:
        """获取对话历史"""
        return self.conversation_history
    
    def clear_history(self):
        """清空对话历史"""
        self.conversation_history.clear()
        print("🗑️ 对话历史已清空")
    
    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            # 测试模型连接
            test_result = await self.agent.run(task="Hello")
            model_status = "healthy" if test_result else "unhealthy"
            
            return {
                "status": "healthy",
                "model_status": model_status,
                "autogen_version": "0.5.7",
                "conversation_count": len(self.conversation_history),
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def close(self):
        """关闭服务，清理资源"""
        try:
            if self.model_client:
                await self.model_client.close()
            print("🔒 聊天服务已关闭")
        except Exception as e:
            print(f"⚠️ 关闭服务时出错: {e}")

# 全局聊天服务实例
chat_service = ChatService()
