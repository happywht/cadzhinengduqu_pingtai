# CAD智能提取平台 - 项目总体说明

## 项目概述

这是一个完整的CAD智能提取平台，包含前端和后端两部分，用于从CAD工程图纸中智能提取表格数据。

## 项目结构

```
轻量读cad2/
├── backend/                    # 后端服务 (Node.js + Express + TypeScript)
│   ├── src/                   # 源代码
│   ├── prisma/                # 数据库配置
│   ├── uploads/               # 文件上传目录
│   ├── logs/                  # 日志文件
│   ├── package.json           # 后端依赖配置
│   └── README.md              # 后端文档
│
├── index.html                 # 前端入口 (或index(1).html)
├── CLAUDE.md                  # 项目配置说明
├── prd.md                     # 产品需求文档
│
└── PROJECT_STRUCTURE.md       # 本文件
```

## 快速开始

### 1. 后端服务启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量 (已预配置)
# 编辑 .env 文件如需修改

# 初始化数据库
npm run prisma:generate
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

**后端服务**: http://localhost:3001

### 2. 前端应用启动

```bash
# 如果使用Vite/React等框架
# 在项目根目录或前端目录下
npm install
npm run dev

# 如果使用静态HTML
# 直接打开 index.html 或使用静态服务器
npx http-server -p 5173
```

**前端应用**: http://localhost:5173

## 技术栈

### 后端技术
- **运行时**: Node.js 22.x
- **框架**: Express 4.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (jsonwebtoken)
- **任务队列**: BullMQ + Redis
- **AI集成**: 智谱AI (@anthropic-ai/sdk)

### 前端技术
- **框架**: React/Vue (根据实际配置)
- **构建工具**: Vite/Webpack
- **UI组件**: 现代化UI框架
- **状态管理**: Redux/Pinia
- **HTTP客户端**: Axios/Fetch

## API接口说明

### 基础URL
```
http://localhost:3001/api
```

### 主要接口

#### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户信息

#### 项目管理
- `POST /projects` - 创建项目
- `GET /projects` - 获取项目列表
- `GET /projects/:id` - 获取项目详情
- `DELETE /projects/:id` - 删除项目

#### CAD文件管理
- `POST /cad/upload` - 上传CAD文件
- `GET /cad/:fileId` - 获取文件信息
- `GET /cad/:fileId/layers` - 获取图层列表
- `DELETE /cad/:fileId` - 删除文件

#### AI数据提取
- `POST /ai/configs` - 创建提取配置
- `POST /ai/extract` - 创建提取任务
- `GET /ai/tasks/:taskId` - 获取任务状态
- `GET /ai/tasks/:taskId/results` - 获取提取结果

## 数据库设计

### 核心数据模型
1. **User** - 用户信息
2. **Project** - 项目信息
3. **CADFile** - CAD文件
4. **ExtractionConfig** - 提取配置
5. **AITask** - AI任务
6. **ExtractionResult** - 提取结果

### 关系说明
- 一个用户可以有多个项目
- 一个项目可以有多个CAD文件
- 一个CAD文件可以有多个提取配置
- 一个配置可以创建多个提取任务
- 一个任务可以产生多个提取结果

## 开发环境配置

### 必需软件
1. **Node.js** >= 22.x
2. **PostgreSQL** >= 13.x
3. **Redis** >= 6.x (可选，用于任务队列)

### 可选软件
1. **Git** - 版本控制
2. **VS Code** - 推荐IDE
3. **Postman** - API测试工具
4. **Prisma Studio** - 数据库管理

### 环境变量配置

#### 后端 (.env)
```env
DATABASE_URL="postgresql://root:nishishui123@localhost:5432/cad_extractor"
JWT_SECRET="cad-extractor-secret-key-2024"
PORT=3001
NODE_ENV="development"
ZHIPUAI_API_KEY="your-zhipuai-api-key"
ZHIPUAI_BASE_URL="https://open.bigmodel.cn/api/anthropic"
```

#### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=CAD智能提取平台
```

## 功能特性

### 核心功能
1. **用户管理** - 注册、登录、权限控制
2. **项目管理** - 创建、编辑、删除项目
3. **CAD文件管理** - 上传、解析、管理CAD文件
4. **智能数据提取** - AI驱动的表格数据提取
5. **结果验证** - 人工验证和校正提取结果
6. **数据导出** - 支持多种格式导出

### 技术特性
1. **异步任务处理** - 支持大文件处理
2. **实时进度跟踪** - WebSocket支持
3. **分块处理** - 大图纸分块提取
4. **错误恢复** - 任务失败自动重试
5. **数据安全** - 加密存储和传输

## 部署说明

### 开发环境
```bash
# 后端
cd backend
npm run dev

# 前端
npm run dev
```

### 生产环境
```bash
# 后端构建
cd backend
npm run build
npm start

# 前端构建
npm run build

# 使用Nginx部署前端
# 使用PM2管理后端进程
pm2 start backend/dist/server.js --name cad-backend
```

## 测试指南

### API测试示例

#### 1. 用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "123456"
  }'
```

#### 2. 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

#### 3. 创建项目 (需要JWT令牌)
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "测试项目",
    "description": "这是一个测试项目"
  }'
```

#### 4. 上传CAD文件
```bash
curl -X POST http://localhost:3001/api/cad/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "cadFile=@path/to/your/file.dwg" \
  -F "projectId=YOUR_PROJECT_ID"
```

## 常见问题

### Q1: 后端服务无法启动？
**A**: 检查PostgreSQL服务是否运行，端口是否被占用。

### Q2: 前端无法连接后端？
**A**: 检查CORS配置，确认后端服务正常运行。

### Q3: 文件上传失败？
**A**: 检查文件大小限制，确保uploads目录存在且有写权限。

### Q4: AI提取功能不工作？
**A**: 检查智谱AI API密钥配置，确认Redis服务运行。

## 开发规范

### 代码风格
- 使用ESLint进行代码检查
- 遵循TypeScript最佳实践
- 使用Prettier格式化代码

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 分支管理
- `main` - 主分支，生产环境
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支

## 文档索引

### 项目文档
- **后端文档**: `backend/README.md`
- **安装指南**: `backend/SETUP.md`
- **启动清单**: `backend/STARTUP_CHECKLIST.md`
- **项目总结**: `backend/PROJECT_SUMMARY.md`
- **产品需求**: `prd.md`
- **项目配置**: `CLAUDE.md`

### AI功能文档
- **AI使用指南**: `docs/AI_EXTRACTION_GUIDE.md`
- **AI配置示例**: `docs/AI_EXTRACTION_CONFIG_EXAMPLES.md`
- **AI快速开始**: `docs/AI_QUICK_START.md`
- **AI实施总结**: `docs/AI_IMPLEMENTATION_SUMMARY.md`
- **AI实施报告**: `AI_IMPLEMENTATION_REPORT.md`
- **AI验收清单**: `AI_ACCEPTANCE_CHECKLIST.md`

## 技术支持

### 联系方式
- 查看项目文档获取更多信息
- 检查日志文件排查问题
- 使用Prisma Studio管理数据库

### 有用的命令
```bash
# 后端
cd backend
npm run prisma:studio    # 数据库管理界面
npm run dev              # 开发服务器
npm run build            # 构建生产版本

# 前端
npm run dev              # 开发服务器
npm run build            # 构建生产版本
```

## 许可证

MIT License

## 更新日志

### v0.1.0 (2024-04-14)
- ✅ 完成后端项目初始化
- ✅ 实现用户认证系统
- ✅ 实现项目管理功能
- ✅ 实现CAD文件管理
- ✅ 实现AI智能提取功能
- ✅ 完善项目文档

---

**项目路径**: `D:\工作\城建院\2604\轻量读cad2`

**后端路径**: `D:\工作\城建院\2604\轻量读cad2\backend`

**状态**: ✅ 后端初始化完成，准备开发

**祝您开发愉快！🚀**
