import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AppError } from '../types/index.js';
import logger from '../utils/logger.js';

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  logger.error('错误发生:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
    return;
  }

  // Prisma错误处理
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: '资源已存在'
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: '资源不存在'
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: '数据库操作失败'
    });
    return;
  }

  // 验证错误
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: '数据验证失败'
    });
    return;
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: '无效的认证令牌'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: '认证令牌已过期'
    });
    return;
  }

  // 默认服务器错误
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : error.message
  });
}

export function notFoundHandler(
  req: Request,
  res: Response<ApiResponse>
): void {
  res.status(404).json({
    success: false,
    error: `路由 ${req.method} ${req.path} 不存在`
  });
}
