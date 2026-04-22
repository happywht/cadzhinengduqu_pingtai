# 🚀 CAD智能提取平台 - 快速启动指南

**准备时间**：5分钟
**启动时间**：2分钟

---

## ⚡ 5分钟快速启动

### 前置要求

您的系统已安装：
- ✅ Node.js 22.x
- ✅ npm 或 pnpm
- ✅ PostgreSQL（可选，开发阶段可跳过）
- ✅ Redis（可选，开发阶段可跳过）

---

## 📋 启动步骤

### 第1步：启动后端服务（1分钟）

打开**第一个**终端窗口：

```bash
# 进入后端目录
cd "D:\工作\城建院\2604\轻量读cad2\backend"

# 启动开发服务器
npm run dev
```

**预期输出**：
```
================================
🚀 CAD智能提取平台后端服务启动成功
📍 服务地址: http://localhost:3001
🌍 环境: development
================================
```

✅ **后端启动成功！** 保持这个终端窗口打开。

---

### 第2步：启动前端服务（1分钟）

打开**第二个**终端窗口：

```bash
# 进入前端目录
cd "D:\工作\城建院\2604\轻量读cad2\frontend"

# 启动开发服务器
npm run dev
```

**预期输出**：
```
  VITE v5.4.21  ready in 345 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to enter to show help
```

✅ **前端启动成功！** 保持这个终端窗口打开。

---

### 第3步：打开应用（10秒）

1. **自动方式**：
   - 如果浏览器没有自动打开，手动访问：http://localhost:5173

2. **手动方式**：
   - 打开浏览器（推荐Chrome或Edge）
   - 输入地址：http://localhost:5173
   - 按回车键

✅ **应用已打开！** 您应该看到CAD智能提取平台的界面。

---

## 🎯 功能验证（3分钟）

### 验证1：查看界面（30秒）

您应该看到：
- ✅ 顶部导航栏：显示"CAD智能信息提取平台"
- ✅ 左侧区域：深色CAD画布（当前为空）
- ✅ 右侧区域：配置面板
- ✅ 上传按钮：在右上角

### 验证2：测试上传功能（1分钟）

1. 点击右上角"上传CAD文件"按钮
2. 在test-files目录中选择一个测试DXF文件
3. 等待文件上传和解析

**预期结果**：
- ✅ 文件上传成功
- ✅ 左侧画布显示CAD内容
- ✅ 右侧显示图层列表

### 验证3：测试交互功能（1分钟）

1. **缩放**：滚动鼠标滚轮
2. **平移**：按住左键拖拽
3. **旋转**：按住右键拖拽
4. **框选**：点击"框选区域"按钮，在画布上拖拽

**预期结果**：
- ✅ 所有交互功能正常响应

### 验证4：测试AI提取功能（30秒）

1. 在右侧配置面板选择预设模板
2. 点击"开始批量信息提取"
3. 观察进度展示

**预期结果**：
- ✅ 显示提取进度
- ✅ 完成后显示结果抽屉

---

## 🛠️ 故障排查

### 问题1：后端启动失败

**症状**：
```
Error: Cannot connect to database
```

**解决方案**：
```bash
# 方案1：跳过数据库（开发模式）
# 编辑 backend/.env，注释掉DATABASE_URL
# 重启后端

# 方案2：安装PostgreSQL
# Windows: 下载安装包 https://www.postgresql.org/download/
# macOS: brew install postgresql
# 启动: brew services start postgresql
```

### 问题2：前端启动失败

**症状**：
```
Error: Cannot find module 'xxx'
```

**解决方案**：
```bash
# 删除node_modules并重新安装
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### 问题3：端口被占用

**症状**：
```
Error: Port 3001 is already in use
Error: Port 5173 is already in use
```

**解决方案**：
```bash
# 方案1：关闭占用端口的进程
# Windows:
netstat -ano | findstr :3001
taskkill /PID <进程ID> /F

# 方案2：修改端口
# 编辑 backend/.env: PORT=3002
# 编辑 frontend/vite.config.ts: server.port=5174
```

### 问题4：AI调用失败

**症状**：
```
Error: API request failed
```

**解决方案**：
```bash
# 检查API Key配置
# 编辑 backend/.env
ZHIPUAI_API_KEY="your-api-key-here"
ZHIPUAI_BASE_URL="https://open.bigmodel.cn/api/anthropic"

# 确认API Key有效
# 确认网络连接正常
```

---

## 📚 下一步

### 立即可做的事

1. **上传真实CAD文件**：测试您的实际DXF文件
2. **配置提取规则**：设置您需要的表头字段
3. **测试AI提取**：体验智能信息提取功能
4. **审核结果**：查看和修正提取结果

### 学习资源

- 📖 完整文档：`docs/AI_QUICK_START.md`
- 🎨 设计系统：`docs/design-system.md`
- 🔧 API文档：后端API路由文件中的注释

### 高级功能

1. **数据库集成**：配置PostgreSQL进行数据持久化
2. **任务队列**：配置Redis支持批量处理
3. **用户认证**：实现用户登录和权限管理
4. **数据导出**：导出Excel/CSV格式的提取结果

---

## 💡 使用技巧

### 快捷键
- `Ctrl + O`：打开文件
- `Ctrl + S`：保存配置
- `Ctrl + Z`：撤销操作
- `ESC`：退出当前模式

### 性能优化
- 大文件会自动分块处理
- 空白区域自动跳过
- 图片自动压缩减少成本

### 最佳实践
1. 先用小文件测试，确认功能正常
2. 提供准确的Few-shot示例提升准确率
3. 定期保存配置和结果
4. 导出数据进行备份

---

## 🆘 获取帮助

### 文档参考
- 快速开始：本文件
- 完整指南：`docs/AI_QUICK_START.md`
- API文档：后端路由文件中的注释
- 验证报告：`VERIFICATION_REPORT.md`

### 问题反馈
如遇到问题，请检查：
1. 控制台日志（F12打开开发者工具）
2. 后端终端输出
3. 相关文档和示例

---

## ✅ 启动检查清单

启动前确认：
- [ ] Node.js已安装（运行`node -v`检查）
- [ ] 依赖已安装（frontend/和backend/目录下运行过`npm install`）
- [ ] 终端可以打开多个窗口

启动时确认：
- [ ] 后端终端显示"服务启动成功"
- [ ] 前端终端显示Vite服务器地址
- [ ] 浏览器可以打开http://localhost:5173

功能测试确认：
- [ ] 可以看到应用界面
- [ ] 上传按钮可点击
- [ ] 配置面板显示正常

---

**准备好了吗？让我们开始吧！** 🚀

** Are you OK? **

---

**更新时间**：2026-04-15
**文档版本**：v1.0
