#!/bin/bash

# Git 工作流自动化脚本
# 使用方法: ./git-workflow.sh [命令] [参数]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# 检查是否在 Git 仓库中
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "当前目录不是 Git 仓库"
        exit 1
    fi
}

# 检查是否有未提交的更改
check_uncommitted_changes() {
    if ! git diff-index --quiet HEAD --; then
        print_warning "有未提交的更改"
        git status --short
        return 1
    fi
    return 0
}

# 1. 创建新功能分支
new_feature() {
    print_header "创建新功能分支"
    
    if [ -z "$1" ]; then
        print_error "请提供分支名称"
        echo "用法: ./git-workflow.sh new feature-name"
        exit 1
    fi
    
    BRANCH_NAME="feature/$1"
    
    print_info "切换到 main 分支..."
    git checkout main
    
    print_info "更新 main 分支..."
    git pull my-fork main
    
    print_info "创建新分支: $BRANCH_NAME"
    git checkout -b "$BRANCH_NAME"
    
    print_success "新分支创建完成: $BRANCH_NAME"
    print_info "现在可以开始开发了！"
}

# 2. 提交当前更改
commit_changes() {
    print_header "提交更改"
    
    if [ -z "$1" ]; then
        print_error "请提供提交信息"
        echo "用法: ./git-workflow.sh commit \"提交信息\""
        exit 1
    fi
    
    print_info "查看更改..."
    git status --short
    
    echo ""
    read -p "确认提交这些更改? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "暂存所有更改..."
        git add -A
        
        print_info "提交更改..."
        git commit -m "$1"
        
        print_success "提交完成"
    else
        print_warning "取消提交"
    fi
}

# 3. 推送当前分支
push_branch() {
    print_header "推送分支"
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    print_info "当前分支: $CURRENT_BRANCH"
    
    if ! check_uncommitted_changes; then
        print_error "请先提交或暂存更改"
        exit 1
    fi
    
    print_info "推送到远程..."
    git push my-fork "$CURRENT_BRANCH:$CURRENT_BRANCH"
    
    print_success "推送完成"
}

# 4. 同步 main 分支
sync_main() {
    print_header "同步 main 分支"
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    print_info "切换到 main 分支..."
    git checkout main
    
    print_info "拉取远程更新..."
    git pull my-fork main --rebase
    
    print_success "main 分支已更新"
    
    if [ "$CURRENT_BRANCH" != "main" ]; then
        print_info "切换回原分支: $CURRENT_BRANCH"
        git checkout "$CURRENT_BRANCH"
    fi
}

# 5. 合并到 main
merge_to_main() {
    print_header "合并到 main 分支"
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_error "已经在 main 分支上"
        exit 1
    fi
    
    if ! check_uncommitted_changes; then
        print_error "请先提交或暂存更改"
        exit 1
    fi
    
    print_info "当前分支: $CURRENT_BRANCH"
    echo ""
    read -p "确认合并 $CURRENT_BRANCH 到 main? (y/n) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "取消合并"
        exit 0
    fi
    
    print_info "切换到 main 分支..."
    git checkout main
    
    print_info "更新 main 分支..."
    git pull my-fork main --rebase
    
    print_info "合并 $CURRENT_BRANCH..."
    git merge "$CURRENT_BRANCH" --no-edit --allow-unrelated-histories 2>/dev/null || \
    git merge "$CURRENT_BRANCH" --no-edit
    
    print_info "推送到远程..."
    git push my-fork main:main
    
    print_success "合并完成"
    
    echo ""
    read -p "是否删除功能分支 $CURRENT_BRANCH? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "删除本地分支..."
        git branch -d "$CURRENT_BRANCH"
        
        print_info "删除远程分支..."
        git push my-fork --delete "$CURRENT_BRANCH" 2>/dev/null || print_warning "远程分支不存在或已删除"
        
        print_success "分支已删除"
    fi
}

# 6. 快速提交并推送
quick_push() {
    print_header "快速提交并推送"
    
    if [ -z "$1" ]; then
        print_error "请提供提交信息"
        echo "用法: ./git-workflow.sh quick \"提交信息\""
        exit 1
    fi
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    print_info "暂存所有更改..."
    git add -A
    
    print_info "提交更改..."
    git commit -m "$1"
    
    print_info "推送到远程..."
    git push my-fork "$CURRENT_BRANCH:$CURRENT_BRANCH"
    
    print_success "完成"
}

# 7. 查看状态
status() {
    print_header "Git 状态"
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    print_info "当前分支: $CURRENT_BRANCH"
    echo ""
    
    print_info "本地分支:"
    git branch
    echo ""
    
    print_info "文件状态:"
    git status --short
    echo ""
    
    print_info "最近提交:"
    git log --oneline -5
}

# 8. 更新功能分支（从 main 同步）
update_from_main() {
    print_header "从 main 更新当前分支"
    
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ "$CURRENT_BRANCH" = "main" ]; then
        print_error "已经在 main 分支上"
        exit 1
    fi
    
    if ! check_uncommitted_changes; then
        print_error "请先提交或暂存更改"
        exit 1
    fi
    
    print_info "拉取 main 的最新更改..."
    git pull my-fork main --rebase
    
    print_success "分支已更新"
}

# 显示帮助
show_help() {
    cat << EOF
Git 工作流自动化脚本

用法: ./git-workflow.sh [命令] [参数]

命令:
  new <name>        创建新功能分支 (feature/<name>)
  commit <msg>      提交当前更改
  push              推送当前分支到远程
  sync              同步 main 分支
  merge             合并当前分支到 main
  quick <msg>       快速提交并推送
  update            从 main 更新当前分支
  status            查看 Git 状态
  help              显示此帮助信息

示例:
  ./git-workflow.sh new chinese-ui
  ./git-workflow.sh commit "feat: 添加中文界面"
  ./git-workflow.sh push
  ./git-workflow.sh quick "fix: 修复 bug"
  ./git-workflow.sh merge
  ./git-workflow.sh sync
  ./git-workflow.sh update
  ./git-workflow.sh status

EOF
}

# 主函数
main() {
    check_git_repo
    
    case "$1" in
        new)
            new_feature "$2"
            ;;
        commit)
            commit_changes "$2"
            ;;
        push)
            push_branch
            ;;
        sync)
            sync_main
            ;;
        merge)
            merge_to_main
            ;;
        quick)
            quick_push "$2"
            ;;
        update)
            update_from_main
            ;;
        status)
            status
            ;;
        help|--help|-h|"")
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"

