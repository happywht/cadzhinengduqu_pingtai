# CAD智能提取平台 - 前端应用

基于 Vue 3 + TypeScript + Vite 构建的现代化前端应用。

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - JavaScript超集，提供类型安全
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue官方状态管理库
- **Vue Router** - Vue官方路由管理器

## 项目结构

```
frontend/
├── src/
│   ├── components/          # UI组件
│   │   ├── CADCanvas/       # CAD画布组件
│   │   ├── ConfigPanel/     # 配置面板
│   │   ├── ResultsDrawer/   # 结果抽屉
│   │   ├── AppHeader.vue    # 应用头部
│   │   └── LoadingOverlay.vue # 加载遮罩
│   ├── views/               # 页面视图
│   │   ├── Workspace.vue    # 主工作区
│   │   ├── ProjectList.vue  # 项目列表
│   │   └── ProjectDetail.vue # 项目详情
│   ├── stores/              # 状态管理
│   │   └── app.ts           # 应用状态
│   ├── router/              # 路由配置
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── request.ts       # HTTP请求
│   │   └── index.ts         # 通用工具
│   ├── styles/              # 样式文件
│   │   ├── variables.css    # CSS变量
│   │   └── main.css         # 主样式
│   ├── App.vue              # 根组件
│   └── main.ts              # 入口文件
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 核心功能

### 1. CAD文件查看
- 轻量化CAD渲染
- 图层管理
- 框选区域

### 2. 智能配置
- 图层解析
- 图例提取
- 表头配置

### 3. 结果审核
- 批量信息提取
- 结果卡片展示
- 人工修正功能

## 开发规范

### 代码风格
- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Vue 3 Composition API 最佳实践

### 组件开发
- 使用 TypeScript 定义组件 Props 和 Emits
- 使用 `<script setup>` 语法
- 组件文件名使用 PascalCase

### 状态管理
- 使用 Pinia 进行全局状态管理
- 将状态按功能模块划分

## 环境变量

创建 `.env.local` 文件配置环境变量：

```bash
VITE_API_BASE_URL=/api
```

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Edge (最新版)
- Safari (最新版)

## 许可证

MIT
