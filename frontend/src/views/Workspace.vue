<template>
  <div class="workspace-container">
    <div class="cad-panel">
      <div class="cad-toolbar">
        <button class="btn btn-primary" @click="openFile">打开CAD文件</button>
        <span v-if="fileName" class="file-name">{{ fileName }}</span>
      </div>
      <div class="cad-viewer-wrapper">
        <MlCadViewer
          ref="cadViewerRef"
          :local-file="cadFile"
          :url="cadUrl"
          :background="0x1e293b"
          locale="zh"
        />
      </div>
    </div>
    <ConfigPanel @extract="handleExtract" />
    <LoadingOverlay :is-show="isExtracting" message="AI正在进行多轮多模态解析..." />
    <ResultsDrawer :is-open="showResults" @close="showResults = false" @confirm="handleConfirm" />
    <input
      ref="fileInputRef"
      type="file"
      accept=".dwg,.dxf"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import ConfigPanel from '@/components/ConfigPanel/index.vue'
import ResultsDrawer from '@/components/ResultsDrawer/index.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'

const cadViewerRef = ref()
const fileInputRef = ref<HTMLInputElement>()
const cadFile = ref<File | undefined>()
const fileName = ref('')
const cadUrl = ref<string | undefined>()
const isExtracting = ref(false)
const showResults = ref(false)

function openFile() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  cadFile.value = file
  fileName.value = file.name
  target.value = ''
}

function handleExtract() {
  isExtracting.value = true
  setTimeout(() => {
    isExtracting.value = false
    showResults.value = true
  }, 2500)
}

function handleConfirm() {
  showResults.value = false
}
</script>

<style scoped>
.workspace-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
}

.cad-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cad-toolbar {
  height: 48px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  position: relative;
  z-index: 10;
}

.cad-viewer-wrapper {
  flex: 1;
  overflow: hidden;
}

.file-name {
  color: #94a3b8;
  font-size: 0.875rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: #e2e8f0;
}

.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
