import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import logger from '../utils/logger.js';

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    logger.debug(`用户认证成功: ${decoded.username}`);
    next();
  } catch (error) {
    logger.error('认证失败:', error);
    res.status(401).json({
      success: false,
      error: '无效的认证令牌'
    });
  }
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // 忽略错误，继续处理请求
    next();
  }
}
