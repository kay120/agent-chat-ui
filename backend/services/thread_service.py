"""
线程管理服务模块
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..models.schemas import ThreadInfo


class ThreadService:
    """线程管理服务类"""
    
    def __init__(self):
        """初始化线程服务"""
        self.thread_history: Dict[str, Dict[str, Any]] = {}
        print("✅ 线程服务初始化完成")
    
    def save_thread(self, thread_id: str, messages: List[Any]) -> None:
        """
        保存线程到历史记录
        
        Args:
            thread_id: 线程ID
            messages: 消息列表
        """
        now = datetime.now()
        
        if thread_id not in self.thread_history:
            self.thread_history[thread_id] = {
                "thread_id": thread_id,
                "values": {"messages": []},
                "created_at": now,
                "updated_at": now,
            }
        
        # 更新消息和时间戳
        self.thread_history[thread_id]["values"]["messages"] = messages
        self.thread_history[thread_id]["updated_at"] = now
        
        print(f"💾 保存线程: {thread_id}, 消息数: {len(messages)}")
    
    def get_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """
        获取线程信息
        
        Args:
            thread_id: 线程ID
            
        Returns:
            线程信息字典，如果不存在则返回 None
        """
        return self.thread_history.get(thread_id)
    
    def get_all_threads(self) -> List[ThreadInfo]:
        """
        获取所有线程
        
        Returns:
            线程信息列表
        """
        threads = []
        for thread_data in self.thread_history.values():
            threads.append(ThreadInfo(**thread_data))
        
        # 按更新时间倒序排序
        threads.sort(key=lambda x: x.updated_at or datetime.min, reverse=True)
        return threads
    
    def delete_thread(self, thread_id: str) -> bool:
        """
        删除线程
        
        Args:
            thread_id: 线程ID
            
        Returns:
            是否删除成功
        """
        if thread_id in self.thread_history:
            del self.thread_history[thread_id]
            print(f"🗑️ 删除线程: {thread_id}")
            return True
        return False
    
    def thread_exists(self, thread_id: str) -> bool:
        """
        检查线程是否存在
        
        Args:
            thread_id: 线程ID
            
        Returns:
            线程是否存在
        """
        return thread_id in self.thread_history


# 全局线程服务实例
thread_service = ThreadService()

