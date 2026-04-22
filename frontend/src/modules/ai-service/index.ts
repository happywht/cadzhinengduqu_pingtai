/**
 * AI服务模块统一导出
 *
 * 提供智能提取功能，包括：
 * - 智谱AI集成
 * - 智能分块
 * - 图片优化
 */

export { ZhipuAIService, zhipuAIService } from './zhipu-ai.js';
export type { ExtractionConfig, ExtractionResult } from './zhipu-ai.js';

export { CADImageChunker, cadImageChunker } from './chunker.js';
export type { ChunkConfig, Chunk } from './chunker.js';

export { ImageOptimizer, imageOptimizer } from './image-optimizer.js';
export type { CompressionOptions, CompressionResult } from './image-optimizer.js';
