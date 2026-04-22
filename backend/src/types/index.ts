import { Request } from 'express';

// 用户相关类型
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

// JWT载荷类型
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// 扩展Express Request类型
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// 项目相关类型
export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
}

// CAD文件相关类型
export interface CADFile {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  parsedData?: any;
  layers?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface LayerInfo {
  name: string;
  color: number;
  visible: boolean;
  frozen: boolean;
}

// 提取配置相关类型
export interface ExtractionConfig {
  id: string;
  cadFileId: string;
  name: string;
  headers: string[];
  legendImage?: string;
  exampleImage?: string;
  exampleData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConfigDTO {
  cadFileId: string;
  name: string;
  headers: string[];
  legendImage?: string;
  exampleImage?: string;
  exampleData?: any;
}

// AI任务相关类型
export interface AITask {
  id: string;
  configId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalChunks: number;
  processedChunks: number;
  progress: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateTaskDTO {
  configId: string;
}

export interface TaskStatusResponse {
  id: string;
  status: string;
  progress: number;
  totalChunks: number;
  processedChunks: number;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// 提取结果相关类型
export interface ExtractionResult {
  id: string;
  taskId: string;
  chunkIndex: number;
  imageUrl: string;
  data: any;
  confidence?: number;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  createdAt: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 错误类型
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 文件上传类型
export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}
