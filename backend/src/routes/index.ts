import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import cadRoutes from './cad.routes.js';
import aiRoutes from './ai.routes.js';
import convertRoutes from './convert.routes.js';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CAD智能提取平台后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 路由聚合
router.use('/convert', convertRoutes); // LibreDWG转换路由
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/cad', cadRoutes);
router.use('/ai', aiRoutes);

export default router;
