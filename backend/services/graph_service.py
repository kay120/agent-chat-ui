"""
LangGraph 服务模块
"""
import uuid
import json
from typing import AsyncGenerator, Dict, Any
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from ..models.state import State
from .llm_service import llm_service
from .thread_service import thread_service


class GraphService:
    """LangGraph 服务类"""
    
    def __init__(self):
        """初始化 Graph 服务"""
        self.graph = self._create_graph()
        print("✅ Graph 服务初始化完成")
    
    def _create_graph(self):
        """创建 LangGraph"""
        # 创建图
        workflow = StateGraph(State)
        
        # 添加聊天节点
        workflow.add_node("chatbot", self._chatbot_node)
        
        # 设置入口和出口
        workflow.add_edge(START, "chatbot")
        workflow.add_edge("chatbot", END)
        
        # 编译图（使用内存检查点）
        memory = MemorySaver()
        graph = workflow.compile(checkpointer=memory)
        
        return graph
    
    def _chatbot_node(self, state: State, config: RunnableConfig) -> Dict[str, Any]:
        """
        聊天机器人节点
        
        Args:
            state: 当前状态
            config: 运行配置
            
        Returns:
            更新后的状态
        """
        messages = state["messages"]
        print(f"🤖 Chatbot node called with {len(messages)} messages")
        
        # 调用 LLM
        llm = llm_service.get_llm()
        response = llm.invoke(messages)
        
        return {"messages": [response]}
    
    async def stream_response(
        self,
        input_messages: list,
        thread_id: str | None = None
    ) -> AsyncGenerator[str, None]:
        """
        流式处理响应
        
        Args:
            input_messages: 输入消息列表
            thread_id: 线程ID（可选）
            
        Yields:
            SSE 格式的数据流
        """
        # 如果没有提供 thread_id，生成一个新的
        if not thread_id:
            thread_id = str(uuid.uuid4())
            print(f"🆕 生成新线程ID: {thread_id}")
        
        # 生成 run_id
        run_id = str(uuid.uuid4())
        print(f"🚀 开始流式处理，线程ID: {thread_id}, Run ID: {run_id}")
        
        # 发送响应头信息
        yield f"X-Thread-ID: {thread_id}\n"
        yield f"X-Run-ID: {run_id}\n\n"
        
        # 转换消息格式
        messages = []
        for msg in input_messages:
            if msg["type"] == "human":
                content = msg["content"]
                if isinstance(content, list):
                    # 处理复杂内容
                    text_parts = [item.get("text", "") for item in content if item.get("type") == "text"]
                    content = " ".join(text_parts)
                messages.append(HumanMessage(content=content, id=msg.get("id")))
            elif msg["type"] == "ai":
                messages.append(AIMessage(content=msg["content"], id=msg.get("id")))
        
        # 保存用户消息到历史记录
        thread_service.save_thread(thread_id, [
            {
                "id": msg.id,
                "type": msg.type,
                "content": msg.content,
                "timestamp": str(msg.id) if hasattr(msg, 'id') else None
            }
            for msg in messages
        ])
        
        # 配置
        config = {
            "configurable": {
                "thread_id": thread_id,
                "run_id": run_id,
            }
        }
        
        # 流式处理
        try:
            chunk_count = 0
            ai_response_content = ""
            
            async for event in self.graph.astream_events(
                {"messages": messages},
                config,
                version="v2"
            ):
                kind = event.get("event")
                
                # 处理流式输出
                if kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        chunk_count += 1
                        ai_response_content += chunk.content

                        # 构建当前消息列表（包含AI回复）
                        current_messages = messages + [AIMessage(content=ai_response_content)]

                        # 转换为可序列化的格式
                        serializable_messages = [
                            {
                                "id": msg.id if hasattr(msg, 'id') else None,
                                "type": msg.type,
                                "content": msg.content,
                            }
                            for msg in current_messages
                        ]

                        # 发送 SSE 数据
                        data = {
                            "event": "values",
                            "data": {
                                "messages": serializable_messages
                            }
                        }
                        yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

                        print(f"📦 收到chunk #{chunk_count}: {chunk.content[:50]}...")
            
            print(f"✅ 流式处理完成，共 {chunk_count} 个chunks")
            
            # 保存完整对话到历史记录
            final_messages = messages + [AIMessage(content=ai_response_content)]
            thread_service.save_thread(thread_id, [
                {
                    "id": msg.id if hasattr(msg, 'id') else None,
                    "type": msg.type,
                    "content": msg.content,
                    "timestamp": str(msg.id) if hasattr(msg, 'id') else None
                }
                for msg in final_messages
            ])
            
        except Exception as e:
            print(f"❌ 流式处理错误: {e}")
            error_data = {
                "event": "error",
                "data": {"error": str(e)}
            }
            yield f"data: {json.dumps(error_data)}\n\n"


# 全局 Graph 服务实例
graph_service = GraphService()

