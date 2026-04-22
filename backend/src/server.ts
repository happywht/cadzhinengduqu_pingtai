import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { taskQueueService } from './services/TaskQueue.js';
import logger from './utils/logger.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8100;

// 中间件配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api', routes);

// 健康检查端点
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CAD智能提取平台后端API',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 启动任务队列处理器
    await taskQueueService.startWorker();
    logger.info('Task Queue Worker已启动');

    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`=================================`);
      logger.info(`🚀 CAD智能提取平台后端服务启动成功`);
      logger.info(`📍 服务地址: http://localhost:${PORT}`);
      logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`=================================`);
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      logger.info('收到SIGTERM信号，开始优雅关闭...');
      await taskQueueService.stopWorker();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('收到SIGINT信号，开始优雅关闭...');
      await taskQueueService.stopWorker();
      process.exit(0);
    });

  } catch (error) {
    logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
