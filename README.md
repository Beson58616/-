<div align="center">

# 🚀 新媒体经营中台（数字化驾驶舱）

**企业级新媒体管理与决策数字化工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178c6.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-000000.svg)](https://expressjs.com/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5.21+-0170FE.svg)](https://ant.design/)
[![ECharts](https://img.shields.io/badge/ECharts-5.5+-AA344D.svg)](https://echarts.apache.org/)

</div>

## 📋 项目简介

新媒体经营中台（数字化驾驶舱）是一款面向企业的全链路新媒体运营管理平台，覆盖**品牌定位、内容生产、渠道投放、数据洞察、转化追踪、风险控制**六大核心场景，通过 **内容中台、数据中台、协同中台、策略中台** 四大核心模块，形成从目标到复盘的完整闭环。

### ✨ 核心价值

- 🎯 **策略驱动**：品牌目标可视化，OKR 关联，栏目规划系统化
- 📝 **内容提效**：选题-脚本-素材-排期全流程数字化管理
- 📊 **数据洞察**：多平台数据整合，ECharts 可视化看板，转化漏斗分析
- 👥 **团队协同**：任务流、审批流一体化，实时通知，高效协作
- 📈 **增长转化**：ROI 评估，多渠道转化追踪
- 🔒 **安全可控**：JWT + RBAC 细粒度权限，操作审计日志
- 🤖 **AI 就绪**：选题生成、标题优化、脚本初稿等 AI 接口已预留

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                  前端 (React 18 + TypeScript + Vite)      │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ 首页总览  │ 策略中心  │ 内容中心  │ 渠道中心  │              │
│ 增长转化  │ 复盘中心  │ 风控协作  │          │              │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│              Ant Design 5 + ECharts 5 + Zustand           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 后端 (Express + TypeScript)               │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  内容模块 │ 数据模块  │ 策略模块  │ 协同模块  │  认证模块    │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│                JWT + RBAC + Zod 校验 + 审计日志            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     数据存储层                             │
├─────────────────────────────────────────────────────────┤
│          SQLite (开发) / MySQL 8.0 (生产)                 │
│          22 张业务表 · 7 个角色 · 11 个权限                │
└─────────────────────────────────────────────────────────┘
```

## 🎯 功能模块

### 1. 内容中台（Content）
| 功能 | 说明 |
|------|------|
| 选题管理 | 选题池、优先级排序、状态流转、品牌目标关联 |
| 脚本创作 | 脚本模板、版本管理、在线编辑、版本历史 |
| 素材库 | 图片/视频/文档分类存储、标签检索 |
| 内容排期 | 日历视图、多平台排期（微博/公众号/抖音/小红书/B站等）、发布状态追踪 |
| 一键发布 | 发布执行、发布日志、自动通知 |

### 2. 数据中台（Data）
| 功能 | 说明 |
|------|------|
| 首页看板 | 30 秒快速看板：今日发布、各平台数据、目标进度、待办事项 |
| 数据整合 | 多平台数据源接入（API/CSV/手动）、统一口径 |
| 指标分析 | 曝光量、互动量、分享量等多维度指标 |
| 转化分析 | 转化漏斗、ROI 追踪、渠道效果对比 |
| 全局搜索 | 跨模块搜索选题、脚本、素材、任务 |

### 3. 策略中台（Strategy）
| 功能 | 说明 |
|------|------|
| 品牌目标 | OKR 目标体系、进度追踪、可视化展示 |
| 渠道管理 | 多平台账号管理、粉丝数据、状态监控 |
| 栏目规划 | 栏目体系搭建、频道关联、排序管理 |
| 策略管理 | 品牌/平台/内容/增长策略制定与执行 |
| 月度复盘 | 数据支撑的复盘结论、可执行行动项 |

### 4. 协同中台（Collaboration）
| 功能 | 说明 |
|------|------|
| 任务管理 | 任务分配、进度追踪、优先级排序、截止日期 |
| 审批流程 | 多级审批（选题/脚本/排期/发布）、审批记录 |
| 通知中心 | 实时通知、已读/未读、分类筛选 |
| 内容复盘 | 单篇/月度/季度复盘、结论沉淀 |

### 5. 七大主页面（对应 PRD 第 6 节）

| 页面 | 路由 | 说明 |
|------|------|------|
| 🏠 首页总览 | `/home` | 30 秒快速看板，ECharts 数据可视化 |
| 🎯 策略中心 | `/strategy` | 品牌目标、渠道管理、栏目规划、策略制定、月度复盘 |
| 📝 内容中心 | `/content` | 选题库、脚本库、素材库、内容排期日历 |
| 📡 渠道中心 | `/channel` | 多平台账号管理、内容表现分析、发布策略 |
| 📈 增长转化中心 | `/growth` | 转化漏斗、ROI 评估、收入分析 |
| 🔄 复盘中心 | `/review` | 内容/活动/月度/季度/平台复盘 |
| 🛡️ 风控与协作中心 | `/risk` | 任务管理、审批中心、通知中心 |

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3+ | UI 框架 |
| TypeScript | 5.6+ | 类型安全 |
| Vite | 5.4+ | 构建工具 |
| Ant Design | 5.21+ | UI 组件库 |
| ECharts | 5.5+ | 数据可视化（柱状图/折线图/饼图） |
| React Router | 6.26+ | 客户端路由 |
| Zustand | 4.5+ | 轻量级状态管理 |
| Axios | 1.7+ | HTTP 请求 |
| Day.js | 1.11+ | 日期处理 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| TypeScript | 5.6+ | 类型安全 |
| Express | 4.21+ | HTTP 框架 |
| better-sqlite3 | 11.7+ | SQLite 数据库驱动 |
| JWT | 9.0+ | 身份认证 |
| bcryptjs | 2.4+ | 密码哈希 |
| Zod | 3.23+ | 请求校验 |
| Multer | 1.4+ | 文件上传 |

### 数据库
- **开发环境**：SQLite（零配置，开箱即用）
- **生产环境**：MySQL 8.0（完整 DDL 脚本已提供：`server/src/database/mysql_ddl.sql`）

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 一键启动

```bash
# 1. 进入项目目录
cd new-media-platform

# 2. 安装依赖（首次）
cd server && npm install && cd ../client && npm install && cd ..

# 3. 初始化数据库（首次）
cd server && npm run seed && cd ..

# 4. 一键启动
./start.sh
```

### 分别启动

```bash
# 终端 1 - 后端 (端口 3000)
cd server
npm install        # 首次
npm run seed       # 首次，初始化数据库和种子数据
npm run dev        # 启动开发服务器

# 终端 2 - 前端 (端口 5173)
cd client
npm install        # 首次
npm run dev        # 启动开发服务器
```

### 访问应用

| 服务 | 地址 |
|------|------|
| 🌐 前端页面 | http://localhost:5173 |
| 📡 后端 API | http://localhost:3000 |
| ❤️ 健康检查 | http://localhost:3000/api/health |

### 测试账号

所有账号密码均为 **`123456`**

| 用户名 | 角色 | 权限 |
|--------|------|------|
| `admin` | 系统管理员 | 全部功能 |
| `brand` | 品牌负责人 | 品牌目标、策略管理、数据查看、审批 |
| `editor` | 内容运营 | 选题、脚本、素材、排期、发布 |
| `analyst` | 数据分析师 | 数据看板、指标分析、数据源管理 |
| `channel` | 渠道经理 | 渠道管理、内容表现分析 |
| `growth` | 增长专员 | 转化数据、增长策略 |
| `risk` | 风控管理员 | 审批管理、风控、任务协作 |

## 📁 项目结构

```
new-media-platform/
├── start.sh                          # 一键启动脚本
├── .gitignore
├── README.md                         # 项目说明
│
├── server/                           # 后端服务
│   ├── src/
│   │   ├── app.ts                    # Express 应用入口
│   │   ├── database/
│   │   │   ├── connection.ts         # SQLite 数据库连接
│   │   │   ├── schema.ts             # 22 张表 DDL
│   │   │   ├── seed.ts               # 种子数据（7用户 + 业务数据）
│   │   │   └── mysql_ddl.sql         # MySQL 生产环境 DDL
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT 认证 + RBAC 权限中间件
│   │   ├── utils/
│   │   │   ├── jwt.ts                # Token 签发/验证
│   │   │   └── response.ts           # 统一响应格式
│   │   └── modules/
│   │       ├── auth/routes.ts         # 认证模块（登录/注册/Token刷新/用户管理）
│   │       ├── content/routes.ts      # 内容中台（选题/脚本/素材/排期/发布）
│   │       ├── data/routes.ts         # 数据中台（看板/指标/转化/搜索）
│   │       ├── collaboration/routes.ts # 协同中台（任务/审批/通知/复盘）
│   │       └── strategy/routes.ts     # 策略中台（目标/渠道/栏目/策略/月度复盘）
│   ├── data/                          # SQLite 数据库文件（自动生成）
│   ├── uploads/                       # 素材上传目录
│   ├── package.json
│   └── tsconfig.json
│
└── client/                           # 前端应用
    ├── src/
    │   ├── main.tsx                  # 应用渲染入口
    │   ├── App.tsx                   # 路由配置（7页面 + 登录 + 私有路由）
    │   ├── components/
    │   │   └── MainLayout.tsx        # 主布局（侧边栏导航 + 顶栏搜索/通知/用户）
    │   ├── services/
    │   │   └── api.ts                # 完整 API 封装（5大模块全部接口）
    │   ├── store/
    │   │   └── auth.ts               # Zustand 认证状态管理
    │   └── pages/
    │       ├── LoginPage.tsx          # 登录页面
    │       ├── home/HomePage.tsx      # 首页总览（统计卡片 + ECharts 图表）
    │       ├── strategy/StrategyPage.tsx # 策略中心（品牌目标/渠道/栏目/策略/复盘）
    │       ├── content/ContentPage.tsx   # 内容中心（选题/脚本/素材/排期日历）
    │       ├── channel/ChannelPage.tsx   # 渠道中心（渠道卡片 + 指标对比）
    │       ├── growth/GrowthPage.tsx     # 增长转化中心（漏斗 + 收入图）
    │       ├── review/ReviewPage.tsx     # 复盘中心（复盘列表 + 统计）
    │       └── risk/RiskPage.tsx         # 风控协作（任务/审批/通知）
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 📚 API 接口

### 接口规范

所有接口统一返回格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

- `code`: 0 = 成功，非 0 = 失败
- `message`: 提示信息
- `data`: 响应数据

### 核心 API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| **认证** | `POST /api/auth/login` | 用户登录 |
| | `POST /api/auth/refresh` | 刷新Token |
| | `GET /api/auth/me` | 当前用户信息 |
| | `GET /api/auth/users` | 用户列表（管理员） |
| **内容中台** | `GET/POST /api/content/topics` | 选题列表/创建 |
| | `GET/PUT/DELETE /api/content/topics/:id` | 选题详情/更新/删除 |
| | `GET/POST /api/content/scripts` | 脚本列表/创建 |
| | `GET/PUT/DELETE /api/content/scripts/:id` | 脚本详情/更新/删除 |
| | `GET/POST /api/content/assets` | 素材列表/上传 |
| | `GET/POST /api/content/plans` | 排期列表/创建 |
| | `POST /api/content/plans/:id/publish` | 执行发布 |
| **数据中台** | `GET /api/data/dashboard-overview` | 首页看板数据 |
| | `GET /api/data/metrics` | 指标数据（支持按平台/时间筛选） |
| | `GET /api/data/conversions` | 转化数据 |
| | `GET /api/data/sources` | 数据源管理 |
| | `GET /api/data/search` | 全局搜索 |
| **协同中台** | `GET/POST /api/collab/tasks` | 任务列表/创建 |
| | `PUT /api/collab/tasks/:id` | 任务更新（状态流转） |
| | `GET/POST /api/collab/approvals` | 审批列表/提交 |
| | `PUT /api/collab/approvals/:id` | 审批处理（通过/驳回） |
| | `GET /api/collab/notifications` | 通知列表 |
| | `PUT /api/collab/notifications/read-all` | 全部已读 |
| | `GET/POST /api/collab/reviews` | 复盘列表/创建 |
| **策略中台** | `GET/POST /api/strategy/brand-goals` | 品牌目标列表/创建 |
| | `GET/POST /api/strategy/channels` | 渠道列表/创建 |
| | `GET/POST /api/strategy/columns` | 栏目列表/创建 |
| | `GET/POST /api/strategy/strategies` | 策略列表/创建 |
| | `GET/POST /api/strategy/monthly-reviews` | 月度复盘列表/创建 |

## 🔐 权限设计

采用 RBAC（基于角色的访问控制）模型：

| 角色 | 权限范围 |
|------|----------|
| 系统管理员 | 全部功能 + 用户管理 |
| 品牌负责人 | 品牌目标、策略管理、数据查看、审批 |
| 内容运营 | 选题、脚本、素材、排期、发布 |
| 数据分析师 | 数据看板、指标分析、数据源管理 |
| 渠道经理 | 渠道管理、内容分析、数据查看 |
| 增长专员 | 转化数据、增长策略 |
| 风控管理员 | 审批管理、风控、任务协作 |

## ✅ 已验证的完整业务流程

端到端闭环已通过自动化测试：

```
目标 → 策略 → 选题 → 生产(脚本) → 审批 → 排期 → 分发(发布) → 转化 → 复盘 → 优化
```

```
✅ 品牌目标创建    →  策略关联
✅ 选题创建        →  关联品牌目标
✅ 脚本创作        →  关联选题
✅ 选题审批提交    →  风控管理员审批通过
✅ 内容排期        →  指定平台和时间
✅ 一键发布        →  发布日志 + 通知
✅ 复盘任务创建    →  数据分析师跟进
```

## 🗺️ 路线图

### v1.0（当前版本）
- ✅ 内容中台（选题/脚本/素材/排期/发布）
- ✅ 数据中台（看板/指标/转化/搜索）
- ✅ 策略中台（品牌目标/渠道/栏目/策略/月度复盘）
- ✅ 协同中台（任务/审批/通知/复盘）
- ✅ 七大主页面完整 UI
- ✅ JWT + RBAC 认证授权
- ✅ ECharts 数据可视化
- ✅ 完整 E2E 自动化测试

### v1.5（规划中）
- 🔄 AI 辅助选题生成
- 🔄 AI 标题优化与脚本初稿
- 🔄 评论分析与舆情监控
- 🔄 数据导出功能
- 🔄 移动端 H5 适配

### v2.0（规划中）
- 📋 MySQL 生产部署方案
- 📋 私域运营对接
- 📋 CRM 系统集成
- 📋 企业微信/钉钉集成
- 📋 多租户 SaaS 支持

## 📖 参考文档

- [产品需求文档 (PRD)](./新媒体平台需求文档.md) — 完整的产品需求规格说明

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🙋 常见问题

### Q: 如何切换为 MySQL？
A: 项目已提供完整 MySQL DDL 脚本（`server/src/database/mysql_ddl.sql`）。修改 `server/src/database/connection.ts` 中的数据库连接配置即可。

### Q: 如何对接真实的新媒体平台数据？
A: 项目预留了数据源管理接口（`/api/data/sources`），可通过各平台开放 API 进行数据同步。

### Q: AI 功能如何使用？
A: AI 功能接口已预留，在 `server/src/modules/` 下对应模块中添加 AI 服务调用即可，前端表单已包含 AI 辅助入口。

### Q: 如何添加自定义权限？
A: 在 `server/src/database/seed.ts` 中添加新权限，或在数据库 `permissions` 表中直接插入新记录。

---

<div align="center">
  <p>如果这个项目对你有帮助，别忘了给个 ⭐ Star 哦！</p>
  <p>Made with ❤️ by AI Team</p>
</div>
