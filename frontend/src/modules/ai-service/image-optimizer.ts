export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataUrl: string;
}

export class ImageOptimizer {
  private static defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'image/jpeg'
  };

  /**
   * 压缩图片
   */
  static async compressImage(
    dataUrl: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'image/jpeg'
    } = mergedOptions;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');

          // 计算缩放比例
          let width = img.width;
          let height = img.height;
          const ratio = Math.min(maxWidth / width, maxHeight / height);

          if (ratio < 1) {
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建Canvas上下文'));
            return;
          }

          // 使用更好的图像质量设置
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL(format, quality);
          const originalSize = this.dataUrlSize(dataUrl);
          const compressedSize = this.dataUrlSize(compressedDataUrl);

          resolve({
            originalSize,
            compressedSize,
            compressionRatio: compressedSize / originalSize,
            dataUrl: compressedDataUrl
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }

  /**
   * 批量压缩图片
   */
  static async compressImages(
    dataUrls: string[],
    options: CompressionOptions = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    for (let i = 0; i < dataUrls.length; i++) {
      const result = await this.compressImage(dataUrls[i], options);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, dataUrls.length);
      }
    }

    return results;
  }

  /**
   * 检测空白区域
   */
  static async detectBlankArea(
    dataUrl: string,
    threshold: number = 0.05
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let contentPixels = 0;
        const sampleRate = 10; // 采样检查以提高性能

        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 非白色像素视为内容
          if (r < 250 || g < 250 || b < 250) {
            contentPixels++;
          }
        }

        const density = contentPixels / (data.length / (4 * sampleRate));
        resolve(density < threshold); // 内容密度小于阈值视为空白
      };

      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  /**
   * 计算图片大小（字节）
   */
  private static dataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1];
    return Math.ceil(base64.length * 0.75);
  }

  /**
   * 将Canvas转换为Blob（用于上传）
   */
  static canvasToBlob(
    canvas: HTMLCanvasElement,
    quality: number = 0.85,
    format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas转换Blob失败'));
          }
        },
        format,
        quality
      );
    });
  }

  /**
   * 智能压缩（自动选择最佳参数）
   */
  static async smartCompress(
    dataUrl: string,
    targetSizeKB: number = 500
  ): Promise<CompressionResult> {
    let quality = 0.9;
    let result: CompressionResult;

    // 二分查找最佳质量
    while (quality > 0.5) {
      result = await this.compressImage(dataUrl, { quality });

      if (result.compressedSize <= targetSizeKB * 1024) {
        return result;
      }

      quality -= 0.1;
    }

    // 如果质量降到0.5还是太大，使用最小质量
    return await this.compressImage(dataUrl, { quality: 0.5 });
  }

  /**
   * 图片预处理（增强对比度，便于AI识别）
   */
  static async preprocessImage(
    dataUrl: string,
    options: {
      contrast?: number;
      brightness?: number;
      threshold?: number;
    } = {}
  ): Promise<string> {
    const { contrast = 1.0, brightness = 1.0, threshold } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // 应用亮度
          data[i] *= brightness;
          data[i + 1] *= brightness;
          data[i + 2] *= brightness;

          // 应用对比度
          data[i] = ((data[i] - 128) * contrast) + 128;
          data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
          data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;

          // 应用阈值（二值化）
          if (threshold !== undefined) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const value = gray > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
          }

          // 限制在0-255范围
          data[i] = Math.max(0, Math.min(255, data[i]));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }

  /**
   * 获取图片信息
   */
  static async getImageInfo(dataUrl: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: this.dataUrlSize(dataUrl),
          format: dataUrl.split(';')[0].split(':')[1]
        });
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = dataUrl;
    });
  }
}

export const imageOptimizer = ImageOptimizer;
