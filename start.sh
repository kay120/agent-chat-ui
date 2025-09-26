#!/bin/bash

# 启动脚本 - Agent Chat UI with DeepSeek

# 设置环境
export CONDA_ENV="langgraph"

# 激活conda环境
echo "🔧 激活 conda 环境: $CONDA_ENV"
source ~/anaconda3/etc/profile.d/conda.sh
conda activate $CONDA_ENV

# 检查环境
echo "🔍 检查环境配置..."
echo "Python版本: $(python --version)"
echo "当前目录: $(pwd)"

# 启动后端服务器 (后台运行)
echo "🚀 启动后端服务器 (端口 2024)..."
python langgraph_server.py &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 等待后端启动
echo "⏳ 等待后端启动..."
sleep 5

# 启动前端开发服务器
echo "🌐 启动前端开发服务器 (端口 3000)..."
pnpm dev &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

# 等待用户输入来停止服务
echo "✅ 服务已启动！"
echo "🌐 前端: http://localhost:3000"
echo "🔗 后端: http://localhost:2024"
echo "📝 按 Ctrl+C 或 Enter 键停止所有服务..."
read -r

# 清理后台进程
echo "🧹 清理后台进程..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ 所有服务已停止"