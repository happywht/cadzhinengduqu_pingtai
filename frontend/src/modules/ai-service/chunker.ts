export interface ChunkConfig {
  strategy: 'grid' | 'content-aware' | 'hybrid';
  chunkSize: number;
  overlap: number;
  maxChunks?: number;
}

export interface Chunk {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  density?: number;
}

export class CADImageChunker {
  /**
   * 智能分块策略
   */
  async intelligentChunk(
    canvas: HTMLCanvasElement,
    options: ChunkConfig
  ): Promise<Chunk[]> {
    const { width, height } = canvas;
    const { chunkSize = 800, overlap = 120, strategy = 'grid', maxChunks } = options;

    let chunks: Chunk[] = [];

    switch (strategy) {
      case 'grid':
        chunks = this.gridChunking(width, height, chunkSize, overlap);
        break;

      case 'content-aware':
        chunks = await this.contentAwareChunking(canvas, chunkSize, overlap);
        break;

      case 'hybrid':
        chunks = await this.hybridChunking(canvas, chunkSize, overlap);
        break;

      default:
        chunks = this.gridChunking(width, height, chunkSize, overlap);
    }

    // 应用最大块数限制
    if (maxChunks && chunks.length > maxChunks) {
      chunks = chunks
        .sort((a, b) => (b.density || 0) - (a.density || 0))
        .slice(0, maxChunks);
    }

    return chunks;
  }

  /**
   * 网格分块
   */
  private gridChunking(
    width: number,
    height: number,
    chunkSize: number,
    overlap: number
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const cols = Math.ceil(width / chunkSize);
    const rows = Math.ceil(height / chunkSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.max(0, col * chunkSize - (col > 0 ? overlap : 0));
        const y = Math.max(0, row * chunkSize - (row > 0 ? overlap : 0));
        const w = Math.min(chunkSize + (col < cols - 1 ? overlap * 2 : 0), width - x);
        const h = Math.min(chunkSize + (row < rows - 1 ? overlap * 2 : 0), height - y);

        chunks.push({
          id: `grid-${row}-${col}`,
          x, y, width: w, height: h,
          density: 1.0 // 网格分块默认密度为1
        });
      }
    }

    return chunks;
  }

  /**
   * 内容感知分块（检测空白区域）
   */
  private async contentAwareChunking(
    canvas: HTMLCanvasElement,
    chunkSize: number,
    overlap: number
  ): Promise<Chunk[]> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const { width, height } = canvas;

    // 分析内容密度
    const blockSize = 50;
    const densityMap = this.buildDensityMap(ctx, width, height, blockSize);

    // 基于密度生成分块
    const chunks: Chunk[] = [];
    const cols = Math.ceil(width / chunkSize);
    const rows = Math.ceil(height / chunkSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.max(0, col * chunkSize - (col > 0 ? overlap : 0));
        const y = Math.max(0, row * chunkSize - (row > 0 ? overlap : 0));
        const w = Math.min(chunkSize + (col < cols - 1 ? overlap * 2 : 0), width - x);
        const h = Math.min(chunkSize + (row < rows - 1 ? overlap * 2 : 0), height - y);

        // 计算该区域的平均密度
        const density = this.calculateRegionDensity(
          densityMap,
          x, y, w, h,
          blockSize, width, height
        );

        // 跳过低密度区域（空白区域）
        if (density > 0.05) {
          chunks.push({
            id: `content-${row}-${col}`,
            x, y, width: w, height: h,
            density
          });
        }
      }
    }

    return chunks;
  }

  /**
   * 混合策略
   */
  private async hybridChunking(
    canvas: HTMLCanvasElement,
    chunkSize: number,
    overlap: number
  ): Promise<Chunk[]> {
    // 先用粗网格扫描，再用内容感知细化
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const { width, height } = canvas;
    const coarseSize = chunkSize * 2;
    const coarseChunks = this.gridChunking(width, height, coarseSize, overlap);

    const refinedChunks: Chunk[] = [];

    for (const coarseChunk of coarseChunks) {
      // 创建临时canvas分析该区域
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = coarseChunk.width;
      tempCanvas.height = coarseChunk.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) continue;

      tempCtx.drawImage(
        canvas,
        coarseChunk.x, coarseChunk.y, coarseChunk.width, coarseChunk.height,
        0, 0, coarseChunk.width, coarseChunk.height
      );

      // 分析密度
      const density = this.calculateCanvasDensity(tempCanvas);

      if (density > 0.1) {
        // 高密度区域，使用更小的分块
        const subChunks = await this.contentAwareChunking(tempCanvas, chunkSize, overlap);
        for (const subChunk of subChunks) {
          refinedChunks.push({
            ...subChunk,
            id: `${coarseChunk.id}-${subChunk.id}`,
            x: coarseChunk.x + subChunk.x,
            y: coarseChunk.y + subChunk.y
          });
        }
      } else if (density > 0.05) {
        // 中等密度区域，保持当前分块
        refinedChunks.push({
          ...coarseChunk,
          id: `hybrid-${coarseChunk.id}`,
          density
        });
      }
      // 低密度区域跳过
    }

    return refinedChunks;
  }

  /**
   * 构建内容密度图
   */
  private buildDensityMap(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    blockSize: number
  ): Float32Array {
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const densityMap = new Float32Array(cols * rows);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const imageData = ctx.getImageData(
          x * blockSize,
          y * blockSize,
          Math.min(blockSize, width - x * blockSize),
          Math.min(blockSize, height - y * blockSize)
        );

        const density = this.calculateDensity(imageData);
        densityMap[y * cols + x] = density;
      }
    }

    return densityMap;
  }

  /**
   * 计算区域内容密度
   */
  private calculateDensity(imageData: ImageData): number {
    const data = imageData.data;
    let contentPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // 非白色像素视为内容
      if (r < 250 || g < 250 || b < 250) {
        contentPixels++;
      }
    }

    return contentPixels / (data.length / 4);
  }

  /**
   * 计算区域平均密度
   */
  private calculateRegionDensity(
    densityMap: Float32Array,
    x: number,
    y: number,
    width: number,
    height: number,
    blockSize: number,
    canvasWidth: number,
    canvasHeight: number
  ): number {
    const cols = Math.ceil(canvasWidth / blockSize);
    const startCol = Math.floor(x / blockSize);
    const endCol = Math.ceil((x + width) / blockSize);
    const startRow = Math.floor(y / blockSize);
    const endRow = Math.ceil((y + height) / blockSize);

    let totalDensity = 0;
    let count = 0;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        if (row * cols + col < densityMap.length) {
          totalDensity += densityMap[row * cols + col];
          count++;
        }
      }
    }

    return count > 0 ? totalDensity / count : 0;
  }

  /**
   * 计算canvas密度
   */
  private calculateCanvasDensity(canvas: HTMLCanvasElement): number {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.calculateDensity(imageData);
  }

  /**
   * 提取指定区域的图片
   */
  extractChunk(
    canvas: HTMLCanvasElement,
    chunk: Chunk
  ): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = chunk.width;
    tempCanvas.height = chunk.height;

    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(
      canvas,
      chunk.x, chunk.y, chunk.width, chunk.height,
      0, 0, chunk.width, chunk.height
    );

    return tempCanvas.toDataURL('image/jpeg', 0.85);
  }

  /**
   * 批量提取所有分块的图片
   */
  extractAllChunks(
    canvas: HTMLCanvasElement,
    chunks: Chunk[]
  ): string[] {
    return chunks.map(chunk => this.extractChunk(canvas, chunk));
  }
}

export const cadImageChunker = new CADImageChunker();
