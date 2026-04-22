<template>
  <div class="ai-extraction-panel">
    <!-- 配置区域 -->
    <div class="config-section">
      <h3 class="section-title">AI智能提取配置</h3>

      <!-- 提取模板 -->
      <div class="form-group">
        <label>预设模板</label>
        <select v-model="selectedTemplate" @change="loadTemplate">
          <option value="">-- 选择模板 --</option>
          <option value="pipeline">管线起止点表</option>
          <option value="column">建筑柱表</option>
          <option value="coordinate">基础坐标表</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <!-- 提取字段配置 -->
      <div class="form-group">
        <label>提取字段</label>
        <div class="headers-list">
          <div v-for="(header, index) in headers" :key="index" class="header-item">
            <input
              v-model="header.name"
              placeholder="字段名称"
              class="input-field"
            />
            <input
              v-model="header.description"
              placeholder="字段描述"
              class="input-field"
            />
            <input
              v-model="header.example"
              placeholder="示例值"
              class="input-field small"
            />
            <button @click="removeHeader(index)" class="btn-icon">✕</button>
          </div>
          <button @click="addHeader" class="btn btn-outline btn-sm">
            + 添加字段
          </button>
        </div>
      </div>

      <!-- Few-shot示例 -->
      <div class="form-group">
        <label>示例图片（可选）</label>
        <div v-if="exampleImage" class="example-preview">
          <img :src="exampleImage" alt="示例图片" />
          <button @click="clearExample" class="btn btn-outline btn-sm">
            清除示例
          </button>
        </div>
        <button v-else @click="captureExample" class="btn btn-outline btn-sm">
          📷 截取图例示例
        </button>
      </div>

      <!-- 特殊说明 -->
      <div class="form-group">
        <label>特殊说明（可选）</label>
        <textarea
          v-model="instructions"
          placeholder="例如：请注意识别表格中的合并单元格..."
          rows="3"
          class="textarea-field"
        ></textarea>
      </div>

      <!-- 分块策略 -->
      <div class="form-group">
        <label>分块策略</label>
        <div class="strategy-options">
          <label class="radio-option">
            <input
              type="radio"
              v-model="chunkStrategy"
              value="grid"
            />
            网格分块（快速）
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="chunkStrategy"
              value="content-aware"
            />
            内容感知（精准）
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="chunkStrategy"
              value="hybrid"
            />
            混合策略（推荐）
          </label>
        </div>
      </div>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <button
        @click="startExtraction"
        :disabled="isExtracting || !canExtract"
        class="btn btn-primary btn-block"
      >
        {{ isExtracting ? '提取中...' : '🚀 开始批量提取' }}
      </button>

      <button
        v-if="isExtracting"
        @click="cancelExtraction"
        class="btn btn-danger btn-block"
      >
        ⏹ 取消提取
      </button>
    </div>

    <!-- 进度展示 -->
    <div v-if="isExtracting || extractionResults.length > 0" class="progress-section">
      <h3 class="section-title">提取进度</h3>

      <ExtractionProgress
        :phase="extractionPhase"
        :progress="extractionProgress"
        :total="totalChunks"
        :current="processedChunks"
        :results="extractionResults"
      />

      <!-- Token使用统计 -->
      <div v-if="tokenStats" class="token-stats">
        <h4>API使用统计</h4>
        <div class="stat-item">
          <span>输入Token:</span>
          <span>{{ tokenStats.inputTokens }}</span>
        </div>
        <div class="stat-item">
          <span>输出Token:</span>
          <span>{{ tokenStats.outputTokens }}</span>
        </div>
        <div class="stat-item">
          <span>预估成本:</span>
          <span>¥{{ tokenStats.estimatedCost.toFixed(4) }}</span>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="extractionResults.length > 0" class="results-section">
      <h3 class="section-title">提取结果</h3>

      <div class="results-actions">
        <button @click="exportResults" class="btn btn-outline btn-sm">
          📥 导出Excel
        </button>
        <button @click="clearResults" class="btn btn-outline btn-sm">
          🗑 清空结果
        </button>
      </div>

      <div class="results-grid">
        <div
          v-for="(result, index) in extractionResults"
          :key="index"
          class="result-card"
        >
          <div class="result-header">
            <h4>区域 {{ index + 1 }}</h4>
            <span class="confidence">
              置信度: {{ (result.confidence * 100).toFixed(1) }}%
            </span>
          </div>

          <div class="result-content">
            <table class="result-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>提取值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(value, key) in result.data" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ZhipuAIService, type ExtractionConfig } from '@/modules/ai-service';
