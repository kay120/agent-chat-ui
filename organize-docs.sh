#!/bin/bash

# 文档整理脚本
# 将文档移动到 docs/ 目录并按类别组织

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}开始整理项目文档${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 创建目录结构
echo -e "${BLUE}📁 创建目录结构...${NC}"
mkdir -p docs/git-workflow
mkdir -p docs/architecture
mkdir -p docs/langgraph
mkdir -p docs/fixes
mkdir -p docs/summaries

# 移动 Git 工作流相关文档
echo -e "${BLUE}📝 整理 Git 工作流文档...${NC}"
if [ -f "GIT_WORKFLOW_GUIDE.md" ]; then
    mv GIT_WORKFLOW_GUIDE.md docs/git-workflow/GUIDE.md
    echo -e "${GREEN}✅ GIT_WORKFLOW_GUIDE.md → docs/git-workflow/GUIDE.md${NC}"
fi

if [ -f "GIT_QUICK_REFERENCE.md" ]; then
    mv GIT_QUICK_REFERENCE.md docs/git-workflow/QUICK_REFERENCE.md
    echo -e "${GREEN}✅ GIT_QUICK_REFERENCE.md → docs/git-workflow/QUICK_REFERENCE.md${NC}"
fi

# 创建 Git 工作流 README
cat > docs/git-workflow/README.md << 'EOF'
# Git 工作流自动化

## 快速开始

```bash
# 查看帮助
./git-workflow.sh help

# 创建新分支
./git-workflow.sh new feature-name

# 快速提交推送
./git-workflow.sh quick "feat: 提交信息"

# 合并到 main
./git-workflow.sh merge
```

## 文档

- [完整指南](GUIDE.md) - 详细使用说明
- [快速参考](QUICK_REFERENCE.md) - 常用命令速查

## 脚本位置

脚本位于项目根目录: `git-workflow.sh`
EOF
echo -e "${GREEN}✅ 创建 docs/git-workflow/README.md${NC}"

# 移动架构文档
echo -e "${BLUE}📝 整理架构文档...${NC}"
if [ -f "ARCHITECTURE.md" ]; then
    mv ARCHITECTURE.md docs/architecture/
    echo -e "${GREEN}✅ ARCHITECTURE.md → docs/architecture/${NC}"
fi

if [ -f "FRONTEND_ADAPTATION.md" ]; then
    mv FRONTEND_ADAPTATION.md docs/architecture/
    echo -e "${GREEN}✅ FRONTEND_ADAPTATION.md → docs/architecture/${NC}"
fi

if [ -f "BACKEND_REFACTORING.md" ]; then
    mv BACKEND_REFACTORING.md docs/architecture/
    echo -e "${GREEN}✅ BACKEND_REFACTORING.md → docs/architecture/${NC}"
fi

if [ -f "REFACTORING.md" ]; then
    mv REFACTORING.md docs/architecture/
    echo -e "${GREEN}✅ REFACTORING.md → docs/architecture/${NC}"
fi

# 移动 LangGraph 文档
echo -e "${BLUE}📝 整理 LangGraph 文档...${NC}"
if [ -f "LANGGRAPH_API_FEATURES.md" ]; then
    mv LANGGRAPH_API_FEATURES.md docs/langgraph/
    echo -e "${GREEN}✅ LANGGRAPH_API_FEATURES.md → docs/langgraph/${NC}"
fi

if [ -f "LANGGRAPH_API_MIGRATION.md" ]; then
    mv LANGGRAPH_API_MIGRATION.md docs/langgraph/
    echo -e "${GREEN}✅ LANGGRAPH_API_MIGRATION.md → docs/langgraph/${NC}"
fi

if [ -f "LANGGRAPH_API_QUICK_REFERENCE.md" ]; then
    mv LANGGRAPH_API_QUICK_REFERENCE.md docs/langgraph/
    echo -e "${GREEN}✅ LANGGRAPH_API_QUICK_REFERENCE.md → docs/langgraph/${NC}"
fi

# 移动问题修复文档
echo -e "${BLUE}📝 整理问题修复文档...${NC}"
if [ -f "BUG_FIX_SUMMARY.md" ]; then
    mv BUG_FIX_SUMMARY.md docs/fixes/
    echo -e "${GREEN}✅ BUG_FIX_SUMMARY.md → docs/fixes/${NC}"
fi

# 移动总结报告
echo -e "${BLUE}📝 整理总结报告...${NC}"
if [ -f "MODULARIZATION_SUMMARY.md" ]; then
    mv MODULARIZATION_SUMMARY.md docs/summaries/
    echo -e "${GREEN}✅ MODULARIZATION_SUMMARY.md → docs/summaries/${NC}"
fi

if [ -f "TESTING_REPORT.md" ]; then
    mv TESTING_REPORT.md docs/summaries/
    echo -e "${GREEN}✅ TESTING_REPORT.md → docs/summaries/${NC}"
fi

# 删除临时文档
echo -e "${BLUE}🗑️  删除临时文档...${NC}"
if [ -f "FINAL_PUSH_SOLUTION.md" ]; then
    rm FINAL_PUSH_SOLUTION.md
    echo -e "${GREEN}✅ 删除 FINAL_PUSH_SOLUTION.md${NC}"
fi

# 显示最终结构
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 整理完成！文档结构：${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

tree docs/ -L 2 2>/dev/null || find docs/ -type f | sort

echo ""
echo -e "${GREEN}✅ 文档整理完成！${NC}"
echo -e "${YELLOW}📖 查看文档索引: docs/README.md${NC}"

