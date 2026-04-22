import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { fileIdValidation, handleValidationErrors } from '../utils/validators.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';
import { cadService } from '../services/CADService.js';
import { storageService } from '../services/StorageService.js';
import prisma from '../utils/database.js';
import { ApiResponse } from '../types/index.js';
import logger from '../utils/logger.js';

const router = Router();

// 上传CAD文件
router.post('/upload',
  authMiddleware,
  uploadSingle,
  handleUploadError,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '未提供文件'
        } as ApiResponse);
      }

      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: '未提供项目ID'
        } as ApiResponse);
      }

      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: '项目不存在'
        } as ApiResponse);
      }

      // 保存CAD文件到数据库
      const cadFile = await cadService.saveCADFile(
        projectId,
        req.file.filename,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype
      );

      logger.info(`CAD文件上传成功: ${cadFile.id}`);

      res.status(201).json({
        success: true,
        data: cadFile,
        message: 'CAD文件上传成功'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取CAD文件信息
router.get('/:fileId',
  authMiddleware,
  fileIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cadFile = await cadService.getCADFile(req.params.fileId);

      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: cadFile.projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: cadFile
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取CAD文件的图层列表
router.get('/:fileId/layers',
  authMiddleware,
  fileIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cadFile = await cadService.getCADFile(req.params.fileId);

      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: cadFile.projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      const layers = await cadService.getLayers(req.params.fileId);

      res.json({
        success: true,
        data: layers
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取CAD文件的解析数据
router.get('/:fileId/parsed',
  authMiddleware,
  fileIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cadFile = await cadService.getCADFile(req.params.fileId);

      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: cadFile.projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      // 返回解析数据
      res.json({
        success: true,
        data: {
          layers: cadFile.layers,
          entities: cadFile.parsedData?.entities || [],
          bounds: cadFile.parsedData?.bounds || {}
        }
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 删除CAD文件
router.delete('/:fileId',
  authMiddleware,
  fileIdValidation,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const cadFile = await cadService.getCADFile(req.params.fileId);

      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: cadFile.projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'CAD文件不存在'
        } as ApiResponse);
      }

      await cadService.deleteCADFile(req.params.fileId);

      res.json({
        success: true,
        message: 'CAD文件删除成功'
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

// 获取项目的所有CAD文件
router.get('/project/:projectId',
  authMiddleware,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // 验证项目所有权
      const project = await prisma.project.findFirst({
        where: {
          id: req.params.projectId,
          userId: req.user!.userId
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: '项目不存在'
        } as ApiResponse);
      }

      const files = await cadService.getProjectCADFiles(req.params.projectId);

      res.json({
        success: true,
        data: files
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