import { CADImageChunker } from '@/modules/ai-service/chunker';
import { ImageOptimizer } from '@/modules/ai-service/image-optimizer';
import ExtractionProgress from './ExtractionProgress.vue';

const aiService = new ZhipuAIService();
const chunker = new CADImageChunker();

// 状态
const selectedTemplate = ref('');
const headers = ref<Array<{ name: string; description: string; example: string }>>([]);
const exampleImage = ref('');
const instructions = ref('');
const chunkStrategy = ref<'grid' | 'content-aware' | 'hybrid'>('hybrid');

const isExtracting = ref(false);
const extractionPhase = ref('');
const extractionProgress = ref(0);
const totalChunks = ref(0);
const processedChunks = ref(0);
const extractionResults = ref<any[]>([]);
const tokenStats = ref<any>(null);

// 计算属性
const canExtract = computed(() => {
  return headers.value.length > 0;
});

// 模板定义
const templates: Record<string, any> = {
  pipeline: {
    headers: [
      { name: '起始点号', description: '管线的起始节点编号', example: 'J1' },
      { name: '结束点号', description: '管线的结束节点编号', example: 'J2' },
      { name: '起始高程', description: '起始点的标高值（米）', example: '123.45' },
      { name: '结束高程', description: '结束点的标高值（米）', example: '122.80' },
      { name: '管径', description: '管道直径（毫米）', example: 'DN300' },
      { name: '管材', description: '管道材质', example: 'PE管' }
    ]
  },
  column: {
    headers: [
      { name: '柱编号', description: '柱子的编号标识', example: 'KZ-1' },
      { name: '截面尺寸', description: '柱子截面尺寸（mm）', example: '500×500' },
      { name: '混凝土等级', description: '混凝土强度等级', example: 'C30' },
      { name: '纵筋', description: '纵向钢筋配置', example: '12Φ20' },
      { name: '箍筋', description: '箍筋配置', example: 'Φ8@100' }
    ]
  },
  coordinate: {
    headers: [
      { name: '基础编号', description: '基础的编号标识', example: 'J-1' },
      { name: 'X坐标', description: 'X方向坐标值（米）', example: '1234.567' },
      { name: 'Y坐标', description: 'Y方向坐标值（米）', example: '5678.901' },
      { name: '基底高程', description: '基础底面标高（米）', example: '120.00' }
    ]
  }
};

// 加载模板
const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    headers.value = [...templates[selectedTemplate.value].headers];
  }
};

// 添加字段
const addHeader = () => {
  headers.value.push({
    name: '',
    description: '',
    example: ''
  });
};

// 移除字段
const removeHeader = (index: number) => {
  headers.value.splice(index, 1);
};

// 截取示例
const captureExample = () => {
  // TODO: 实现框选功能
  alert('请框选图例区域作为示例');
};

// 清除示例
const clearExample = () => {
  exampleImage.value = '';
};

