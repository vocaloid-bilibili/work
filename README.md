# Vocabili 运维工作台

术力口数据库 [vocabili.top](https://vocabili.top) 的内部运维前端，用于排行榜数据标注、协同编辑、数据导入与发布。

## 功能模块

### 打标 (Marking)

- Excel 文件上传解析，支持拖拽
- 卡片 / 双列 / 表格三种视图切换
- 逐条标注歌曲元数据：歌名、歌手、作者、引擎、视频类型、歌曲类型
- 收录 / 排除 / 待处理 三态管理，支持批量操作
- 表格视图支持键盘导航、剪贴板复制粘贴、列宽调整
- 导出前自动检查：字段缺失、标注不一致、歌名=标题、作者=UP主等
- WebSocket 实时协同，多人同时标注同一任务

### 编辑工作台 (Editor)

- 歌曲搜索（名称 / ID / BV号）
- 歌曲信息编辑：显示名、类型、歌手/作者/引擎
- 视频信息编辑：标题、视频类型、禁用状态
- 合并歌曲：将源歌曲的视频和艺人转移到目标
- 合并艺人：跨歌曲关联转移
- 拆分/移动视频：将视频从一首歌移到另一首
- 榜单视频设置：为每期排行榜指定对应的B站视频
- 操作日志：按日期分组的 Activity Feed，自然语言描述每条变更

### 数据导入 (Ingest)

- 自动识别文件类型（日刊/周刊/月刊排名 或 快照数据）
- 上传 → 检查 → SSE 流式更新数据库
- 支持排名数据和快照数据两种导入流程

### 统计 (Stats)

- 贡献者排行榜与积分
- 操作时间线
- 任务级与全局统计

### 发布 (Publish)

- 三种发布模式：全套发布 / 下载并导入 / 仅导入
- 逐文件处理，失败可勾选重试
- 发布锁防止并发冲突

## 技术栈

| 类别     | 选型                                   |
| -------- | -------------------------------------- |
| 框架     | React 19 + TypeScript 5.9              |
| 构建     | Vite 7                                 |
| 样式     | Tailwind CSS v4 + shadcn/ui (New York) |
| 路由     | React Router v7                        |
| 状态     | React hooks（无全局状态库）            |
| HTTP     | Axios + Fetch API                      |
| 实时通信 | 原生 WebSocket（自封装心跳重连）       |
| SSE      | @microsoft/fetch-event-source          |
| Excel    | ExcelJS（Web Worker 中解析）           |
| 图标     | Lucide React                           |
| 日期     | Luxon                                  |
| 通知     | Sonner                                 |

## 项目结构

```

src/
├── core/ # 核心基础设施
│ ├── api/ # API 客户端与端点定义
│ │ ├── collabClient.ts # 协同服务 HTTP 客户端
│ │ ├── collabEndpoints.ts # 编辑日志、同步状态
│ │ ├── mainClient.ts # 主 API Axios 实例（含 token 刷新）
│ │ ├── mainEndpoints.ts # 歌曲/视频/艺人/排名 CRUD
│ │ └── sseStream.ts # SSE 流式通信封装
│ ├── auth/ # 认证
│ │ ├── token.ts # JWT 存储、解析、自动刷新
│ │ └── roles.ts # 角色权限判断
│ ├── helpers/ # 工具函数
│ │ ├── board.ts # 期号计算
│ │ ├── filename.ts # 文件名 → 榜单/快照 ID 解析
│ │ ├── sanitize.ts # Excel 单元格清洗
│ │ └── time.ts # 相对时间格式化
│ ├── types/ # 类型定义与常量
│ │ ├── catalog.ts # Song, Video, Artist 等核心类型
│ │ ├── collab.ts # 协同操作类型
│ │ ├── constants.ts # 全局常量（版权、歌曲类型、榜单、字段标签）
│ │ └── stats.ts # 统计相关类型
│ └── ws/ # WebSocket
│ └── RealtimeSocket.ts # 心跳重连封装
├── modules/ # 业务模块
│ ├── editor/ # 编辑工作台
│ │ ├── log/ # 操作日志（Activity Feed）
│ │ ├── panels/ # 合并/拆分/榜单面板
│ │ ├── song/ # 歌曲编辑
│ │ ├── video/ # 视频编辑
│ │ ├── shared/ # 共享组件（SongInfoCard, ArtistFields）
│ │ └── dialogs/ # 确认弹窗
│ ├── marking/ # 标注
│ │ ├── card/ # 卡片视图
│ │ ├── table/ # 表格视图（键盘导航、列宽）
│ │ ├── check/ # 导出前检查
│ │ ├── collab/ # 协同逻辑（WebSocket + 快照 + OT）
│ │ ├── publish/ # 发布流程
│ │ └── state/ # 状态管理 hooks
│ ├── ingest/ # 数据导入
│ └── stats/ # 统计
├── shared/ # 跨模块共享
│ ├── hooks/ # useDebounce, useClickOutside
│ └── ui/ # Avatar, TagEditor, EntityPicker 等
├── shell/ # 应用外壳
│ ├── App.tsx # 路由定义
│ ├── AuthProvider.tsx # 认证上下文
│ └── Layout.tsx # 导航栏布局
├── ui/ # shadcn/ui 组件
└── workers/ # Web Worker
└── xlsx.worker.ts # Excel 后台解析

```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（自动代理 API 到 api.vocabili.top）
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览生产构建
npm run preview
```

## 环境要求

- Node.js ≥ 18
- npm ≥ 9

## API 代理

开发环境下 Vite 自动代理 `/collab` 路径到 `https://api.vocabili.top`，无需额外配置。

## 认证

使用 JWT Bearer Token 认证，支持 access_token 自动刷新。最低权限要求 `worker` 角色。
