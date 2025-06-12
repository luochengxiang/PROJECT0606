import asyncio
import os
from autogen_ext.models.openai import OpenAIChatCompletionClient


def get_model_client():
    """获取模型客户端，支持多种API配置"""


    return OpenAIChatCompletionClient(
        model="deepseek-chat",
        base_url="https://api.deepseek.com/v1",
        api_key="sk-5baad5008cbf4701a0bf8b2d05189c43",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "unknown",
            "structured_output": True,
            "multiple_system_messages": True,
        }
    )


model_client = get_model_client()
# from autogen_core.models import UserMessage, SystemMessage
#
# async def main():
#     result = await get_model_client().create([UserMessage(content="写一首4言绝句古诗", source="user"),
#                                                SystemMessage(content="你擅长解决用户问题")])
#     print(result)
#     await get_model_client().close()
#
# asyncio.run(main())