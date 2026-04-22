# CAD智能信息提取平台 - 技术说明书

## 1. 项目概述

基于 Web 的 CAD 图纸查看与智能信息提取平台。支持 DWG/DXF 文件的浏览器端直接渲染，结合 AI 多模态能力实现图纸信息的结构化提取。

核心特性：
- 纯浏览器端解析渲染 DWG/DXF 文件，无需后端转换
- 60+ FPS 高性能渲染，支持大文件
- AI 多模态信息提取（规划中）

## 2. 技术架构

```
┌─────────────────────────────────────────────────┐
│                   浏览器                          │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  MlCadViewer  │  │   AI Extraction Panel    │  │
│  │ (@mlightcad)  │  │   (智谱AI多模态)          │  │
│  │               │  │                          │  │
│  │ Web Workers:  │  │  zhipu-ai.ts             │  │
│  │  - DXF解析    │  │  chunker.ts              │  │
│  │  - DWG解析    │  │  image-optimizer.ts      │  │
│  │  - MTEXT渲染  │  │                          │  │
│  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                     │                   │
│  ┌──────┴─────────────────────┴───────────────┐  │
│  │             Vue 3 + TypeScript              │  │
│  │           Vite + Element Plus               │  │
│  └─────────────────────┬─────────────────────┘  │
│                        │                         │
└────────────────────────┼─────────────────────────┘
                         │ HTTP API
                ┌────────┴────────┐
                │   Backend (Port 8100)    │
                │   Express + TypeScript   │
                │   AI Service / Auth      │
                └─────────────────────────┘
```

## 3. 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.4.0 | 前端框架 |
| TypeScript | ^5.3.0 | 类型安全 |
| Vite | ^5.0.0 | 构建工具 |
| @mlightcad/cad-viewer | ^1.4.13 | CAD 文件渲染核心 |
| @mlightcad/cad-simple-viewer | ^1.4.13 | CAD 底层解析 |
| @mlightcad/data-model | ^1.7.23 | CAD 数据模型 |
| Element Plus | ^2.13.7 | UI 组件库 |
| vue-i18n | ^9.14.5 | 国际化（由 cad-viewer 导出） |
| @vueuse/core | ^14.2.1 | 组合式工具库 |
| Pinia | ^2.1.7 | 状态管理 |
| Vue Router | ^4.2.5 | 路由管理 |
| Axios | ^1.6.0 | HTTP 客户端 |

## 4. CAD 渲染原理

### 4.1 纯浏览器渲染

CAD 文件的解析和渲染完全在浏览器端完成，不依赖任何后端服务：

```
DWG/DXF 文件
    │
    ▼
Web Workers (后台线程)
  ├── dxf-parser-worker.js    ← DXF 文件解析
  ├── libredwg-parser-worker.js ← DWG 文件解析（基于 LibreDWG WASM）
  └── mtext-renderer-worker.js  ← 多行文本渲染
    │
    ▼
Three.js WebGL 渲染
  ├── 几何体批处理 (Geometry Batching)
  ├── 实例化渲染 (Instanced Rendering)
  ├── 自定义着色器 (Custom Shader Materials)
  └── 空间索引 (Spatial Indexing)
```

### 4.2 Worker 文件配置

Worker 文件位于 `public/assets/` 目录，由浏览器直接加载：

```
public/assets/
├── dxf-parser-worker.js        (99KB)   DXF 解析
├── libredwg-parser-worker.js   (5.8MB)  DWG 解析
└── mtext-renderer-worker.js    (1.0MB)  文本渲染
```

来源：`node_modules/@mlightcad/*/dist/` 下的同名文件。

> **注意**：每次 `npm install` 后需要重新复制 worker 文件到 `public/assets/`。

### 4.3 文件加载方式

`MlCadViewer` 组件支持三种文件加载方式：

1. **本地文件**：`localFile` prop 传入 `File` 对象
2. **远程 URL**：`url` prop 传入完整 URL（如 `http://example.com/file.dwg`）
3. **菜单打开**：组件内置菜单（☰ → Open）支持文件对话框

## 5. 项目结构

