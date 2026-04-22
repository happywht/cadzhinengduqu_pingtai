<template>
  <header class="app-header">
    <h1>CAD智能信息提取平台</h1>
    <div class="header-actions">
      <button class="btn btn-outline" @click="handleUploadCAD">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        上传CAD文件
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const handleUploadCAD = () => {
  // TODO: 实现CAD文件上传逻辑
  console.log('上传CAD文件')
}
</script>

<style scoped>
.app-header {
  height: var(--header-offset);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.app-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.header-actions {
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-outline {
  background-color: transparent;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-outline:hover {
  background-color: var(--bg-hover);
  border-color: #cbd5e1;
}
</style>
