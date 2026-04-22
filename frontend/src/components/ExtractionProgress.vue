<template>
  <div class="extraction-progress">
    <!-- 阶段描述 -->
    <div class="phase-description">
      {{ phase }}
    </div>

    <!-- 进度条 -->
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <!-- 进度信息 -->
    <div class="progress-info">
      <span>{{ progress }}%</span>
      <span v-if="total > 0">({{ current }}/{{ total }})</span>
    </div>

    <!-- 结果预览 -->
    <div v-if="results.length > 0" class="results-preview">
      <h4>已提取 {{ results.length }} 条结果</h4>
      <div class="results-list">
        <div
          v-for="(result, index) in results.slice(0, 5)"
          :key="index"
          class="result-item"
        >
          <span class="result-index">区域{{ index + 1 }}</span>
          <span class="result-confidence">
            置信度: {{ (result.confidence * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  phase: string;
  progress: number;
  total?: number;
  current?: number;
  results?: any[];
}

withDefaults(defineProps<Props>(), {
  total: 0,
  current: 0,
  results: () => []
});
</script>

<style scoped>
.extraction-progress {
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.phase-description {
  margin-bottom: 10px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.progress-bar-container {
  position: relative;
  width: 100%;
  height: 24px;
  background: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  transition: width 0.3s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.results-preview {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.results-preview h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.result-index {
  font-weight: 600;
  color: #333;
}

.result-confidence {
  color: #28a745;
  font-weight: 500;
}
</style>
