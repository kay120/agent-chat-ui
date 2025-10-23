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
        thread_id: str,
        stream_mode: list = None
    ) -> AsyncGenerator[str, None]:
        """
        流式处理响应

        Args:
            input_messages: 输入消息列表
            thread_id: 线程ID
            stream_mode: 流式模式列表

        Yields:
            SSE 格式的数据流
        """
        if stream_mode is None:
            stream_mode = ["messages", "values"]

        # 生成 run_id
        run_id = str(uuid.uuid4())
        print(f"🚀 开始流式处理，线程ID: {thread_id}, Run ID: {run_id}")

        # 发送元数据事件
        yield f"event: metadata\n"
        yield f"data: {json.dumps({'run_id': run_id, 'thread_id': thread_id})}\n\n"
        
        # 加载线程历史
        thread = thread_service.get_thread(thread_id)
        if not thread:
            # 线程不存在，创建新线程
            thread_service.create_thread(thread_id)
            thread = thread_service.get_thread(thread_id)

        # 构建完整的对话历史
        messages = []
        for msg in thread["messages"]:
            if msg["type"] == "human":
                messages.append(HumanMessage(content=msg["content"], id=msg.get("id")))
            elif msg["type"] == "ai":
                messages.append(AIMessage(content=msg["content"], id=msg.get("id")))

        # 添加新的用户消息
        user_message = None
        for msg in input_messages:
            if msg.get("role") == "user":
                content = msg["content"]
                if isinstance(content, list):
                    # 处理复杂内容
                    text_parts = [item.get("text", "") for item in content if item.get("type") == "text"]
                    content = " ".join(text_parts)
                user_message = content
                user_msg_id = str(uuid.uuid4())
                messages.append(HumanMessage(content=content, id=user_msg_id))

                # 保存用户消息到数据库
                thread_service.save_message(thread_id, user_msg_id, "human", content)
                break

        print(f"📚 对话历史长度: {len(messages)} 条消息")
        
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
            ai_msg_id = str(uuid.uuid4())

            # 使用 LLM 直接流式生成（不使用 graph）
            llm = llm_service.get_llm()

            print(f"🔄 开始流式生成回复...")
            async for chunk in llm.astream(messages):
                if hasattr(chunk, 'content') and chunk.content:
                    content = str(chunk.content) if chunk.content else ""
                    ai_response_content += content
                    chunk_count += 1

                    # 发送流式消息事件
                    if "messages" in stream_mode:
                        message_data = [{
                            "id": ai_msg_id,
                            "type": "ai",
                            "content": ai_response_content
                        }]
                        yield f"event: messages/partial\n"
                        yield f"data: {json.dumps(message_data)}\n\n"

                    print(f"📝 收到chunk: {content}")

            print(f"✅ AI流式回复完成: {ai_response_content[:100]}...")

            # 保存 AI 回复到数据库
            thread_service.save_message(thread_id, ai_msg_id, "ai", ai_response_content)

            # 发送最终的 values 事件
            if "values" in stream_mode:
                final_messages = thread["messages"] + [
                    {"id": user_msg_id, "type": "human", "content": user_message},
                    {"id": ai_msg_id, "type": "ai", "content": ai_response_content}
                ]
                yield f"event: values\n"
                yield f"data: {json.dumps({'messages': final_messages})}\n\n"

            # 发送结束事件
            yield f"event: end\n"
            yield f"data: {json.dumps({})}\n\n"

        except Exception as e:
            print(f"❌ 流式处理错误: {e}")
            import traceback
            traceback.print_exc()
            yield f"event: error\n"
            yield f"data: {json.dumps({'error': str(e)})}\n\n"


# 全局 Graph 服务实例
graph_service = GraphService()

