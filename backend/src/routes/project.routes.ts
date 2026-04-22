import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createProjectValidation, uuidParamValidation, handleValidationErrors } from '../utils/validators.js';
import prisma from '../utils/database.js';
import { ApiResponse, PaginatedResponse } from '../types/index.js';
import logger from '../utils/logger.js';

const router = Router();

// 创建项目
router.post('/', authMiddleware, createProjectValidation, handleValidationErrors, async (req: any, res, next) => {
  try {
    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: req.user.userId
      }
    });

    logger.info(`项目创建成功: ${project.id}`);

    res.status(201).json({
      success: true,
      data: project,
      message: '项目创建成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 获取当前用户的所有项目
router.get('/', authMiddleware, async (req: any, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.userId },
      include: {
        files: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            fileSize: true,
            fileType: true,
            createdAt: true
          }
        },
        _count: {
          select: { files: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: projects
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 获取项目详情
router.get('/:id', authMiddleware, uuidParamValidation, handleValidationErrors, async (req: any, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        files: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { files: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: project
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 更新项目
router.patch('/:id', authMiddleware, uuidParamValidation, handleValidationErrors, async (req: any, res, next) => {
  try {
    const { name, description } = req.body;

    // 验证项目所有权
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      } as ApiResponse);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    logger.info(`项目更新成功: ${project.id}`);

    res.json({
      success: true,
      data: project,
      message: '项目更新成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 删除项目
router.delete('/:id', authMiddleware, uuidParamValidation, handleValidationErrors, async (req: any, res, next) => {
  try {
    // 验证项目所有权
    const existingProject = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      } as ApiResponse);
    }

    // 删除项目（级联删除相关文件和配置）
    await prisma.project.delete({
      where: { id: req.params.id }
    });

    logger.info(`项目删除成功: ${req.params.id}`);

    res.json({
      success: true,
      message: '项目删除成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
