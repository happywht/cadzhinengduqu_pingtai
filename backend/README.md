# CAD智能提取平台 - 后端服务

基于 Node.js + Express + TypeScript + Prisma 的CAD智能提取平台后端服务。

## 技术栈

- **运行时**: Node.js 22.x
- **框架**: Express 4.x
- **语言**: TypeScript 5.x
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT (jsonwebtoken)
- **文件上传**: Multer
- **任务队列**: BullMQ + Redis
- **AI集成**: Anthropic SDK (智谱AI)

## 项目结构

```
backend/
├── src/
│   ├── routes/              # API路由
│   │   ├── auth.routes.ts   # 认证API
│   │   ├── project.routes.ts # 项目管理API
│   │   ├── cad.routes.ts    # CAD文件API
│   │   ├── ai.routes.ts     # AI提取API
│   │   └── index.ts         # 路由聚合
│   ├── services/            # 业务逻辑
│   │   ├── AuthService.ts   # 认证服务
│   │   ├── CADService.ts    # CAD解析服务
│   │   ├── AIService.ts     # AI集成服务
│   │   ├── TaskQueue.ts     # 任务队列服务
│   │   └── StorageService.ts # 文件存储服务
│   ├── middleware/          # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/               # 工具函数
│   │   ├── database.ts      # Prisma客户端
│   │   ├── jwt.ts           # JWT工具
│   │   ├── logger.ts        # 日志工具
│   │   └── validators.ts    # 验证规则
│   ├── types/               # TypeScript类型
│   │   └── index.ts
│   └── server.ts            # 入口文件
├── prisma/
│   └── schema.prisma        # 数据库Schema
├── uploads/                 # 文件上传目录
├── logs/                    # 日志文件目录
├── package.json
├── tsconfig.json
└── .env.example
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置相关变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://root:nishishui123@localhost:5432/cad_extractor?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV="development"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=104857600
REDIS_URL="redis://localhost:6379"
ZHIPUAI_API_KEY="your-zhipuai-api-key"
ZHIPUAI_BASE_URL="https://open.bigmodel.cn/api/anthropic"
ZHIPUAI_MODEL="glm-4.6"
CORS_ORIGIN="http://localhost:5173"
```

### 3. 设置数据库

确保PostgreSQL已安装并运行，然后创建数据库：

```bash
# 创建数据库
createdb cad_extractor

# 运行数据库迁移
npm run prisma:migrate

# 生成Prisma客户端
npm run prisma:generate
```

### 4. 启动Redis服务

```bash
# Windows (使用Chocolatey安装)
choco install redis-64
redis-server

# 或使用Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 6. 构建生产版本

```bash
npm run build
npm start
```

## API文档

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户信息
```
GET /api/auth/me
Authorization: Bearer <token>
```

### 项目管理接口

#### 创建项目
```
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "项目名称",
  "description": "项目描述"
}
```

#### 获取项目列表
```
GET /api/projects
Authorization: Bearer <token>
```

#### 获取项目详情
```
GET /api/projects/:id
Authorization: Bearer <token>
```

#### 删除项目
```
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### CAD文件接口

#### 上传CAD文件
```
POST /api/cad/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

cadFile: <file>
projectId: <project_id>
```

#### 获取CAD文件信息
```
GET /api/cad/:fileId
Authorization: Bearer <token>
```

#### 获取CAD文件图层
```
GET /api/cad/:fileId/layers
Authorization: Bearer <token>
```

#### 删除CAD文件
```
DELETE /api/cad/:fileId
Authorization: Bearer <token>
```

### AI提取接口

#### 创建提取配置
```
POST /api/ai/configs
Authorization: Bearer <token>
Content-Type: application/json

{
  "cadFileId": "file_id",
  "name": "配置名称",
  "headers": ["序号", "名称", "规格", "数量", "备注"],
  "exampleData": {...}
}
```

#### 创建提取任务
```
POST /api/ai/extract
Authorization: Bearer <token>
Content-Type: application/json

{
  "configId": "config_id"
}
```

#### 获取任务状态
```
GET /api/ai/tasks/:taskId
Authorization: Bearer <token>
```

#### 获取提取结果
```
GET /api/ai/tasks/:taskId/results
Authorization: Bearer <token>
```

#### 验证提取结果
```
POST /api/ai/results/:resultId/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "verified": true
}
```

## 数据库Schema

### User (用户)
- id: UUID (主键)
- email: String (唯一)
- username: String (唯一)
- password: String (加密)
- createdAt: DateTime
- updatedAt: DateTime

### Project (项目)
- id: UUID (主键)
- name: String
- description: String?
- userId: UUID (外键)
- createdAt: DateTime
- updatedAt: DateTime

### CADFile (CAD文件)
- id: UUID (主键)
- projectId: UUID (外键)
- filename: String
- originalName: String
- filePath: String
- fileSize: Int
- fileType: String
- parsedData: Json?
- layers: Json?
- createdAt: DateTime
- updatedAt: DateTime

### ExtractionConfig (提取配置)
- id: UUID (主键)
- cadFileId: UUID (外键)
- name: String
- headers: String[]
- legendImage: String?
- exampleImage: String?
- exampleData: Json?
- createdAt: DateTime
- updatedAt: DateTime

### AITask (AI任务)
- id: UUID (主键)
- configId: UUID (外键)
- status: String (pending/processing/completed/failed)
- totalChunks: Int
- processedChunks: Int
- progress: Float
- errorMessage: String?
- createdAt: DateTime
- completedAt: DateTime?

### ExtractionResult (提取结果)
- id: UUID (主键)
- taskId: UUID (外键)
- chunkIndex: Int
- imageUrl: String
- data: Json
- confidence: Float?
- status: String (pending/verified/rejected)
- verifiedAt: DateTime?
- createdAt: DateTime

## 开发工具

### Prisma Studio
```bash
npm run prisma:studio
```

### 运行数据库迁移
```bash
npm run prisma:migrate
```

### 重置数据库
```bash
npx prisma migrate reset
```

## 环境要求

- Node.js >= 22.x
- PostgreSQL >= 13.x
- Redis >= 6.x
- TypeScript >= 5.x

## 错误处理

所有API响应遵循统一格式：

**成功响应**:
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 日志

日志文件位于 `logs/` 目录：
- `combined.log`: 所有日志
- `error.log`: 错误日志

## 安全性

- 密码使用 bcrypt 加密
- JWT令牌认证
- CORS保护
- 文件上传大小限制
- 输入验证和清理

## 许可证

MIT

## 联系方式

如有问题，请联系开发团队。
