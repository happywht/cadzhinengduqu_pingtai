<template>
  <header class="app-header">
    <div class="header-brand">
      <el-icon :size="20" color="#2563eb"><Grid /></el-icon>
      <h1>CAD智能信息提取平台</h1>
    </div>
    <div class="header-info">
      <span v-if="store.cadFileLoaded" class="file-badge">
        {{ store.fileName }}
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Grid } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
const store = useAppStore()
</script>

<style scoped>
.app-header {
  height: var(--header-offset); background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; padding: 0 20px;
  flex-shrink: 0; box-shadow: var(--shadow-sm); z-index: 10;
}
.header-brand { display: flex; align-items: center; gap: 10px; }
.app-header h1 { font-size: 1.125rem; font-weight: 600; }
.header-info { margin-left: auto; }
.file-badge {
  font-size: 0.75rem; color: var(--text-secondary);
  background: var(--bg-hover); padding: 4px 10px; border-radius: 4px;
  border: 1px solid var(--border-color);
}
</style>
