import { Router } from 'express';
import { authService } from '../services/AuthService.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createUserValidation, loginValidation, handleValidationErrors } from '../utils/validators.js';
import { ApiResponse } from '../types/index.js';
import logger from '../utils/logger.js';

const router = Router();

// 用户注册
router.post('/register', createUserValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 用户登录
router.post('/login', loginValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
      message: '登录成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: any, res, next) => {
  try {
    const user = await authService.getUserById(req.user.userId);

    res.json({
      success: true,
      data: user
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 更新用户信息
router.patch('/me', authMiddleware, async (req: any, res, next) => {
  try {
    const user = await authService.updateUser(req.user.userId, req.body);

    res.json({
      success: true,
      data: user,
      message: '用户信息更新成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

// 修改密码
router.post('/change-password', authMiddleware, async (req: any, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '请提供原密码和新密码'
      } as ApiResponse);
    }

    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    res.json({
      success: true,
      message: '密码修改成功'
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
});

export default router;
