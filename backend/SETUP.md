# CAD智能提取平台 - 快速启动指南

## 前置要求

在启动项目之前，请确保已安装以下软件：

### 1. Node.js (必需)
- 下载地址: https://nodejs.org/
- 要求版本: >= 22.x
- 验证安装: `node --version`

### 2. PostgreSQL (必需)
- 下载地址: https://www.postgresql.org/download/windows/
- 要求版本: >= 13.x
- 默认端口: 5432
- 默认用户: root
- 默认密码: nishishui123

**安装步骤:**
1. 下载并安装PostgreSQL
2. 在安装过程中设置密码为 `nishishui123`
3. 确保勾选"安装命令行工具"

**创建数据库:**
```bash
# 打开SQL Shell (psql)
createdb -U root cad_extractor

# 或使用pgAdmin界面创建数据库
```

### 3. Redis (可选 - 用于任务队列)
- 下载地址: https://github.com/microsoftarchive/redis/releases
- 或使用Docker: `docker run -d -p 6379:6379 redis:alpine`
- 要求版本: >= 6.x

**Windows安装Redis:**
```bash
# 使用Chocolatey安装
choco install redis-64

# 启动Redis服务
redis-server
```

## 安装步骤

### 1. 安装项目依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量
环境变量已在 `.env` 文件中配置好，如需修改：
```bash
# 编辑 .env 文件
notepad .env
```

### 3. 初始化数据库
```bash
# 生成Prisma客户端
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 添加测试数据
npm run prisma:seed
```

### 4. 启动Redis服务
```bash
# 在新的终端窗口中
redis-server

# 或使用Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. 启动开发服务器
```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 验证安装

### 1. 检查健康状态
访问: `http://localhost:3001/api/health`

应该返回:
```json
{
  "success": true,
  "message": "CAD智能提取平台后端服务运行正常",
  "timestamp": "2024-..."
}
```

### 2. 测试用户注册
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"123456\"}"
```

### 3. 测试用户登录
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\"}"
```

## 常见问题

### 问题1: PostgreSQL连接失败
**解决方案:**
1. 确认PostgreSQL服务正在运行
2. 检查端口5432是否被占用
3. 验证 `.env` 文件中的数据库连接字符串

### 问题2: Redis连接失败
**解决方案:**
1. 启动Redis服务: `redis-server`
2. 如果不使用任务队列功能，可以暂时忽略此错误

### 问题3: 文件上传失败
**解决方案:**
1. 确保 `uploads` 目录存在
2. 检查文件大小限制 (默认100MB)
3. 验证文件格式 (仅支持.dwg和.dxf)

### 问题4: Prisma迁移失败
**解决方案:**
```bash
# 重置数据库
npx prisma migrate reset

# 重新生成客户端
npm run prisma:generate
```

## 开发工具

### Prisma Studio (数据库管理界面)
```bash
npm run prisma:studio
```
访问: `http://localhost:5555`

### 查看日志
日志文件位于 `logs/` 目录:
- `combined.log` - 所有日志
- `error.log` - 错误日志

## 生产部署

### 1. 构建项目
```bash
npm run build
```

### 2. 设置环境变量
确保设置以下环境变量:
```env
NODE_ENV=production
DATABASE_URL=生产数据库连接字符串
JWT_SECRET=强密码
```

### 3. 启动生产服务器
```bash
npm start
```

### 4. 使用PM2管理进程 (推荐)
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start dist/server.js --name cad-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs cad-backend
```

## API文档

详细的API文档请查看 `README.md` 文件。

主要API端点:
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/projects` - 获取项目列表
- `POST /api/cad/upload` - 上传CAD文件
- `POST /api/ai/extract` - 创建提取任务

## 技术支持

如遇到问题，请检查:
1. Node.js版本是否正确
2. 所有依赖是否已安装
3. 数据库连接是否正常
4. 端口是否被占用
5. 防火墙设置是否正确

祝您使用愉快!
