"""
改进版 LangGraph 服务模块
使用 LangGraph 的完整功能
"""
import uuid
import json
from typing import AsyncGenerator
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_core.tools import tool

from .llm_service import llm_service
from ..config import settings


# 定义工具
@tool
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@tool
def calculator(expression: str) -> str:
    """计算数学表达式，例如: 2+2, 10*5, 100/4"""
    try:
        result = eval(expression)
        return f"计算结果: {result}"
    except Exception as e:
        return f"计算错误: {e}"


class ImprovedGraphService:
    """改进版 LangGraph 服务类"""
    
    def __init__(self):
        """初始化 Graph 服务"""
        self.tools = [get_current_time, calculator]
        self.checkpointer = SqliteSaver.from_conn_string(settings.database_path)
        self.graph = self._create_graph()
        print("✅ 改进版 Graph 服务初始化完成")
        print(f"   - 工具数量: {len(self.tools)}")
        print(f"   - Checkpointer: SQLite ({settings.database_path})")
    
    def _create_graph(self):
        """创建 LangGraph（使用预构建 ReAct Agent）"""
        llm = llm_service.get_llm()
        
        # 使用预构建的 ReAct Agent
        graph = create_react_agent(
            model=llm,
            tools=self.tools,
            checkpointer=self.checkpointer,
            # 可选：添加系统提示
            # state_modifier="你是一个有帮助的AI助手"
        )
        
        return graph
    
    async def stream_response(
        self,
        input_messages: list,
        thread_id: str
    ) -> AsyncGenerator[str, None]:
        """
        流式处理响应（使用 LangGraph 的原生流式 API）

        Args:
            input_messages: 输入消息列表
            thread_id: 线程ID

        Yields:
            SSE 格式的数据流
        """
        run_id = str(uuid.uuid4())
        print(f"🚀 开始流式处理，线程ID: {thread_id}, Run ID: {run_id}")

        # 发送元数据事件
        yield f"event: metadata\n"
        yield f"data: {json.dumps({'run_id': run_id, 'thread_id': thread_id})}\n\n"
        
        # 配置
        config = {
            "configurable": {
                "thread_id": thread_id,
            }
        }
        
        try:
            # 使用 astream_events 进行流式处理
            ai_response_content = ""
            ai_msg_id = str(uuid.uuid4())
            
            async for event in self.graph.astream_events(
                {"messages": input_messages},
                config=config,
                version="v2"
            ):
                kind = event["event"]
                
                # LLM 输出的每个 token
                if kind == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    if hasattr(chunk, 'content') and chunk.content:
                        content = str(chunk.content)
                        ai_response_content += content
                        
                        # 发送流式消息事件
                        message_data = [{
                            "id": ai_msg_id,
                            "type": "ai",
                            "content": ai_response_content
                        }]
                        yield f"event: messages/partial\n"
                        yield f"data: {json.dumps(message_data)}\n\n"
                
                # 工具调用开始
                elif kind == "on_tool_start":
                    tool_name = event.get("name", "unknown")
                    print(f"🔧 调用工具: {tool_name}")
                    yield f"event: tool_start\n"
                    yield f"data: {json.dumps({'tool': tool_name})}\n\n"
                
                # 工具调用结束
                elif kind == "on_tool_end":
                    tool_name = event.get("name", "unknown")
                    tool_output = event["data"].get("output", "")
                    print(f"✅ 工具完成: {tool_name} -> {tool_output}")
                    yield f"event: tool_end\n"
                    yield f"data: {json.dumps({'tool': tool_name, 'output': str(tool_output)})}\n\n"
            
            print(f"✅ 流式处理完成")
            
            # 发送结束事件
            yield f"event: end\n"
            yield f"data: {json.dumps({})}\n\n"
            
        except Exception as e:
            print(f"❌ 流式处理错误: {e}")
            import traceback
            traceback.print_exc()
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    def get_thread_history(self, thread_id: str) -> list:
        """
        获取线程的对话历史
        
        Args:
            thread_id: 线程ID
            
        Returns:
            消息列表
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            # 从 checkpointer 获取状态
            state = self.graph.get_state(config)
            if state and "messages" in state.values:
                messages = []
                for msg in state.values["messages"]:
                    messages.append({
                        "id": getattr(msg, 'id', str(uuid.uuid4())),
                        "type": msg.type,
                        "content": msg.content
                    })
                return messages
            return []
        except Exception as e:
            print(f"❌ 获取历史失败: {e}")
            return []
    
    def clear_thread(self, thread_id: str):
        """
        清空线程历史
        
        Args:
            thread_id: 线程ID
        """
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            # 更新状态为空
            self.graph.update_state(config, {"messages": []})
            print(f"✅ 清空线程: {thread_id}")
        except Exception as e:
            print(f"❌ 清空线程失败: {e}")


# 全局实例
improved_graph_service = ImprovedGraphService()

