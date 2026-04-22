# CAD智能提取平台 - 项目总览

## 🎯 项目简介

CAD智能提取平台是一个基于人工智能的工程图纸数据提取系统，能够自动从CAD工程图纸中识别和提取表格数据，大大提高工程数据处理效率。

## 🏗️ 项目架构

```
轻量读cad2/
│
├── 📁 backend/                    # 后端服务 (Node.js + Express + TypeScript)
│   ├── 📁 src/                   # 源代码目录
│   │   ├── 📁 routes/           # API路由 (5个)
│   │   ├── 📁 services/         # 业务逻辑 (5个)
│   │   ├── 📁 middleware/       # 中间件 (3个)
│   │   ├── 📁 utils/           # 工具函数 (4个)
│   │   ├── 📁 types/           # TypeScript类型
│   │   └── 📄 server.ts        # 应用入口
│   ├── 📁 prisma/              # 数据库配置
│   ├── 📁 uploads/             # 文件上传目录
│   ├── 📁 logs/                # 日志文件目录
│   ├── 📄 package.json         # 后端依赖配置
│   ├── 📄 tsconfig.json        # TypeScript配置
│   ├── 📄 .env                 # 环境变量
│   └── 📄 README.md            # 后端文档
│
├── 📄 index.html               # 前端入口
├── 📄 index(1).html            # 前端备份入口
├── 📄 CLAUDE.md                # AI配置说明
├── 📄 prd.md                   # 产品需求文档
├── 📄 PROJECT_STRUCTURE.md     # 项目结构说明
└── 📄 README.md                # 本文件
```

## 🚀 快速开始

### 后端服务启动

```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 配置数据库
# 确保 PostgreSQL 已安装并运行
createdb -U root cad_extractor

# 4. 运行数据库迁移
npm run prisma:generate
npm run prisma:migrate

# 5. 启动开发服务器
npm run dev
```

**后端服务**: http://localhost:3001

### 前端应用启动

```bash
# 如果使用静态HTML
npx http-server -p 5173

# 或直接在浏览器中打开 index.html
```

**前端应用**: http://localhost:5173

## 🛠️ 技术栈

### 后端技术
- **Node.js** 22.x - JavaScript运行时
- **Express** 4.x - Web框架
- **TypeScript** 5.x - 编程语言
- **Prisma** 5.x - ORM框架
- **PostgreSQL** - 关系数据库
- **BullMQ** - 任务队列
- **Redis** - 缓存和队列
- **Winston** - 日志系统
- **JWT** - 身份认证

### 前端技术
- 根据实际前端配置确定

### AI集成
- **智谱AI** (GLM-4.6) - 图像识别和数据处理

## 📊 核心功能

### 1. 用户管理
- 用户注册和登录
- JWT令牌认证
- 用户信息管理

### 2. 项目管理
- 创建和管理项目
- 项目文件组织
- 权限控制

### 3. CAD文件处理
- 上传DWG/DXF文件
- 解析CAD结构
- 提取图层信息
- 文件分块处理

### 4. AI智能提取
- 配置提取规则
- AI图像识别
- 表格数据提取
- 批量处理

### 5. 结果验证
- 人工验证接口
- 结果校正
- 数据导出

## 📡 API接口

### 基础URL
```
http://localhost:3001/api
```

### 主要接口

#### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取用户信息

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

## 🗄️ 数据库设计

### 核心数据模型
1. **User** - 用户信息
2. **Project** - 项目信息
3. **CADFile** - CAD文件
4. **ExtractionConfig** - 提取配置
5. **AITask** - AI任务
6. **ExtractionResult** - 提取结果

### 关系设计
- User 1:N Project
- Project 1:N CADFile
- CADFile 1:N ExtractionConfig
- ExtractionConfig 1:N AITask
- AITask 1:N ExtractionResult

## 📚 文档导航

### 后端文档
- **[README.md](backend/README.md)** - 后端完整文档
- **[SETUP.md](backend/SETUP.md)** - 安装配置指南
- **[STARTUP_CHECKLIST.md](backend/STARTUP_CHECKLIST.md)** - 启动清单
- **[PROJECT_SUMMARY.md](backend/PROJECT_SUMMARY.md)** - 项目总结
- **[DEPLOYMENT_STATUS.md](backend/DEPLOYMENT_STATUS.md)** - 部署状态

