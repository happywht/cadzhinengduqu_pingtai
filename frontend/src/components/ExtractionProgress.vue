<template>
  <div class="extraction-progress">
    <div class="phase-description">{{ phase }}</div>

    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="progress-info">
      <span>{{ progress }}%</span>
      <span v-if="total > 0">({{ current }}/{{ total }})</span>
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
  background: var(--bg-surface);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
.phase-description {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}
.progress-bar-container {
  position: relative;
  width: 100%;
  height: 24px;
  background: var(--bg-hover);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-hover) 100%);
  transition: width 0.3s ease;
  position: relative;
}
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