// 开始提取
const startExtraction = async () => {
  if (!canExtract.value) return;

  isExtracting.value = true;
  extractionResults.value = [];
  tokenStats.value = null;

  try {
    // 1. 获取CAD画布
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      throw new Error('未找到CAD画布，请先上传CAD文件');
    }

    // 2. 智能分块
    extractionPhase.value = '正在分析图纸结构...';
    extractionProgress.value = 10;

    const chunks = await chunker.intelligentChunk(canvas as HTMLCanvasElement, {
      strategy: chunkStrategy.value,
      chunkSize: 800,
      overlap: 120
    });

    totalChunks.value = chunks.length;
    processedChunks.value = 0;

    console.log(`生成了 ${chunks.length} 个分块`);

    // 3. 批量提取
    extractionPhase.value = `准备处理 ${chunks.length} 个区域...`;
    extractionProgress.value = 20;

    const config: ExtractionConfig = {
      headers: headers.value.map(h => ({
        name: h.name,
        description: h.description,
        example: h.example
      })),
      examples: exampleImage.value ? [{
        image: exampleImage.value,
        data: headers.value.reduce((acc, h) => {
          if (h.example) {
            acc[h.name] = h.example;
          }
          return acc;
        }, {} as Record<string, string>)
      }] : [],
      instructions: instructions.value || undefined
    };

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // 提取分块图片
      const chunkImage = chunker.extractChunk(canvas as HTMLCanvasElement, chunk);

      // 压缩图片
      const compressed = await ImageOptimizer.compressImage(chunkImage);

      // 检测空白
      const isBlank = await ImageOptimizer.detectBlankArea(compressed);
      if (isBlank) {
        console.log(`跳过空白区域: ${chunk.id}`);
        processedChunks.value++;
        continue;
      }

      // AI提取
      extractionPhase.value = `正在提取区域 ${i + 1}/${chunks.length}...`;
      extractionProgress.value = 20 + ((i + 1) / chunks.length) * 70;

      // 移除data URL前缀
      const base64Data = compressed.split(',')[1];

      const result = await aiService.extractFromImage(base64Data, config);

      if (result.success && result.data) {
        extractionResults.value.push({
          chunkId: chunk.id,
          image: compressed,
          data: result.data,
          confidence: result.confidence || 0.85
        });

        // 累计token统计
        if (result.usage) {
          totalInputTokens += result.usage.input_tokens;
          totalOutputTokens += result.usage.output_tokens;
        }
      }

      processedChunks.value++;
    }

    // 4. 完成
    extractionPhase.value = '提取完成！';
    extractionProgress.value = 100;

    // 计算成本（智谱AI定价）
    tokenStats.value = {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      estimatedCost: (totalInputTokens * 0.0001 + totalOutputTokens * 0.0002)
    };

    console.log('提取完成:', extractionResults.value);

  } catch (error: any) {
    console.error('提取失败:', error);
    alert(`提取失败: ${error.message}`);
  } finally {
    isExtracting.value = false;
  }
};

// 取消提取
const cancelExtraction = () => {
  isExtracting.value = false;
  extractionPhase.value = '已取消';
};

// 导出结果
const exportResults = () => {
  // TODO: 实现Excel导出
  alert('导出功能开发中...');
};

// 清空结果
const clearResults = () => {
  extractionResults.value = [];
  tokenStats.value = null;
  extractionProgress.value = 0;
};
</script>

<style scoped>
.ai-extraction-panel {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-title {
  margin: 20px 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.textarea-field {
  resize: vertical;
  min-height: 80px;
}

.headers-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: white;
}

.header-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.header-item .input-field.small {
  width: 150px;
}

.btn-icon {
  padding: 8px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #333;
}

.btn-outline:hover {
  background: #f8f9fa;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-block {
  width: 100%;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.example-preview {
  position: relative;
  display: inline-block;
}

.example-preview img {
  max-width: 200px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.strategy-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-section {
  margin: 20px 0;
}

.progress-section {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.token-stats {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.token-stats h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.results-section {
  margin-top: 20px;
}

.results-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.result-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.result-header h4 {
  margin: 0;
  font-size: 14px;
}

.confidence {
  font-size: 12px;
  color: #28a745;
  font-weight: 600;
}

.result-content {
  padding: 15px;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.result-table th,
.result-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.result-table th {
  font-weight: 600;
  color: #555;
}

.result-table td {
  color: #333;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
