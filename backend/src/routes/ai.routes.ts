import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createConfigValidation, taskIdValidation, configIdValidation, handleValidationErrors } from '../utils/validators.js';
import { aiService } from '../services/AIService.js';
import { taskQueueService } from '../services/TaskQueue.js';
import prisma from '../utils/database.js';
import { ApiResponse } from '../types/index.js';
import logger from '../utils/logger.js';

const router = Router();

// 创建提取配置
router.post('/configs',
  authMiddleware,
  createConfigValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { cadFileId, name, headers, legendImage, exampleImage, exampleData } = req.body;

      // 验证CAD文件所有权
      const cadFile = await prisma.cADFile.findFirst({
        where: {
          id: cadFileId,
          project: {
            userId: req.user!.userId
          }
        }
      });

      if (!cadFile) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      const config = await prisma.extractionConfig.create({
        data: {
          cadFileId,
          name,
          headers,
          legendImage,
          exampleImage,
          exampleData
        }
      });

      logger.info(`提取配置创建成功: ${config.id}`);

      res.status(201).json({
        success: true,
        data: config,
        message: '提取配置创建成功'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取CAD文件的所有配置
router.get('/configs/:cadFileId',
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // 验证CAD文件所有权
      const cadFile = await prisma.cADFile.findFirst({
        where: {
          id: req.params.cadFileId,
          project: {
            userId: req.user!.userId
          }
        }
      });

      if (!cadFile) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      const configs = await prisma.extractionConfig.findMany({
        where: { cadFileId: req.params.cadFileId },
        include: {
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: configs
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 创建提取任务
router.post('/extract',
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { configId, chunks } = req.body;

      if (!configId) {
        return res.status(400).json({
          success: false,
          error: '未提供配置ID'
        } as ApiResponse);
      }

      // 验证配置所有权
      const config = await prisma.extractionConfig.findFirst({
        where: {
          id: configId,
          cadFile: {
            project: {
              userId: req.user!.userId
            }
          }
        }
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          error: '配置不存在'
        } as ApiResponse);
      }

      // 创建任务
      const task = await prisma.aITask.create({
        data: {
          configId,
          status: 'pending',
          totalChunks: chunks?.length || 10, // 使用传入的块数或默认值
          processedChunks: 0,
          progress: 0
        }
      });

      // 如果提供了分块信息，批量添加到队列
      if (chunks && Array.isArray(chunks) && chunks.length > 0) {
        await taskQueueService.addBulkExtractionTasks(task.id, configId, chunks);
        logger.info(`批量提取任务创建成功: ${task.id}, 包含 ${chunks.length} 个分块`);
      } else {
        // 添加到任务队列（使用默认分块）
        await taskQueueService.addExtractionTask(task.id, configId);
        logger.info(`提取任务创建成功: ${task.id}`);
      }

      res.status(201).json({
        success: true,
        data: task,
        message: '提取任务已创建并开始处理'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取任务状态
router.get('/tasks/:taskId',
  authMiddleware,
  taskIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const task = await prisma.aITask.findUnique({
        where: { id: req.params.taskId },
        include: {
          config: {
            include: {
              cadFile: {
                include: {
                  project: {
                    select: {
                      userId: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        } as ApiResponse);
      }

      // 验证任务所有权
      if (task.config.cadFile.project.userId !== req.user!.userId) {
        return res.status(403).json({
          success: false,
          error: '无权访问该任务'
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: {
          id: task.id,
          status: task.status,
          progress: task.progress,
          totalChunks: task.totalChunks,
          processedChunks: task.processedChunks,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
          errorMessage: task.errorMessage
        }
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取任务结果
router.get('/tasks/:taskId/results',
  authMiddleware,
  taskIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const task = await prisma.aITask.findUnique({
        where: { id: req.params.taskId },
        include: {
          config: {
            include: {
              cadFile: {
                include: {
                  project: {
                    select: {
                      userId: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        } as ApiResponse);
      }

      // 验证任务所有权
      if (task.config.cadFile.project.userId !== req.user!.userId) {
        return res.status(403).json({
          success: false,
          error: '无权访问该任务'
        } as ApiResponse);
      }

      const results = await aiService.getTaskResults(req.params.taskId);

      res.json({
        success: true,
        data: results
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 验证提取结果
router.post('/results/:resultId/verify',
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { verified } = req.body;

      if (typeof verified !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: '请提供验证状态'
        } as ApiResponse);
      }

      // 验证结果所有权
      const result = await prisma.extractionResult.findUnique({
        where: { id: req.params.resultId },
        include: {
          task: {
            include: {
              config: {
                include: {
                  cadFile: {
                    include: {
                      project: {
                        select: {
                          userId: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!result) {
        return res.status(404).json({
          success: false,
          error: '提取结果不存在'
        } as ApiResponse);
      }

      if (result.task.config.cadFile.project.userId !== req.user!.userId) {
        return res.status(403).json({
          success: false,
          error: '无权修改该结果'
        } as ApiResponse);
      }

      await aiService.verifyResult(req.params.resultId, verified);

      res.json({
        success: true,
        message: verified ? '结果已验证' : '结果已拒绝'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 导出任务结果
router.get('/tasks/:taskId/export',
  authMiddleware,
  taskIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const task = await prisma.aITask.findUnique({
        where: { id: req.params.taskId },
        include: {
          config: {
            include: {
              cadFile: {
                include: {
                  project: {
                    select: {
                      userId: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        } as ApiResponse);
      }

      // 验证任务所有权
      if (task.config.cadFile.project.userId !== req.user!.userId) {
        return res.status(403).json({
          success: false,
          error: '无权访问该任务'
        } as ApiResponse);
      }

      const exportData = await aiService.exportResults(req.params.taskId);

      res.json({
        success: true,
        data: exportData
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取队列统计信息
router.get('/queue/stats',
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const stats = await taskQueueService.getQueueStats();

      res.json({
        success: true,
        data: stats
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
