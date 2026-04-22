<template>
  <aside class="config-panel">
    <div class="config-content">
      <!-- Layer Details -->
      <div class="section">
        <h3 class="section-title">图层解析</h3>
        <div class="card layer-list">
          <div
            v-for="layer in layers"
            :key="layer.name"
            class="layer-item"
            @click="selectLayer(layer)"
          >
            <div class="layer-color" :style="{ background: layer.color }"></div>
            <div class="layer-info">
              <h4>{{ layer.name }}</h4>
              <p>{{ layer.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend & Example -->
      <div class="section">
        <h3 class="section-title">图例提取设置</h3>
        <div class="card" style="display: flex; gap: 12px">
          <button class="btn btn-outline btn-block">上传图例</button>
          <button class="btn btn-outline btn-block" @click="captureLegend">截取图例</button>
        </div>
      </div>

      <!-- Header Configuration & Results -->
      <div class="section">
        <h3 class="section-title">信息提取表头及示例</h3>
        <div class="card">
          <div class="form-group">
            <label class="form-label">预设表头模板</label>
            <select class="form-select" v-model="selectedTemplate">
              <option v-for="template in templates" :key="template" :value="template">
                {{ template }}
              </option>
            </select>
          </div>

          <div
            style="
              margin: 16px 0;
              border: 1px dashed var(--border-color);
              padding: 12px;
              text-align: center;
              border-radius: 6px;
            "
          >
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px">
              示例图例区域
            </p>
            <div
              style="
                height: 40px;
                background: #e2e8f0;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #64748b;
                font-size: 0.8125rem;
              "
            >
              [示例截图预览]
            </div>
          </div>

          <div
            style="
              background: var(--bg-surface);
              border: 1px solid var(--border-color);
              border-radius: 4px;
              overflow: hidden;
            "
          >
            <table>
              <thead>
                <tr>
                  <th>表头名称</th>
                  <th>示例提取内容</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in exampleData" :key="index">
                  <td class="editable-cell" @click="editCell(index, 'header')">{{ item.header }}</td>
                  <td class="editable-cell" @click="editCell(index, 'example')">{{ item.example }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px">
            *点击表格内容可直接修改，此信息将指导AI提取
          </p>
        </div>
      </div>
    </div>

    <div
      style="
        padding: 16px 20px;
        background: var(--bg-surface);
        border-top: 1px solid var(--border-color);
        z-index: 10;
      "
    >
      <button
        class="btn btn-primary btn-block"
        style="height: 44px; font-size: 1rem"
        @click="startExtraction"
        :disabled="isExtracting"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          ></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        {{ isExtracting ? '提取中...' : '开始批量信息提取' }}
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Layer {
  name: string
  color: string
  description: string
}

interface ExampleItem {
  header: string
  example: string
}

const layers = ref<Layer[]>([
  {
    name: 'WALLS',
    color: '#ef4444',
    description: 'AI推断：建筑墙体，主要结构'
  },
  {
    name: 'PIPE-WATER',
    color: '#3b82f6',
    description: 'AI推断：给水管线，含走向标记'
  },
  {
    name: 'ELEVATION',
    color: '#10b981',
    description: 'AI推断：标高标注点及高程数据'
  }
])

const templates = ref([
  '管线起止点（起点、终点、高程...）',
  '建筑柱表（编号、尺寸、配筋）',
  '基础坐标表（基础号、X坐标、Y坐标）'
])

const selectedTemplate = ref(templates.value[0])

const exampleData = ref<ExampleItem[]>([
  { header: '起始点号', example: 'J-101' },
  { header: '结束点号', example: 'J-102' },
  { header: '起始高程', example: '34.50m' }
])

const isExtracting = ref(false)

const selectLayer = (layer: Layer) => {
  console.log('选择图层:', layer)
}

const captureLegend = () => {
  console.log('截取图例')
  // TODO: 实现图例截取功能
}

const editCell = (index: number, field: 'header' | 'example') => {
  const currentValue = exampleData.value[index][field]
  const newValue = prompt('编辑内容:', currentValue)
  if (newValue !== null) {
    exampleData.value[index][field] = newValue
  }
}

const startExtraction = () => {
  isExtracting.value = true
  // TODO: 实现提取逻辑
  setTimeout(() => {
    isExtracting.value = false
  }, 2500)
}
</script>

<style scoped>
.config-panel {
  width: var(--config-panel-width);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: -1px 0 0 var(--border-color);
  z-index: 5;
}

.config-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layer-item:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 1px var(--brand-primary);
}

.layer-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.layer-info h4 {
  font-size: 0.875rem;
  margin-bottom: 2px;
}

.layer-info p {
  font-size: 0.75rem;
  color: var(--text-secondary);
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

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-block {
  width: 100%;
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

.form-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
  width: 100%;
  background: var(--bg-surface);
}

.form-select:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th,
td {
  text-align: left;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

th {
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-hover);
}

td {
  color: var(--text-primary);
}

.editable-cell:hover {
  background-color: rgba(37, 99, 235, 0.05);
  cursor: pointer;
  border-radius: 4px;
}
</style>
