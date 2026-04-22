import anthropic from '@anthropic-ai/sdk';

const client = new anthropic.Anthropic({
  apiKey: '72695ca1e76e4a03be87fd7a76d20f11.3KGSHtrwMj0EPxeJ',
  baseURL: 'https://open.bigmodel.cn/api/anthropic'
});

export interface ExtractionConfig {
  headers: Array<{
    name: string;
    description: string;
    example?: string;
  }>;
  examples: Array<{
    image: string;  // base64图片
    data: Record<string, string>;
  }>;
  instructions?: string;
}

export interface ExtractionResult {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
  confidence?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ZhipuAIService {
  private model = 'glm-4.6';
  private maxTokens = 2000;

  /**
   * 从图片中提取信息
   */
  async extractFromImage(
    base64Image: string,
    config: ExtractionConfig
  ): Promise<ExtractionResult> {
    try {
      const prompt = this.buildPrompt(config);

      const message = await client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      // 解析AI响应
      const data = this.parseResponse(message);

      return {
        success: true,
        data,
        confidence: this.calculateConfidence(message),
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens
        }
      };
    } catch (error: any) {
      console.error('AI提取失败:', error);
      return {
        success: false,
        error: error.message || 'AI提取失败'
      };
    }
  }

  /**
   * 批量提取（支持多个图片）
   */
  async batchExtractFromImages(
    images: string[],
    config: ExtractionConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const result = await this.extractFromImage(images[i], config);
      results.push(result);

      if (onProgress) {
        onProgress(i + 1, images.length);
      }

      // 添加延迟避免API限流
      if (i < images.length - 1) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * 构建Few-shot提示词
   */
  private buildPrompt(config: ExtractionConfig): string {
    let prompt = `你是一个专业的CAD图纸信息提取助手。请从图纸中提取以下信息：\n\n`;

    prompt += `## 提取字段\n`;
    config.headers.forEach(h => {
      prompt += `- **${h.name}**: ${h.description}${h.example ? ` (示例: ${h.example})` : ''}\n`;
    });

    if (config.examples.length > 0) {
      prompt += `\n## 参考示例\n`;
      config.examples.forEach((ex, idx) => {
        prompt += `\n### 示例${idx + 1}\n`;
        Object.entries(ex.data).forEach(([key, value]) => {
          prompt += `- ${key}: ${value}\n`;
        });
      });
    }

    if (config.instructions) {
      prompt += `\n## 特殊说明\n${config.instructions}\n`;
    }

    prompt += `\n## 输出格式\n请以JSON格式返回提取结果，格式如下：\n`;
    prompt += `{\n`;
    config.headers.forEach((h, idx) => {
      prompt += `  "${h.name}": "提取的值",${idx < config.headers.length - 1 ? '' : ''}\n`;
    });
    prompt += `}\n`;

    return prompt;
  }

  /**
   * 解析AI响应
   */
  private parseResponse(message: any): Record<string, string> {
    try {
      const content = message.content[0];
      if (content.type === 'text') {
        const text = content.text;

        // 尝试提取JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }

        // 尝试提取代码块中的JSON
        const codeMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeMatch) {
          return JSON.parse(codeMatch[1]);
        }
      }

      throw new Error('无法解析AI响应');
    } catch (error) {
      console.error('解析失败:', error);
      return {};
    }
  }

  /**
   * 计算置信度（基于token使用情况）
   */
  private calculateConfidence(message: any): number {
    // 简单的置信度计算逻辑
    const outputRatio = message.usage.output_tokens / this.maxTokens;
    return Math.min(0.99, 0.7 + outputRatio * 0.3);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.extractFromImage(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        {
          headers: [{ name: 'test', description: '测试字段' }],
          examples: [],
          instructions: '这是一个测试请求'
        }
      );
      return result.success;
    } catch {
      return false;
    }
  }
}

export const zhipuAIService = new ZhipuAIService();
