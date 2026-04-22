import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDir();
  }

  // 确保上传目录存在
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`创建上传目录: ${this.uploadDir}`);
    }
  }

  // 保存文件
  async saveFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.promises.writeFile(filePath, buffer);
      logger.info(`文件保存成功: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('文件保存失败:', error);
      throw new Error('文件保存失败');
    }
  }

  // 删除文件
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);

      // 安全检查：确保文件在上传目录内
      if (!fullPath.startsWith(path.resolve(this.uploadDir))) {
        throw new Error('无权访问该文件');
      }

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info(`文件删除成功: ${fullPath}`);
      }
    } catch (error) {
      logger.error('文件删除失败:', error);
      throw new Error('文件删除失败');
    }
  }

  // 检查文件是否存在
  fileExists(filePath: string): boolean {
    const fullPath = path.resolve(filePath);
    return fs.existsSync(fullPath) && fullPath.startsWith(path.resolve(this.uploadDir));
  }

  // 获取文件大小
  getFileSize(filePath: string): number {
    const fullPath = path.resolve(filePath);

    if (!this.fileExists(filePath)) {
      throw new Error('文件不存在');
    }

    const stats = fs.statSync(fullPath);
    return stats.size;
  }

  // 获取文件信息
  getFileInfo(filePath: string): { size: number; created: Date } {
    const fullPath = path.resolve(filePath);

    if (!this.fileExists(filePath)) {
      throw new Error('文件不存在');
    }

    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime
    };
  }

  // 生成唯一文件名
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);

    return `${basename}-${timestamp}-${random}${ext}`;
  }

  // 获取文件URL路径
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  // 清理过期文件
  async cleanupOldFiles(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const files = await fs.promises.readdir(this.uploadDir);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.uploadDir, file);
      const stats = await fs.promises.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }

    logger.info(`清理了 ${deletedCount} 个过期文件`);
    return deletedCount;
  }
}

export const storageService = new StorageService();
