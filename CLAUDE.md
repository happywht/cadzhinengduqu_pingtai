# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**CAD智能信息提取平台** - 基于AI多模态能力的CAD图纸结构化信息提取系统。

这是一个原型项目，目标是通过网页界面让用户上传CAD文件，配置提取规则，利用AI自动从图纸中提取管线、建筑等结构化数据，并进行人工审核修正。

## 核心业务流程

### 1. 图纸轻量化处理
- 用户上传CAD文件（.dwg/.dxf格式）
- 前端进行轻量化渲染（需集成CAD解析库如`opencascade.js`或` Autodesk Forge`）
- 在左侧画布区域展示可交互的CAD图纸

### 2. 配置提取规则
- **图层解析**：AI自动识别图层内容并分类（建筑类/管线类/结构类等）
- **图例设置**：支持上传截图或框选图纸区域作为图例参考
- **表头配置**：预设或自定义提取字段（起始点、结束点、高程、坐标等）
- **示例标注**：用户在图纸上框选区域，AI根据表头预提取并生成示例

### 3. AI批量提取
- 点击"提取信息"按钮触发AI处理
- AI自动对图纸进行分块截图
- 结合示例和表头，利用多模态能力批量提取信息
- 支持长图纸的多轮解析和结果合并

### 4. 结果审核与修正
- 下方抽屉展示提取结果（图片+数据列表）
- 点击结果卡片打开编辑模态框
- 用户可修正数据（不能修改表头）
- 确认后数据入库或导出

## 技术架构

### 前端技术栈
```
技术架构：原生HTML5 + CSS3 + Vanilla JavaScript
渲染引擎：待集成CAD解析库（opencascade.js / Autodesk Forge）
AI集成：智谱AI多模态API (glm-4.6)
样式系统：CSS变量 + Flexbox/Grid布局
```

### 项目结构
```
轻量读cad2/
├── index(1).html          # 原型主文件（单HTML应用）
├── prd.md                 # 产品需求文档
├── CLAUDE.md              # 本文件
└── .spec-workflow/        # 规范管理工作流目录
    ├── specs/             # 规范文档
    ├── steering/          # 指导文档
    ├── approvals/         # 审批记录
    └── templates/         # 文档模板
```

### 核心UI组件

**主工作区布局**：
- 左侧：CAD画布面板（可缩放、平移、框选）
- 右侧：配置面板（图层列表、图例设置、表头配置）
- 底部：结果抽屉（结果卡片网格、审核操作）
- 模态框：编辑修正界面

**关键CSS变量**（位于`index(1).html:11-29`）：
```css
--bg-app: #f8fafc          # 应用背景色
--bg-surface: #ffffff      # 表面背景色
--bg-canvas: #1e293b       # CAD画布背景（深色）
--brand-primary: #2563eb   # 品牌主色（蓝色）
--header-offset: 60px      # 顶部导航栏高度
```

## AI集成指南

### 智谱AI配置
项目中已配置智谱AI API凭证（位于全局CLAUDE.md）：
```
base_url: "https://open.bigmodel.cn/api/anthropic"
api_key: "72695ca1e76e4a03be87fd7a76d20f11.3KGSHtrwMj0EPxeJ"
model: "glm-4.6"  # 多模态模型
```

### 调用示例（Python）
```python
import anthropic

client = anthropc.Anthropic(
    api_key="your-zhipuai-api-key",
    base_url="https://open.bigmodel.cn/api/anthropic"
)

message = client.messages.create(
    model="glm-4.6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": base64_screenshot
                }
            },
            {
                "type": "text",
                "text": "请根据示例从图纸中提取管线节点信息..."
            }
        ]
    }]
)
```

## 开发工作流

### 本地开发
```bash
# 使用任意静态服务器打开原型
http-server "D:\工作\城建院\2604\轻量读cad2" -p 8080 -o
# 或使用Python
python -m http.server 8080 --directory "D:\工作\城建院\2604\轻量读cad2"
```

### 规范管理工作流
项目集成了spec-workflow系统，用于管理需求和设计文档：

```bash
# 查看规范状态（使用MCP工具）
mcp__spec-workflow__spec-status --specName "cad-extractor"

# 创建规范文档
mcp__spec-workflow__spec-workflow-guide  # 加载工作流指南

# 提交审批
mcp__spec-workflow__approvals --action request --type document --category spec --categoryName "cad-extractor" --title "新功能设计" --filePath "specs/feature-design.md"
```

### 新功能开发流程
1. **研究阶段**：分析CAD解析方案、AI模型能力
2. **构思阶段**：设计数据模型、API接口
3. **计划阶段**：使用`/zcf:feat`命令创建任务清单
4. **执行阶段**：实现功能模块
5. **优化阶段**：性能测试、用户体验优化
6. **评审阶段**：代码审查、文档完善

## 关键技术决策

### CAD解析库选择（待定）
需要评估以下方案：
- **opencascade.js**：开源、功能强大、包体积大
- **Autodesk Forge**：官方、稳定、需注册
- **django-cad**（如用Python后端）：轻量、服务器渲染

### 图纸分块策略
- 大图纸需切分为多个小块（建议1024x1024px）
- 保持10%重叠区域避免信息丢失
- 使用虚拟滚动懒加载提升性能

### 数据结构示例
```typescript
interface ExtractionConfig {
  headers: string[];              // 表头列表
  example: {                      // 示例数据
    image: string;                // base64图片
    data: Record<string, string>; // 表头->值映射
  };
  legend?: string;                // 图例图片（可选）
}

interface ExtractionResult {
  id: string;
  image: string;                  // 图纸截图块
  data: Record<string, string>;   // 提取的数据
  confidence: number;             // AI置信度
  status: 'pending' | 'verified' | 'corrected';
}
```

## 已知问题和优化方向

### 当前原型限制
- ✗ 仅UI原型，无真实CAD解析功能
- ✗ AI提取功能未实现（仅模拟加载动画）
- ✗ 数据未持久化（需集成后端API）
- ✗ 无用户认证和权限管理

### 下一步开发优先级
1. **集成CAD解析库**：实现真实图纸渲染
2. **实现框选功能**：在Canvas上绘制选择框
3. **对接AI API**：完成多模态提取功能
4. **后端服务**：设计API接口、数据库模型
5. **数据导出**：支持Excel/CSV导出功能

## 样式规范

- 主色调：蓝色系 `#2563eb`（专业、可信）
- 圆角：8px（小）、12px（大）
- 阴影：3级阴影系统
- 字体：Inter（英文）+ Noto Sans SC（中文）
- 间距：8px基准网格系统

### 可访问性
- 所有交互元素支持键盘导航
- 焦点可见性：2px蓝色边框 + 2px偏移
- 颜色对比度符合WCAG AA标准

## 测试要点

### 功能测试
- 图纸上传和渲染性能
- 框选区域准确性
- AI提取准确率（需测试集）
- 数据保存和导出

### 性能测试
- 大图纸（>10MB）渲染时间
- AI并发请求处理
- 前端内存占用

### 兼容性测试
- Chrome/Edge（推荐）
- Firefox
- Safari（需确认WebGL支持）
