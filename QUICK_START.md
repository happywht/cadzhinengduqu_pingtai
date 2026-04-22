# 🚀 立即启动指南 - LibreDWG后端

## ✅ 当前进度

```
✅ 端口修改为8100
✅ LibreDWG服务已创建
✅ 转换API已实现
✅ 路由已集成
✅ 环境变量已配置
```

---

## 📋 立即开始的3个步骤

### 步骤1: 安装LibreDWG工具

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install libredwg-tools

# 验证安装
dwg2DXF --version
dwg2SVG --version
```

#### macOS
```bash
brew install libredwg

# 验证安装
dwg2DXF --version
```

#### Windows
1. 下载预编译版本: https://github.com/LibreDWG/libredwg/releases
2. 解压到 `C:\LibreDWG\`
3. 添加到系统PATH

### 步骤2: 配置环境变量

编辑 `backend/.env` 文件：

```bash
# 编辑LibreDWG工具路径
nano backend/.env
```

**Ubuntu/Debian配置**:
```
LIBREDWG_DWG2DXF=/usr/bin/dwg2DXF
LIBREDWG_DWG2SVG=/usr/bin/dwg2SVG
```

**macOS配置**:
```
LIBREDWG_DWG2DXF=/usr/local/bin/dwg2DXF
LIBREDWG_DWG2SVG=/usr/local/bin/dwg2SVG
```

**Windows配置**:
```
LIBREDWG_DWG2DXF=C:\LibreDWG\bin\dwg2DXF.exe
LIBREDWG_DWG2SVG=C:\LibreDWG\bin\dwg2SVG.exe
```

### 步骤3: 启动后端服务

```bash
cd backend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

**预期输出**:
```
=================================
🚀 CAD智能提取平台后端服务启动成功
📍 服务地址: http://localhost:8100
🌍 环境: development
=================================
```

---

## 🧪 测试API

### 测试1: 健康检查
```bash
curl http://localhost:8100/health
```

**预期响应**:
```json
{
  "success": true,
  "message": "CAD智能提取平台后端服务运行正常",
  "timestamp": "2026-04-21T..."
}
```

### 测试2: 转换API
```bash
curl -X POST http://localhost:8100/api/convert \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/test.dwg"}'
```

**预期响应**:
```json
{
  "success": true,
  "data": {
    "layers": [...],
    "entities": [...],
    "bounds": {...},
    "thumbnail": "data:image/svg+xml;base64,..."
  }
}
```

---

## ⚠️ 常见问题排查

### 问题1: 端口8100被占用
```bash
# 查看占用进程
lsof -i :8100

# 杀死进程
kill -9 <PID>

# 或修改.env中的PORT
PORT=8101
```

### 问题2: LibreDWG工具找不到
```bash
# 查找工具位置
which dwg2DXF

# 或
where dwg2DXF  # Windows
```

### 问题3: 权限问题
```bash
# 给予执行权限
chmod +x /usr/bin/dwg2DXF
```

---

## 📂 API端点总览

```
POST /api/convert        - 转换CAD文件
GET  /api/health         - 健康检查
GET  /api/projects       - 项目管理
GET  /api/cad/upload     - CAD上传
```

---

## 🎯 下一步：前端集成

后端就绪后，我们需要：

1. **安装OpenCascade.js** (前端)
2. **创建CAD查看器组件** (Vue)
3. **实现图层树** (Vue组件)
4. **开发测量工具** (Vue组件)
5. **添加批注功能** (Vue组件)

**准备好继续了吗？告诉我下一步！** 🚀

---

**技术为本，产品为王，用户至上！** 🎉
