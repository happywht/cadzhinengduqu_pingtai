<template>
  <div class="results-drawer" :class="{ 'is-open': store.showResults }">
    <div class="results-header">
      <div>
        <h3>提取结果审核</h3>
        <p class="header-sub">共 {{ store.results.length }} 条数据，点击卡片核对修正</p>
      </div>
      <div class="header-actions">
        <el-button @click="exportCSV" :icon="Download" :disabled="!store.hasResults">导出CSV</el-button>
        <el-button @click="store.showResults = false">保留修改，稍后处理</el-button>
      </div>
    </div>

    <div class="results-content" v-if="store.results.length">
      <div
        v-for="result in store.results"
        :key="result.id"
        class="result-card"
        :class="{ 'is-danger': hasUnrecognized(result.data) }"
        @click="openEdit(result)"
      >
        <div class="result-image">
          <img v-if="result.image" :src="result.image" alt="截图" />
          <span v-else class="img-placeholder">区域 #{{ result.id }}</span>
        </div>
        <div class="result-data">
          <div v-for="(value, key) in result.data" :key="key" class="data-row">
            <span class="data-label">{{ key }}</span>
            <span class="data-value" :class="{ 'is-warn': value === '无法识别' || !value }">
              {{ value || '--' }}
            </span>
          </div>
          <div class="result-meta">
            <el-tag :type="statusTagType(result.status)" size="small">{{ statusLabel(result.status) }}</el-tag>
            <span class="confidence">置信度 {{ (result.confidence * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无提取结果" :image-size="80" style="flex:1;display:flex;flex-direction:column;justify-content:center" />

    <div class="results-footer">
      <span class="footer-stats" v-if="store.tokenStats">
        Token: {{ store.tokenStats.inputTokens + store.tokenStats.outputTokens }} | 预估费用: ¥{{ store.tokenStats.estimatedCost.toFixed(4) }}
      </span>
      <div class="footer-actions">
        <el-button @click="store.clearResults" :disabled="!store.hasResults">清空结果</el-button>
        <el-button type="primary" @click="confirmResults" :disabled="!store.hasResults">确认并入库</el-button>
      </div>
    </div>
  </div>

  <el-dialog v-model="showEdit" title="人工修正提取结果" width="640px" :close-on-click-modal="false">
    <div class="edit-body">
      <div class="edit-image" v-if="editingResult?.image">
        <img :src="editingResult.image" alt="截图" />
      </div>
      <div class="edit-form">
        <el-form label-position="top" size="small">
          <el-form-item v-for="(_val, key) in editData" :key="key" :label="key">
            <el-input v-model="editData[key]" />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <template #footer>
      <el-button @click="showEdit = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore, type ExtractionResult } from '@/stores/app'
import { Download } from '@element-plus/icons-vue'

const store = useAppStore()

const showEdit = ref(false)
const editingResult = ref<ExtractionResult | null>(null)
const editData = ref<Record<string, string>>({})

function hasUnrecognized(data: Record<string, string>) {
  return Object.values(data).some(v => v === '无法识别' || !v)
}

function statusTagType(s: string) {
  if (s === 'verified') return 'success'
  if (s === 'corrected') return 'warning'
  return 'info'
}

function statusLabel(s: string) {
  if (s === 'verified') return '已确认'
  if (s === 'corrected') return '已修正'
  return '待审核'
}

function openEdit(result: ExtractionResult) {
  editingResult.value = result
  editData.value = { ...result.data }
  showEdit.value = true
}

function saveEdit() {
  if (editingResult.value) {
    store.updateResult(editingResult.value.id, { ...editData.value })
  }
  showEdit.value = false
}

function confirmResults() {
  store.results.forEach(r => { r.status = 'verified' })
  store.showResults = false
}

function exportCSV() {
  if (!store.results.length) return
  const headers = Object.keys(store.results[0].data)
  const csv = [
    headers.join(','),
    ...store.results.map(r => headers.map(h => `"${(r.data[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const BOM = '﻿'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `提取结果_${new Date().toLocaleDateString()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.results-drawer {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--bg-surface);
  height: var(--results-drawer-height);
  min-height: var(--results-drawer-min-height);
  border-top: 1px solid var(--border-color);
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-lg);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}
.results-drawer.is-open { transform: translateY(0); }
.results-header {
  padding: 12px 20px; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.results-header h3 { font-size: 1rem; font-weight: 600; }
.header-sub { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }
.results-content {
  flex: 1; padding: 16px; overflow-y: auto; background: var(--bg-app);
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;
}
.result-card {
  background: var(--bg-surface); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: all 0.2s;
}
.result-card:hover { border-color: var(--brand-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.result-card.is-danger { border-left: 3px solid var(--danger); }
.result-image { height: 100px; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.result-image img { max-width: 100%; max-height: 100%; object-fit: contain; }
.img-placeholder { font-size: 0.75rem; color: var(--text-secondary); }
.result-data { padding: 10px; }
.data-row { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px; }
.data-label { color: var(--text-secondary); }
.data-value { font-weight: 500; }
.data-value.is-warn { color: var(--danger); }
.result-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-color); }
.confidence { font-size: 0.6875rem; color: var(--success); }
.results-footer {
  padding: 10px 20px; border-top: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.footer-stats { font-size: 0.75rem; color: var(--text-secondary); }
.footer-actions { display: flex; gap: 8px; }
.edit-body { display: flex; gap: 16px; }
.edit-image { flex: 1; max-height: 300px; overflow: auto; border: 1px solid var(--border-color); border-radius: 6px; }
.edit-image img { width: 100%; }
.edit-form { flex: 1; }
</style>
