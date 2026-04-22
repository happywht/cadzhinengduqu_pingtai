export interface ExtractionConfig {
  headers: Array<{
    name: string;
    description: string;
    example?: string;
  }>;
  examples: Array<{
    image: string;
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
  private apiKey = import.meta.env.VITE_ZHIPU_API_KEY || '';
  private baseURL = import.meta.env.VITE_ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/anthropic';
  private model = 'glm-4.6';
  private maxTokens = 2000;
  private maxRetries = 2;

  async extractFromImage(
    base64Image: string,
    config: ExtractionConfig
  ): Promise<ExtractionResult> {
    let lastError: string = '';
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this.buildPrompt(config);
        const body = {
          model: this.model,
          max_tokens: this.maxTokens,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Image } },
              { type: 'text', text: prompt }
            ]
          }]
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(`${this.baseURL}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.status === 429) {
          const wait = Math.pow(2, attempt) * 2000;
          await this.delay(wait);
          continue;
        }
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`API ${res.status}: ${err}`);
        }

        const message = await res.json();
        const data = this.parseResponse(message);
        if (Object.keys(data).length === 0) {
          return { success: true, data: {}, confidence: 0.1, usage: { input_tokens: message.usage?.input_tokens || 0, output_tokens: message.usage?.output_tokens || 0 } };
        }

        return {
          success: true,
          data,
          confidence: this.calculateConfidence(data, config),
          usage: { input_tokens: message.usage?.input_tokens || 0, output_tokens: message.usage?.output_tokens || 0 }
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '未知错误';
        lastError = msg;
        if (attempt < this.maxRetries && !msg.includes('API 4')) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }
    return { success: false, error: lastError };
  }

  async batchExtractFromImages(
    images: string[],
    config: ExtractionConfig,
    onProgress?: (current: number, total: number) => void
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];
    for (let i = 0; i < images.length; i++) {
      const result = await this.extractFromImage(images[i], config);
      results.push(result);
      onProgress?.(i + 1, images.length);
      if (i < images.length - 1) await this.delay(800);
    }
    return results;
  }

  private buildPrompt(config: ExtractionConfig): string {
    const fields = config.headers.map(h => `- ${h.name}: ${h.description}${h.example ? ` (示例值: ${h.example})` : ''}`).join('\n');
    const jsonFields = config.headers.map(h => `  "${h.name}": "提取的值或N/A"`).join(',\n');

    let prompt = `你是一个专业的CAD图纸信息提取助手。请从给定的图纸截图中精确提取以下字段信息。

## 需要提取的字段
${fields}

## 输出要求
1. 严格按照JSON格式输出，不要输出任何解释性文字
2. 如果某个字段在截图中无法识别，填写 "N/A"
3. 提取的数值请保留原图中的单位（如高程带"m"、管径带"DN"等）
4. 输出格式如下：
{"fields": {
${jsonFields}
}}`;

    if (config.instructions) {
      prompt += `\n\n## 特殊说明\n${config.instructions}`;
    }
    return prompt;
  }

  private parseResponse(message: unknown): Record<string, string> {
    try {
      const msg = message as { content?: Array<{ type: string; text?: string }> };
      const text = msg.content?.[0]?.text;
      if (!text) return {};

      // try code-fenced JSON first (more precise)
      const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        const parsed = JSON.parse(codeMatch[1]);
        return this.flattenResult(parsed);
      }

      // try raw JSON - find the first valid JSON object
      const depthScan = this.extractJsonFromText(text);
      if (depthScan) return this.flattenResult(depthScan);

      return {};
    } catch {
      return {};
    }
  }

  private extractJsonFromText(text: string): Record<string, unknown> | null {
    let start = -1;
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') { if (depth === 0) start = i; depth++; }
      if (text[i] === '}') {
        depth--;
        if (depth === 0 && start >= 0) {
          try { return JSON.parse(text.slice(start, i + 1)); } catch { /* continue */ }
          start = -1;
        }
      }
    }
    return null;
  }

  private flattenResult(parsed: Record<string, unknown>): Record<string, string> {
    // handle {"fields": {...}} wrapper
    const inner = (parsed.fields && typeof parsed.fields === 'object') ? parsed.fields as Record<string, unknown> : parsed;
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(inner)) {
      result[k] = String(v ?? 'N/A');
    }
    return result;
  }

  private calculateConfidence(data: Record<string, string>, config: ExtractionConfig): number {
    if (!data || Object.keys(data).length === 0) return 0;
    const total = config.headers.length;
    if (total === 0) return 0.5;
    let filled = 0;
    for (const h of config.headers) {
      const val = data[h.name];
      if (val && val !== 'N/A' && val !== 'n/a' && val.trim()) filled++;
    }
    return Math.round((filled / total) * 100) / 100;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const zhipuAIService = new ZhipuAIService();
