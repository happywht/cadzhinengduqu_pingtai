import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ExtractionConfig, AITask } from '../types/index.js';
import prisma from '../utils/database.js';
import logger from '../utils/logger.js';
import { AIService } from './AIService.js';

// Redis连接配置
const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

// 创建任务队列
export const extractionQueue = new Queue('cad-extraction', { connection });

// 任务处理服务
export class TaskQueueService {
  private aiService: AIService;
  private worker: Worker | null = null;

  constructor() {
    this.aiService = new AIService();
  }

  // 启动任务处理器
  async startWorker(): Promise<void> {
    if (this.worker) {
      logger.warn('Worker已在运行中');
      return;
    }

    this.worker = new Worker(
      'cad-extraction',
      async (job: Job) => {
        logger.info(`处理任务: ${job.id}`);
        return await this.processJob(job);
      },
      { connection }
    );

    this.worker.on('completed', (job: Job, result: any) => {
      logger.info(`任务完成: ${job.id}`, result);
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      logger.error(`任务失败: ${job?.id}`, error);
    });

    logger.info('Task Queue Worker已启动');
  }

  // 停止任务处理器
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      logger.info('Task Queue Worker已停止');
    }
  }

  // 处理单个任务
  private async processJob(job: Job): Promise<any> {
    const { taskId, configId, chunkIndex, chunk } = job.data;

    try {
      // 更新任务状态为处理中
      await prisma.aITask.update({
        where: { id: taskId },
        data: { status: 'processing' }
      });

      // 获取配置信息
      const config = await prisma.extractionConfig.findUnique({
        where: { id: configId },
        include: { cadFile: true }
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      let result;

      // 如果是分块任务
      if (chunk !== undefined) {
        result = await this.processChunk(taskId, config, chunkIndex, chunk);
      } else {
        // 处理整个CAD文件
        const results = await this.aiService.processExtraction(config, taskId);
        result = results;
      }

      // 检查是否所有分块都已完成
      const currentTask = await prisma.aITask.findUnique({
        where: { id: taskId }
      });

      if (currentTask && currentTask.processedChunks >= currentTask.totalChunks) {
        // 更新任务状态为完成
        await prisma.aITask.update({
          where: { id: taskId },
          data: {
            status: 'completed',
            progress: 100,
            completedAt: new Date()
          }
        });
      }

      return { success: true, result };
    } catch (error) {
      // 更新任务状态为失败
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : '未知错误'
        }
      });

      throw error;
    }
  }

  // 处理单个分块
  private async processChunk(
    taskId: string,
    config: any,
    chunkIndex: number,
    chunk: any
  ): Promise<any> {
    try {
      logger.info(`处理分块: ${taskId} - ${chunkIndex}`);

      // 调用AI服务提取数据
      const extractedData = await this.aiService.extractFromImage(
        chunk.imageUrl,
        config.headers,
        config.exampleData
      );

      // 保存结果到数据库
      const result = await prisma.extractionResult.create({
        data: {
          taskId,
          chunkIndex,
          imageUrl: chunk.imageUrl || '',
          data: extractedData.data,
          confidence: extractedData.confidence,
          status: 'pending'
        }
      });

      // 更新任务进度
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          processedChunks: { increment: 1 },
          progress: {
            increment: Math.round(100 / (chunk.totalChunks || 10))
          }
        }
      });

      logger.info(`分块处理完成: ${taskId} - ${chunkIndex}`);

      return result;
    } catch (error) {
      logger.error(`分块处理失败: ${taskId} - ${chunkIndex}`, error);
      throw error;
    }
  }

  // 添加提取任务到队列
  async addExtractionTask(taskId: string, configId: string): Promise<void> {
    await extractionQueue.add(
      'extract',
      { taskId, configId },
      {
        jobId: taskId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );

    logger.info(`任务已添加到队列: ${taskId}`);
  }

  // 批量添加提取任务到队列
  async addBulkExtractionTasks(
    taskId: string,
    configId: string,
    chunks: any[]
  ): Promise<void> {
    // 为每个分块创建一个独立的任务
    const jobs = chunks.map((chunk, index) => ({
      name: `chunk-${index}`,
      data: {
        taskId,
        configId,
        chunkIndex: index,
        chunk
      },
      opts: {
        jobId: `${taskId}-chunk-${index}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        delay: index * 1000 // 错开执行时间，避免API限流
      }
    }));

    await extractionQueue.addBulk(jobs);
    logger.info(`批量任务已添加到队列: ${taskId}, 包含 ${chunks.length} 个分块`);
  }

  // 获取队列状态
  async getQueueStats(): Promise<any> {
    const waiting = await extractionQueue.getWaiting();
    const active = await extractionQueue.getActive();
    const completed = await extractionQueue.getCompleted();
    const failed = await extractionQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }

  // 清理完成的任务
  async cleanCompletedJobs(maxAge = 3600000): Promise<void> {
    await extractionQueue.clean(maxAge, 100, 'completed');
    await extractionQueue.clean(maxAge, 100, 'failed');
    logger.info('已清理完成的任务');
  }
}

// 导出单例实例
export const taskQueueService = new TaskQueueService();
