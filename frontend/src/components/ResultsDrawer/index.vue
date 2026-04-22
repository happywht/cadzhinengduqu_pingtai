<template>
  <div class="results-drawer" :class="{ 'is-open': isOpen }">
    <div class="results-header">
      <div>
        <h2 style="font-size: 1.125rem">提取结果审核</h2>
        <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px">
          共提取到 {{ results.length }} 处管线节点数据，请点击卡片核对修正。
        </p>
      </div>
      <button class="btn btn-outline" @click="closeDrawer">保留修改，稍后处理</button>
    </div>

    <div class="results-content">
      <div v-for="result in results" :key="result.id" class="result-card" @click="openResult(result)">
        <div class="result-image">
          <div class="result-img-placeholder">图纸截块 #{{ result.id }}</div>
        </div>
        <div class="result-data">
          <div v-for="(value, key) in result.data" :key="key" class="data-row">
            <span class="data-label">{{ key }}</span>
            <span class="data-value" :class="{ 'text-danger': value === '无法识别' }">
              {{ value }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="results-footer">
      <button class="btn btn-primary" @click="confirmResults">确认并入库</button>
    </div>
  </div>

  <!-- Edit Modal -->
  <div v-if="selectedResult" class="modal-overlay" :class="{ 'is-open': showModal }" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>人工修正提取结果</h3>
        <button class="btn btn-outline" style="padding: 4px; border: none" @click="closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div
          style="
            flex: 1;
            background: #e2e8f0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
          "
        >
          [局部图纸高清大图放大镜效果]
        </div>
        <div style="flex: 1">
          <div v-for="(_value, key) in editableData" :key="key" class="form-group">
            <label class="form-label" :for="`edit-${key}`">{{ key }}</label>
            <input :id="`edit-${key}`" type="text" v-model="editableData[key]" class="form-input" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="closeModal">取消</button>
        <button class="btn btn-primary" @click="saveModal">保存修改</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ResultData {
  [key: string]: string
}

interface Result {
  id: number
  data: ResultData
}

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const results = ref<Result[]>([
  {
    id: 1,
    data: {
      起始点号: 'W-201',
      结束点号: 'W-202',
      起始高程: '12.80m',
      管径: 'DN300'
    }
  },
  {
    id: 2,
    data: {
      起始点号: 'W-202',
      结束点号: 'W-203',
      起始高程: '12.50m',
      管径: 'DN300'
    }
  },
  {
    id: 3,
    data: {
      起始点号: 'W-203',
      结束点号: 'W-204',
      起始高程: '无法识别',
      管径: 'DN200'
    }
  }
])

const selectedResult = ref<Result | null>(null)
const showModal = ref(false)
const editableData = ref<ResultData>({})

const openResult = (result: Result) => {
  selectedResult.value = result
  editableData.value = { ...result.data }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedResult.value = null
}

const saveModal = () => {
  if (selectedResult.value) {
    selectedResult.value.data = { ...editableData.value }
  }
  closeModal()
}

const closeDrawer = () => {
  emit('close')
}

const confirmResults = () => {
  emit('confirm')
}
</script>

<style scoped>
.results-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-surface);
  height: var(--results-drawer-height);
  min-height: var(--results-drawer-min-height);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 20;
}

.results-drawer.is-open {
  transform: translateY(0);
}

.results-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--bg-app);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.result-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s;
}

.result-card:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.result-image {
  height: 120px;
  background: var(--bg-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.result-img-placeholder {
  width: 80%;
  height: 80%;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.result-data {
  padding: 12px;
  flex: 1;
}

.data-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.8125rem;
}

.data-label {
  color: var(--text-secondary);
}

.data-value {
  font-weight: 500;
  color: var(--text-primary);
}

.results-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-surface);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.btn-primary {
  background-color: var(--brand-primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background-color: var(--brand-hover);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.2s;
}

.modal-overlay.is-open {
  display: flex;
  opacity: 1;
}

.modal {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  width: 600px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
  transform: scale(0.95);
  transition: transform 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-overlay.is-open .modal {
  transform: scale(1);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 24px;
  display: flex;
  gap: 20px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-hover);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
  width: 100%;
  background: var(--bg-surface);
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.text-danger {
  color: var(--danger);
}
</style>
