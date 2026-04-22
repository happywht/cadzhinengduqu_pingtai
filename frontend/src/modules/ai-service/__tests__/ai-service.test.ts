/**
 * AI服务模块测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZhipuAIService } from '../zhipu-ai';
import { CADImageChunker } from '../chunker';
import { ImageOptimizer } from '../image-optimizer';

// Mock Canvas
const createMockCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'black';
    ctx.fillRect(100, 100, 200, 100);
  }

  return canvas;
};

describe('ZhipuAIService', () => {
  let aiService: ZhipuAIService;

  beforeEach(() => {
    aiService = new ZhipuAIService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extractFromImage', () => {
    it('应该成功提取图片信息', async () => {
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const config = {
        headers: [
          { name: 'test', description: '测试字段' }
        ],
        examples: [],
        instructions: '测试'
      };

      const result = await aiService.extractFromImage(mockBase64, config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('应该处理Few-shot示例', async () => {
      const config = {
        headers: [
          {
            name: '字段1',
            description: '描述1',
            example: '示例值1'
          }
        ],
        examples: [
          {
            image: 'base64...',
            data: { '字段1': '示例值1' }
          }
        ]
      };

      const result = await aiService.extractFromImage('base64...', config);

      expect(result.success).toBe(true);
    });

    it('应该返回token使用统计', async () => {
      const config = {
        headers: [{ name: 'test', description: '测试' }],
        examples: []
      };

      const result = await aiService.extractFromImage('base64...', config);

      if (result.success) {
        expect(result.usage).toBeDefined();
        expect(result.usage?.input_tokens).toBeGreaterThan(0);
      }
    });
  });

  describe('batchExtractFromImages', () => {
    it('应该批量处理多个图片', async () => {
      const images = ['base64...', 'base64...', 'base64...'];
      const config = {
        headers: [{ name: 'test', description: '测试' }],
        examples: []
      };

      const progressCallback = vi.fn();
      const results = await aiService.batchExtractFromImages(
        images,
        config,
        progressCallback
      );

      expect(results).toHaveLength(3);
      expect(progressCallback).toHaveBeenCalledTimes(3);
    });
  });
});

describe('CADImageChunker', () => {
  let chunker: CADImageChunker;

  beforeEach(() => {
    chunker = new CADImageChunker();
  });

  describe('intelligentChunk', () => {
    it('应该使用网格策略分块', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunks = await chunker.intelligentChunk(canvas, {
        strategy: 'grid',
        chunkSize: 800,
        overlap: 120
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].id).toContain('grid');
    });

    it('应该使用内容感知策略分块', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunks = await chunker.intelligentChunk(canvas, {
        strategy: 'content-aware',
        chunkSize: 800,
        overlap: 120
      });

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.density).toBeGreaterThan(0);
      });
    });

    it('应该使用混合策略分块', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunks = await chunker.intelligentChunk(canvas, {
        strategy: 'hybrid',
        chunkSize: 800,
        overlap: 120
      });

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('应该限制最大块数', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunks = await chunker.intelligentChunk(canvas, {
        strategy: 'grid',
        chunkSize: 800,
        overlap: 120,
        maxChunks: 3
      });

      expect(chunks.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractChunk', () => {
    it('应该提取指定区域的图片', () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunk = {
        id: 'test-0',
        x: 100,
        y: 100,
        width: 800,
        height: 600
      };

      const dataUrl = chunker.extractChunk(canvas, chunk);

      expect(dataUrl).toBeTruthy();
      expect(dataUrl.startsWith('data:image/jpeg')).toBe(true);
    });

    it('应该批量提取所有分块', () => {
      const canvas = createMockCanvas(2000, 1500);
      const chunks = [
        { id: '0', x: 0, y: 0, width: 800, height: 600 },
        { id: '1', x: 800, y: 0, width: 800, height: 600 }
      ];

      const dataUrls = chunker.extractAllChunks(canvas, chunks);

      expect(dataUrls).toHaveLength(2);
      dataUrls.forEach(url => {
        expect(url).toBeTruthy();
      });
    });
  });
});

describe('ImageOptimizer', () => {
  describe('compressImage', () => {
    it('应该压缩图片', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const dataUrl = canvas.toDataURL('image/png');

      const result = await ImageOptimizer.compressImage(dataUrl);

      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.compressionRatio).toBeLessThan(1);
      expect(result.dataUrl).toBeTruthy();
    });

    it('应该使用自定义压缩参数', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const dataUrl = canvas.toDataURL('image/png');

      const result = await ImageOptimizer.compressImage(dataUrl, {
        maxWidth: 1000,
        maxHeight: 800,
        quality: 0.7
      });

      expect(result.dataUrl).toBeTruthy();
    });

    it('应该批量压缩图片', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const dataUrls = [
        canvas.toDataURL('image/png'),
        canvas.toDataURL('image/png')
      ];

      const progressCallback = vi.fn();
      const results = await ImageOptimizer.compressImages(
        dataUrls,
        {},
        progressCallback
      );

      expect(results).toHaveLength(2);
      expect(progressCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('detectBlankArea', () => {
    it('应该检测空白区域', async () => {
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = 800;
      blankCanvas.height = 600;
      const ctx = blankCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
      }

      const dataUrl = blankCanvas.toDataURL();
      const isBlank = await ImageOptimizer.detectBlankArea(dataUrl);

      expect(isBlank).toBe(true);
    });

    it('应该识别非空白区域', async () => {
      const canvas = createMockCanvas(800, 600);
      const dataUrl = canvas.toDataURL();
      const isBlank = await ImageOptimizer.detectBlankArea(dataUrl);

      expect(isBlank).toBe(false);
    });

    it('应该使用自定义阈值', async () => {
      const canvas = createMockCanvas(800, 600);
      const dataUrl = canvas.toDataURL();

      const isBlank1 = await ImageOptimizer.detectBlankArea(dataUrl, 0.01);
      const isBlank2 = await ImageOptimizer.detectBlankArea(dataUrl, 0.1);

      expect(isBlank1).not.toBe(isBlank2);
    });
  });

  describe('smartCompress', () => {
    it('应该达到目标大小', async () => {
      const canvas = createMockCanvas(2000, 1500);
      const dataUrl = canvas.toDataURL('image/png');

      const result = await ImageOptimizer.smartCompress(dataUrl, 100);

      expect(result.compressedSize).toBeLessThanOrEqual(100 * 1024);
    });
  });

  describe('preprocessImage', () => {
    it('应该增强图片对比度', async () => {
      const canvas = createMockCanvas(800, 600);
      const dataUrl = canvas.toDataURL();

      const processed = await ImageOptimizer.preprocessImage(dataUrl, {
        contrast: 1.5,
        brightness: 1.2
      });

      expect(processed).toBeTruthy();
      expect(processed.startsWith('data:image/png')).toBe(true);
    });

    it('应该二值化图片', async () => {
      const canvas = createMockCanvas(800, 600);
      const dataUrl = canvas.toDataURL();

      const processed = await ImageOptimizer.preprocessImage(dataUrl, {
        threshold: 128
      });

      expect(processed).toBeTruthy();
    });
  });

  describe('getImageInfo', () => {
    it('应该返回图片信息', async () => {
      const canvas = createMockCanvas(800, 600);
      const dataUrl = canvas.toDataURL();

      const info = await ImageOptimizer.getImageInfo(dataUrl);

      expect(info.width).toBe(800);
      expect(info.height).toBe(600);
      expect(info.size).toBeGreaterThan(0);
      expect(info.format).toContain('image/png');
    });
  });
});
