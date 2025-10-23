"""
SQLite 数据库服务模块
"""
import sqlite3
import json
from contextlib import contextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime
import os


class DatabaseService:
    """SQLite 数据库服务类"""
    
    def __init__(self, db_path: str = "checkpoints.sqlite"):
        """
        初始化数据库服务
        
        Args:
            db_path: 数据库文件路径
        """
        self.db_path = db_path
        self.init_db()
        print(f"✅ 数据库初始化完成: {db_path}")
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接的上下文管理器"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_db(self):
        """初始化数据库表"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 创建线程表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS threads (
                    thread_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # 创建消息表
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
                )
            """)
            
            # 创建索引以提高查询性能
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_thread_id 
                ON messages(thread_id)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_created_at 
                ON messages(created_at)
            """)
    
    def save_thread(self, thread_id: str, created_at: str = None) -> None:
        """
        保存线程到数据库
        
        Args:
            thread_id: 线程ID
            created_at: 创建时间（ISO格式字符串）
        """
        if created_at is None:
            created_at = datetime.now().isoformat()
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 使用 INSERT OR REPLACE 来处理已存在的线程
            cursor.execute("""
                INSERT OR REPLACE INTO threads (thread_id, created_at, updated_at)
                VALUES (?, ?, ?)
            """, (thread_id, created_at, datetime.now().isoformat()))
    
    def save_message(self, thread_id: str, msg_id: str, msg_type: str, content: str) -> None:
        """
        保存消息到数据库
        
        Args:
            thread_id: 线程ID
            msg_id: 消息ID
            msg_type: 消息类型（human/ai）
            content: 消息内容
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO messages (id, thread_id, type, content, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (msg_id, thread_id, msg_type, content, datetime.now().isoformat()))
            
            # 更新线程的 updated_at
            cursor.execute("""
                UPDATE threads SET updated_at = ? WHERE thread_id = ?
            """, (datetime.now().isoformat(), thread_id))
    
    def load_thread(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """
        从数据库加载线程
        
        Args:
            thread_id: 线程ID
            
        Returns:
            线程数据字典，如果不存在则返回 None
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 查询线程信息
            cursor.execute("""
                SELECT * FROM threads WHERE thread_id = ?
            """, (thread_id,))
            
            thread_row = cursor.fetchone()
            if not thread_row:
                return None
            
            # 查询线程的所有消息
            cursor.execute("""
                SELECT * FROM messages 
                WHERE thread_id = ? 
                ORDER BY created_at ASC
            """, (thread_id,))
            
            messages = []
            for row in cursor.fetchall():
                messages.append({
                    "id": row["id"],
                    "type": row["type"],
                    "content": row["content"]
                })
            
            return {
                "thread_id": thread_row["thread_id"],
                "created_at": thread_row["created_at"],
                "updated_at": thread_row["updated_at"],
                "messages": messages
            }
    
    def load_all_threads(self) -> List[Dict[str, Any]]:
        """
        从数据库加载所有线程
        
        Returns:
            线程数据列表
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 查询所有线程
            cursor.execute("""
                SELECT * FROM threads ORDER BY updated_at DESC
            """)
            
            threads = []
            for thread_row in cursor.fetchall():
                thread_id = thread_row["thread_id"]
                
                # 查询该线程的所有消息
                cursor.execute("""
                    SELECT * FROM messages 
                    WHERE thread_id = ? 
                    ORDER BY created_at ASC
                """, (thread_id,))
                
                messages = []
                for msg_row in cursor.fetchall():
                    messages.append({
                        "id": msg_row["id"],
                        "type": msg_row["type"],
                        "content": msg_row["content"]
                    })
                
                threads.append({
                    "thread_id": thread_id,
                    "created_at": thread_row["created_at"],
                    "updated_at": thread_row["updated_at"],
                    "messages": messages
                })
            
            return threads
    
    def delete_thread(self, thread_id: str) -> bool:
        """
        从数据库删除线程
        
        Args:
            thread_id: 线程ID
            
        Returns:
            是否删除成功
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 删除线程（消息会因为外键约束自动删除）
            cursor.execute("""
                DELETE FROM threads WHERE thread_id = ?
            """, (thread_id,))
            
            return cursor.rowcount > 0
    
    def thread_exists(self, thread_id: str) -> bool:
        """
        检查线程是否存在
        
        Args:
            thread_id: 线程ID
            
        Returns:
            线程是否存在
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 1 FROM threads WHERE thread_id = ? LIMIT 1
            """, (thread_id,))
            
            return cursor.fetchone() is not None


# 全局数据库服务实例
from ..config import settings
database_service = DatabaseService(settings.sqlite_db_path)