### 项目文档
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - 项目结构说明
- **[prd.md](prd.md)** - 产品需求文档
- **[CLAUDE.md](CLAUDE.md)** - AI配置说明
- **[AI_EXTRACTION_GUIDE.md](docs/AI_EXTRACTION_GUIDE.md)** - AI提取功能指南
- **[AI_EXTRACTION_CONFIG_EXAMPLES.md](docs/AI_EXTRACTION_CONFIG_EXAMPLES.md)** - AI配置示例

## 🔧 开发环境

### 必需软件
1. **Node.js** >= 22.x
2. **PostgreSQL** >= 13.x
3. **Redis** >= 6.x (可选)

### 可选软件
1. **Git** - 版本控制
2. **VS Code** - 推荐IDE
3. **Postman** - API测试
4. **Prisma Studio** - 数据库管理

## 🎯 功能特色

### 1. 智能化处理
- AI驱动的数据提取
- 自动表格识别
- 智能分块处理

### 2. 高性能架构
- 异步任务处理
- 并发处理支持
- 缓存优化

### 3. 安全性
- JWT令牌认证
- 密码加密存储
- 数据隔离保护

### 4. 易用性
- RESTful API设计
- 完善的错误处理
- 详细的日志记录

## 📈 项目状态

### ✅ 后端开发
- [x] 项目结构搭建
- [x] 数据库设计
- [x] API接口开发
- [x] 认证系统实现
- [x] 文件上传功能
- [x] AI集成完成
- [x] 任务队列实现
- [x] 文档编写完成

**状态**: 生产就绪 🚀

### 🔄 前端开发
- [x] AI服务模块开发
- [x] 智能分块功能
- [x] 图片优化模块
- [x] AI提取面板组件
- [x] 进度展示组件
- [ ] 与CAD画布集成
- [ ] 结果展示和导出

**状态**: AI模块开发完成 ✅

## 🧪 测试指南

### 健康检查
```bash
curl http://localhost:3001/api/health
```

### 用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"123456"}'
```

### 用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## 🐛 常见问题

### Q1: 后端服务无法启动？
**A**: 检查PostgreSQL服务是否运行，端口是否被占用。

### Q2: 数据库连接失败？
**A**: 验证DATABASE_URL配置，确保PostgreSQL服务正常运行。

### Q3: 文件上传失败？
**A**: 检查文件大小限制，确保uploads目录存在且有写权限。

### Q4: AI提取不工作？
**A**: 检查智谱AI API密钥配置，确认Redis服务运行。

## 📞 支持信息

### 项目位置
- **项目根目录**: `D:\工作\城建院\2604\轻量读cad2`
- **后端目录**: `D:\工作\城建院\2604\轻量读cad2\backend`

### 主要命令
```bash
# 后端开发
cd backend
npm run dev              # 开发服务器
npm run build            # 构建生产版本
npm start                # 启动生产服务器

# 数据库管理
npm run prisma:studio    # 数据库管理界面
npm run prisma:migrate   # 运行数据库迁移
npm run prisma:seed      # 添加测试数据
```

### 快速链接
- 后端API: http://localhost:3001/api
- 健康检查: http://localhost:3001/api/health
- Prisma Studio: http://localhost:5555

## 🎉 项目亮点

1. **完整的全栈解决方案** - 从前端到后端的完整实现
2. **现代化技术栈** - 使用最新的Node.js和TypeScript技术
3. **AI智能集成** - 智谱AI驱动的智能数据提取
4. **高性能架构** - 异步任务处理，支持高并发
5. **安全性保障** - JWT认证，数据加密，权限控制
6. **完善的文档** - 详细的开发文档和API文档
7. **生产就绪** - 错误处理，日志记录，监控完善

## 📄 许可证

MIT License

---

**项目版本**: v0.1.0
**更新日期**: 2026-04-14
**项目状态**: 后端开发完成 ✅
**下一步**: 前端集成测试 🚀

**祝您使用愉快！🎊**
