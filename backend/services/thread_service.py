"""
线程管理服务模块
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from ..models.schemas import ThreadInfo
from .database_service import database_service


class ThreadService:
    """线程管理服务类"""

    def __init__(self):
        """初始化线程服务"""
        # 内存缓存，用于快速访问
        self.thread_cache: Dict[str, Dict[str, Any]] = {}
        self.db = database_service
        print("✅ 线程服务初始化完成")
    
    def create_thread(self, thread_id: str) -> None:
        """
        创建新线程

        Args:
            thread_id: 线程ID
        """
        created_at = datetime.now().isoformat()

        # 保存到数据库
        self.db.save_thread(thread_id, created_at)

        # 更新缓存
        self.thread_cache[thread_id] = {
            "thread_id": thread_id,
            "messages": [],
            "created_at": created_at,
            "updated_at": created_at,
        }

        print(f"🆕 创建新线程: {thread_id}")

    def save_message(self, thread_id: str, msg_id: str, msg_type: str, content: str) -> None:
        """
        保存消息到线程

        Args:
            thread_id: 线程ID
            msg_id: 消息ID
            msg_type: 消息类型（human/ai）
            content: 消息内容
        """
        # 保存到数据库
        self.db.save_message(thread_id, msg_id, msg_type, content)

        # 更新缓存
        if thread_id in self.thread_cache:
            self.thread_cache[thread_id]["messages"].append({
                "id": msg_id,
                "type": msg_type,
                "content": content
            })
            self.thread_cache[thread_id]["updated_at"] = datetime.now().isoformat()

        print(f"💾 保存消息到数据库: {msg_type} - {content[:50]}...")
    
    def get_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """
        获取线程信息

        Args:
            thread_id: 线程ID

        Returns:
            线程信息字典，如果不存在则返回 None
        """
        # 先检查缓存
        if thread_id in self.thread_cache:
            return self.thread_cache[thread_id]

        # 从数据库加载
        thread_data = self.db.load_thread(thread_id)
        if thread_data:
            # 更新缓存
            self.thread_cache[thread_id] = thread_data
            print(f"📥 从数据库加载线程: {thread_id}")

        return thread_data
    
    def get_all_threads(self) -> List[Dict[str, Any]]:
        """
        获取所有线程

        Returns:
            线程信息列表
        """
        # 从数据库加载所有线程
        threads = self.db.load_all_threads()

        # 更新缓存
        for thread in threads:
            self.thread_cache[thread["thread_id"]] = thread

        print(f"📋 搜索线程: 找到 {len(threads)} 个线程")
        return threads
    
    def delete_thread(self, thread_id: str) -> bool:
        """
        删除线程

        Args:
            thread_id: 线程ID

        Returns:
            是否删除成功
        """
        # 从数据库删除
        success = self.db.delete_thread(thread_id)

        # 从缓存删除
        if thread_id in self.thread_cache:
            del self.thread_cache[thread_id]

        if success:
            print(f"🗑️ 删除线程: {thread_id}")

        return success
    
    def thread_exists(self, thread_id: str) -> bool:
        """
        检查线程是否存在

        Args:
            thread_id: 线程ID

        Returns:
            线程是否存在
        """
        # 先检查缓存
        if thread_id in self.thread_cache:
            return True

        # 检查数据库
        return self.db.thread_exists(thread_id)


# 全局线程服务实例
thread_service = ThreadService()

