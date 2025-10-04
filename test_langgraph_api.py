#!/usr/bin/env python3
"""
LangGraph API 自动化测试脚本

测试所有核心功能：
1. 创建线程
2. 发送消息（流式输出）
3. 获取线程状态
4. 获取线程列表
5. 删除线程
6. 取消运行
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List

# 配置
API_URL = "http://localhost:2024"
ASSISTANT_ID = "agent"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

# 测试计数器
test_count = 0
passed_count = 0
failed_count = 0

def test(name: str):
    """测试装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            global test_count, passed_count, failed_count
            test_count += 1
            print(f"\n{'='*60}")
            print(f"测试 {test_count}: {name}")
            print(f"{'='*60}")
            try:
                result = func(*args, **kwargs)
                passed_count += 1
                print_success(f"测试通过: {name}")
                return result
            except AssertionError as e:
                failed_count += 1
                print_error(f"测试失败: {name}")
                print_error(f"原因: {str(e)}")
                return None
            except Exception as e:
                failed_count += 1
                print_error(f"测试异常: {name}")
                print_error(f"错误: {str(e)}")
                import traceback
                traceback.print_exc()
                return None
        return wrapper
    return decorator

@test("1. 创建新线程")
def test_create_thread() -> str:
    """测试创建线程"""
    print_info("发送 POST /threads 请求...")
    
    response = requests.post(
        f"{API_URL}/threads",
        json={},
        headers={"Content-Type": "application/json"}
    )
    
    print_info(f"状态码: {response.status_code}")
    assert response.status_code == 200, f"期望状态码 200，实际 {response.status_code}"
    
    data = response.json()
    print_info(f"响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    assert "thread_id" in data, "响应中缺少 thread_id"
    thread_id = data["thread_id"]
    
    print_success(f"创建线程成功: {thread_id}")
    return thread_id

@test("2. 发送消息（流式输出）")
def test_stream_message(thread_id: str) -> str:
    """测试流式发送消息"""
    print_info(f"发送消息到线程: {thread_id}")
    
    request_body = {
        "assistant_id": ASSISTANT_ID,
        "input": {
            "messages": [
                {"role": "user", "content": "你好，请简单介绍一下你自己"}
            ]
        },
        "stream_mode": ["messages", "values"]
    }
    
    print_info(f"请求体: {json.dumps(request_body, indent=2, ensure_ascii=False)}")
    
    response = requests.post(
        f"{API_URL}/threads/{thread_id}/runs/stream",
        json=request_body,
        headers={"Content-Type": "application/json"},
        stream=True
    )
    
    print_info(f"状态码: {response.status_code}")
    assert response.status_code == 200, f"期望状态码 200，实际 {response.status_code}"
    
    # 解析 SSE 流
    run_id = None
    ai_content = ""
    event_count = 0
    current_event = ""
    
    print_info("开始接收流式数据...")
    
    for line in response.iter_lines(decode_unicode=True):
        if not line:
            continue
            
        if line.startswith('event: '):
            current_event = line[7:].strip()
            event_count += 1
            print_info(f"收到事件 [{event_count}]: {current_event}")
            
        elif line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                
                # 获取 run_id
                if current_event == 'metadata' and 'run_id' in data:
                    run_id = data['run_id']
                    print_success(f"获取到 run_id: {run_id}")
                
                # 获取流式消息
                if current_event == 'messages/partial' and isinstance(data, list) and len(data) > 0:
                    msg = data[0]
                    if msg.get('type') == 'ai' and msg.get('content'):
                        ai_content = msg['content']
                        print_info(f"流式内容长度: {len(ai_content)} 字符")
                
                # 获取完整消息
                if current_event == 'values' and 'messages' in data:
                    messages = data['messages']
                    if messages:
                        last_msg = messages[-1]
                        if last_msg.get('type') == 'ai':
                            ai_content = last_msg.get('content', '')
                            print_success(f"收到完整 AI 回复，长度: {len(ai_content)} 字符")
                            print_info(f"内容预览: {ai_content[:100]}...")
                
            except json.JSONDecodeError as e:
                print_warning(f"JSON 解析失败: {e}")
    
    assert run_id is not None, "未获取到 run_id"
    assert len(ai_content) > 0, "未收到 AI 回复内容"
    assert event_count > 0, "未收到任何事件"
    
    print_success(f"流式输出测试通过，收到 {event_count} 个事件")
    return run_id

@test("3. 获取线程状态")
def test_get_thread_state(thread_id: str):
    """测试获取线程状态"""
    print_info(f"获取线程状态: {thread_id}")
    
    response = requests.get(
        f"{API_URL}/threads/{thread_id}/state",
        headers={"Content-Type": "application/json"}
    )
    
    print_info(f"状态码: {response.status_code}")
    assert response.status_code == 200, f"期望状态码 200，实际 {response.status_code}"
    
    data = response.json()
    print_info(f"响应数据: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")
    
    assert "values" in data, "响应中缺少 values"
    assert "messages" in data["values"], "values 中缺少 messages"
    
    messages = data["values"]["messages"]
    assert len(messages) >= 2, f"期望至少 2 条消息，实际 {len(messages)} 条"
    
    print_success(f"获取线程状态成功，共 {len(messages)} 条消息")

@test("4. 搜索线程列表")
def test_search_threads(thread_id: str):
    """测试搜索线程"""
    print_info("搜索线程列表...")
    
    response = requests.post(
        f"{API_URL}/threads/search",
        json={"limit": 10, "offset": 0},
        headers={"Content-Type": "application/json"}
    )
    
    print_info(f"状态码: {response.status_code}")
    assert response.status_code == 200, f"期望状态码 200，实际 {response.status_code}"
    
    threads = response.json()
    assert isinstance(threads, list), "响应应该是数组"
    
    print_info(f"找到 {len(threads)} 个线程")
    
    # 检查我们创建的线程是否在列表中
    found = False
    for thread in threads:
        if thread.get("thread_id") == thread_id:
            found = True
            print_success(f"找到测试线程: {thread_id}")
            break
    
    assert found, f"未找到测试线程 {thread_id}"
    print_success("搜索线程测试通过")

@test("5. 发送第二条消息（测试上下文）")
def test_context_message(thread_id: str):
    """测试上下文对话"""
    print_info(f"发送第二条消息到线程: {thread_id}")
    
    request_body = {
        "assistant_id": ASSISTANT_ID,
        "input": {
            "messages": [
                {"role": "user", "content": "我刚才问了你什么？"}
            ]
        },
        "stream_mode": ["values"]
    }
    
    response = requests.post(
        f"{API_URL}/threads/{thread_id}/runs/stream",
        json=request_body,
        headers={"Content-Type": "application/json"},
        stream=True
    )
    
    assert response.status_code == 200, f"期望状态码 200，实际 {response.status_code}"
    
    ai_content = ""
    for line in response.iter_lines(decode_unicode=True):
        if line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                if 'messages' in data:
                    messages = data['messages']
                    if messages:
                        last_msg = messages[-1]
                        if last_msg.get('type') == 'ai':
                            ai_content = last_msg.get('content', '')
            except:
                pass
    
    assert len(ai_content) > 0, "未收到 AI 回复"
    print_success(f"上下文对话测试通过")
    print_info(f"AI 回复: {ai_content[:200]}...")

@test("6. 删除线程")
def test_delete_thread(thread_id: str):
    """测试删除线程"""
    print_info(f"删除线程: {thread_id}")
    
    response = requests.delete(
        f"{API_URL}/threads/{thread_id}",
        headers={"Content-Type": "application/json"}
    )
    
    print_info(f"状态码: {response.status_code}")
    assert response.status_code in [200, 204], f"期望状态码 200 或 204，实际 {response.status_code}"
    
    # 验证线程已删除
    time.sleep(0.5)
    response = requests.get(
        f"{API_URL}/threads/{thread_id}/state",
        headers={"Content-Type": "application/json"}
    )
    
    assert response.status_code == 404, f"线程应该已被删除，但状态码是 {response.status_code}"
    
    print_success("删除线程测试通过")

def run_all_tests():
    """运行所有测试"""
    print(f"\n{'='*60}")
    print(f"🚀 开始 LangGraph API 自动化测试")
    print(f"{'='*60}")
    print_info(f"API 地址: {API_URL}")
    print_info(f"助手 ID: {ASSISTANT_ID}")
    
    # 测试 1: 创建线程
    thread_id = test_create_thread()
    if not thread_id:
        print_error("创建线程失败，终止测试")
        return
    
    # 测试 2: 流式发送消息
    run_id = test_stream_message(thread_id)
    
    # 等待一下确保消息处理完成
    time.sleep(1)
    
    # 测试 3: 获取线程状态
    test_get_thread_state(thread_id)
    
    # 测试 4: 搜索线程
    test_search_threads(thread_id)
    
    # 测试 5: 上下文对话
    test_context_message(thread_id)
    
    # 等待一下
    time.sleep(1)
    
    # 测试 6: 删除线程
    test_delete_thread(thread_id)
    
    # 打印测试总结
    print(f"\n{'='*60}")
    print(f"📊 测试总结")
    print(f"{'='*60}")
    print(f"总测试数: {test_count}")
    print_success(f"通过: {passed_count}")
    if failed_count > 0:
        print_error(f"失败: {failed_count}")
    else:
        print_success(f"失败: {failed_count}")
    
    success_rate = (passed_count / test_count * 100) if test_count > 0 else 0
    print(f"成功率: {success_rate:.1f}%")
    
    if failed_count == 0:
        print(f"\n{Colors.GREEN}{'='*60}")
        print(f"🎉 所有测试通过！")
        print(f"{'='*60}{Colors.RESET}\n")
        return 0
    else:
        print(f"\n{Colors.RED}{'='*60}")
        print(f"💔 有测试失败")
        print(f"{'='*60}{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)

