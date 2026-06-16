#!/bin/bash
# 新媒体经营中台 - 一键启动脚本

echo "========================================"
echo "  新媒体经营中台（数字化驾驶舱）"
echo "  New Media Management Platform"
echo "========================================"
echo ""

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
echo "🚀 启动后端服务..."
cd "$PROJECT_DIR/server"
npx tsx src/app.ts &
BACKEND_PID=$!
sleep 2

# Start frontend
echo "🚀 启动前端服务..."
cd "$PROJECT_DIR/client"
npx vite --host &
FRONTEND_PID=$!
sleep 3

echo ""
echo "========================================"
echo "  ✅ 服务已启动"
echo "========================================"
echo ""
echo "  📡 后端 API:  http://localhost:3000"
echo "  🌐 前端页面:  http://localhost:5173"
echo ""
echo "  🔑 测试账号（密码均为 123456）："
echo "     admin    - 系统管理员（全部权限）"
echo "     brand    - 品牌负责人"
echo "     editor   - 内容运营"
echo "     analyst  - 数据分析师"
echo "     channel  - 渠道经理"
echo "     growth   - 增长专员"
echo "     risk     - 风控管理员"
echo ""
echo "  📋 七大主页面："
echo "     /home      - 首页总览"
echo "     /strategy  - 策略中心"
echo "     /content   - 内容中心"
echo "     /channel   - 渠道中心"
echo "     /growth    - 增长转化中心"
echo "     /review    - 复盘中心"
echo "     /risk      - 风控与协作中心"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "========================================"

# Wait for background processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
