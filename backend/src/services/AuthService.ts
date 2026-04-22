import bcrypt from 'bcryptjs';
import { User, CreateUserDTO, LoginDTO, JWTPayload } from '../types/index.js';
import prisma from '../utils/database.js';
import { generateToken } from '../utils/jwt.js';
import { AppError } from '../types/index.js';
import logger from '../utils/logger.js';

export class AuthService {
  // 注册新用户
  async register(dto: CreateUserDTO): Promise<{ user: Omit<User, 'password'>; token: string }> {
    try {
      // 检查邮箱是否已存在
      const existingEmail = await prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (existingEmail) {
        throw new AppError(409, '该邮箱已被注册');
      }

      // 检查用户名是否已存在
      const existingUsername = await prisma.user.findUnique({
        where: { username: dto.username }
      });

      if (existingUsername) {
        throw new AppError(409, '该用户名已被使用');
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: hashedPassword
        }
      });

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };

      const token = generateToken(payload);

      logger.info(`新用户注册成功: ${user.username}`);

      // 返回用户信息（不包含密码）和令牌
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('用户注册失败:', error);
      throw error;
    }
  }

  // 用户登录
  async login(dto: LoginDTO): Promise<{ user: Omit<User, 'password'>; token: string }> {
    try {
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email: dto.email }
      });

      if (!user) {
        throw new AppError(401, '邮箱或密码错误');
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new AppError(401, '邮箱或密码错误');
      }

      // 生成JWT令牌
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        username: user.username
      };

      const token = generateToken(payload);

      logger.info(`用户登录成功: ${user.username}`);

      // 返回用户信息（不包含密码）和令牌
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('用户登录失败:', error);
      throw error;
    }
  }

  // 获取用户信息
  async getUserById(userId: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, '用户不存在');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 更新用户信息
  async updateUser(
    userId: string,
    data: { username?: string; email?: string }
  ): Promise<Omit<User, 'password'>> {
    try {
      // 如果更新用户名，检查是否已被使用
      if (data.username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: { id: userId }
          }
        });

        if (existingUsername) {
          throw new AppError(409, '该用户名已被使用');
        }
      }

      // 如果更新邮箱，检查是否已被使用
      if (data.email) {
        const existingEmail = await prisma.user.findFirst({
          where: {
            email: data.email,
            NOT: { id: userId }
          }
        });

        if (existingEmail) {
          throw new AppError(409, '该邮箱已被使用');
        }
      }

      // 更新用户
      const user = await prisma.user.update({
        where: { id: userId },
        data
      });

      logger.info(`用户信息更新成功: ${user.username}`);

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error('用户信息更新失败:', error);
      throw error;
    }
  }

  // 修改密码
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // 获取用户
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError(404, '用户不存在');
      }

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        throw new AppError(401, '原密码错误');
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`用户密码修改成功: ${user.username}`);
    } catch (error) {
      logger.error('用户密码修改失败:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
