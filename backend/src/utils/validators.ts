import { body, param, validationResult } from 'express-validator';
import { Response } from 'express';

// 验证结果处理中间件
export const handleValidationErrors = (req: any, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: '验证失败',
      details: errors.array()
    });
  }
  next();
};

// 用户验证规则
export const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少为6个字符')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

// 项目验证规则
export const createProjectValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('项目名称长度必须在1-100个字符之间')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('项目描述不能超过500个字符')
    .trim()
];

// 提取配置验证规则
export const createConfigValidation = [
  body('cadFileId')
    .isUUID()
    .withMessage('请提供有效的CAD文件ID'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('配置名称长度必须在1-100个字符之间')
    .trim(),
  body('headers')
    .isArray({ min: 1 })
    .withMessage('至少需要提供一个表头')
    .custom((headers) => {
      if (headers.some((h: any) => typeof h !== 'string' || h.trim() === '')) {
        throw new Error('所有表头必须是非空字符串');
      }
      return true;
    }),
  body('legendImage')
    .optional()
    .isString(),
  body('exampleImage')
    .optional()
    .isString(),
  body('exampleData')
    .optional()
    .isObject()
    .withMessage('示例数据必须是对象')
];

// UUID参数验证
export const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('请提供有效的UUID')
];

export const fileIdValidation = [
  param('fileId')
    .isUUID()
    .withMessage('请提供有效的文件ID')
];

export const taskIdValidation = [
  param('taskId')
    .isUUID()
    .withMessage('请提供有效的任务ID')
];

export const configIdValidation = [
  param('configId')
    .isUUID()
    .withMessage('请提供有效的配置ID')
];