```
frontend/
├── public/
│   └── assets/                        # Worker 文件（运行时必需）
│       ├── dxf-parser-worker.js
│       ├── libredwg-parser-worker.js
│       └── mtext-renderer-worker.js
├── src/
│   ├── main.ts                        # 入口：注册 i18n(ElementPlus/MlCadViewer)
│   ├── App.vue                        # 根组件
│   ├── router/index.ts                # 路由配置
│   ├── stores/app.ts                  # 全局状态
│   ├── views/
│   │   ├── Workspace.vue              # 主工作区（MlCadViewer + 配置面板）
│   │   ├── ProjectList.vue            # 项目列表
│   │   └── ProjectDetail.vue          # 项目详情
│   ├── components/
│   │   ├── AppHeader.vue              # 顶部导航栏
│   │   ├── ConfigPanel/index.vue      # 右侧配置面板（图层/图例/表头）
│   │   ├── LoadingOverlay.vue         # 加载遮罩
│   │   ├── ResultsDrawer/index.vue    # 底部结果抽屉
│   │   ├── AIExtractionPanel.vue      # AI 提取面板
│   │   └── ExtractionProgress.vue     # 提取进度
│   ├── modules/
│   │   └── ai-service/                # AI 服务模块（智谱AI）
│   │       ├── index.ts
│   │       ├── zhipu-ai.ts
│   │       ├── chunker.ts
│   │       └── image-optimizer.ts
│   └── utils/
│       ├── index.ts                   # 通用工具函数
│       └── request.ts                 # HTTP 请求封装
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 6. 关键文件说明

### 6.1 main.ts

```typescript
// 核心要点：i18n 必须从 @mlightcad/cad-viewer 导入，不能自己创建
import { i18n } from '@mlightcad/cad-viewer'
import ElementPlus from 'element-plus'

app.use(i18n)        // MlCadViewer 依赖
app.use(ElementPlus) // MlCadViewer 内部使用 el-* 组件
```

### 6.2 Workspace.vue

```vue
<!-- 核心组件用法 -->
<MlCadViewer
  :local-file="cadFile"     <!-- 本地文件对象 -->
  :url="cadUrl"             <!-- 或远程 URL -->
  :background="0x1e293b"    <!-- 深色背景 -->
  locale="zh"               <!-- 中文界面 -->
/>
```

### 6.3 vite.config.ts

```typescript
export default defineConfig({
  worker: { format: 'es' },  // Worker ES 模块格式
})
```

## 7. 开发与部署

### 7.1 开发环境启动

```bash
cd frontend

# 首次安装后，复制 worker 文件
mkdir -p public/assets
cp node_modules/@mlightcad/cad-simple-viewer/dist/mtext-renderer-worker.js public/assets/
cp node_modules/@mlightcad/data-model/dist/dxf-parser-worker.js public/assets/
cp node_modules/@mlightcad/cad-simple-viewer/dist/libredwg-parser-worker.js public/assets/

# 启动开发服务器
npm run dev
```

### 7.2 生产构建

```bash
npm run build:prod
```

构建产物在 `dist/` 目录，需确保 `public/assets/` 下的 worker 文件一并部署。

### 7.3 部署要点

- 纯静态部署即可，无需 Node.js 运行时
- 确保 `assets/` 目录下三个 worker 文件可访问
- Worker 文件路径相对于 HTML 页面解析：`./assets/xxx-worker.js`
- 如需 CDN 部署，配置 `baseUrl` prop 指向资源地址

## 8. 已知限制

| 限制 | 说明 |
|------|------|
| 天正图纸 | 需先转换为 T3 格式才能正确显示 |
| DWG 表格实体 | LibreDWG 尚不支持表格实体 |
| XRef 外部参照 | 不支持外部参照显示 |
| 部分实体 NaN | 复杂几何体可能出现 THREE.js NaN 警告（不影响整体显示） |

## 9. AI 提取功能（规划中）

AI 信息提取模块已搭建框架，使用智谱 AI 多模态 API：

```
API: https://open.bigmodel.cn/api/anthropic
Model: glm-4.6
```

流程：
1. 在 CAD 图纸上框选区域
2. 对选中区域截图
3. 结合表头配置，调用 AI 提取结构化数据
4. 人工审核修正后入库
