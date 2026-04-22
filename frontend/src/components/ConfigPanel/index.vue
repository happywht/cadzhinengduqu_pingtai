<template>
  <aside class="config-panel">
    <div class="config-content">
      <div class="section">
        <h3 class="section-title">图层解析</h3>
        <div class="card layer-list">
          <div v-for="(layer, idx) in store.layers" :key="layer.name" class="layer-item">
            <div class="layer-color" :style="{ background: layer.color }"></div>
            <div class="layer-info">
              <h4>{{ layer.name }}</h4>
              <p>{{ layer.description }}</p>
            </div>
            <el-switch v-model="layer.visible" size="small" @change="(val: boolean) => store.updateLayerVisibility(idx, val)" />
          </div>
          <el-empty v-if="store.layers.length === 0" description="上传CAD文件后自动识别图层" :image-size="60" />
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">图例设置</h3>
        <div class="card">
          <div class="legend-actions">
            <el-button size="small" @click="uploadLegend" :icon="Upload">上传图例</el-button>
            <el-tooltip content="在CAD图纸上框选图例区域" placement="top">
              <el-button size="small" @click="captureLegend" :icon="Camera" :disabled="!store.cadFileLoaded">
                截取图例
              </el-button>
            </el-tooltip>
          </div>
          <div v-if="store.legendImage" class="legend-preview">
            <img :src="store.legendImage" alt="图例" />
            <el-button text type="danger" size="small" @click="store.legendImage = ''">移除</el-button>
          </div>
          <input ref="legendInputRef" type="file" accept="image/*" style="display:none" @change="handleLegendUpload" />
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">提取配置</h3>
        <div class="card">
          <el-form label-position="top" size="small">
            <el-form-item label="预设模板">
              <el-select
                v-model="store.selectedTemplate"
                placeholder="选择模板"
                @change="handleTemplateChange"
                style="width:100%"
              >
                <el-option label="管线起止点表" value="pipeline" />
                <el-option label="建筑柱表" value="column" />
                <el-option label="基础坐标表" value="coordinate" />
              </el-select>
            </el-form-item>
          </el-form>

          <div class="field-editor">
            <div class="field-header">
              <span class="field-title">提取字段 ({{ store.fields.length }})</span>
              <el-button text type="primary" size="small" @click="store.addField">+ 添加字段</el-button>
            </div>
            <div v-for="(field, idx) in store.fields" :key="idx" class="field-row">
              <el-input v-model="field.name" placeholder="字段名" size="small" style="width:80px" />
              <el-input v-model="field.description" placeholder="描述（帮助AI识别）" size="small" style="flex:1" />
              <el-input v-model="field.example" placeholder="示例值" size="small" style="width:80px" />
              <el-button text type="danger" size="small" @click="store.removeField(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-empty v-if="store.fields.length === 0" description="选择模板或手动添加字段" :image-size="40" />
          </div>

          <el-form label-position="top" size="small" style="margin-top:12px">
            <el-form-item label="分块策略">
              <el-radio-group v-model="store.chunkStrategy" size="small">
                <el-radio-button value="grid">网格</el-radio-button>
                <el-radio-button value="content-aware">内容感知</el-radio-button>
                <el-radio-button value="hybrid">混合</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="特殊说明">
              <el-input v-model="store.instructions" type="textarea" :rows="2" placeholder="补充说明帮助AI更准确提取..." />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div class="config-footer">
      <el-button
        type="primary"
        size="large"
        style="width:100%"
        :loading="store.isExtracting"
        :disabled="!canExtract"
        @click="$emit('extract')"
      >
        {{ store.isExtracting ? store.extractionPhase : '开始批量信息提取' }}
      </el-button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { Delete, Upload, Camera } from '@element-plus/icons-vue'

defineEmits<{ extract: [] }>()

const store = useAppStore()
const legendInputRef = ref<HTMLInputElement>()
const canExtract = computed(() => store.fields.length > 0 && store.cadFileLoaded)

async function handleTemplateChange(key: string) {
  if (store.fields.length > 0) {
    try {
      await ElMessageBox.confirm('切换模板将覆盖当前字段配置，是否继续？', '提示', { type: 'warning' })
    } catch { return }
  }
  store.loadTemplate(key)
}

function uploadLegend() { legendInputRef.value?.click() }

function handleLegendUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { store.legendImage = reader.result as string }
  reader.readAsDataURL(file)
}

function captureLegend() {
  // TODO: use AcEditor.getBox() from cad-simple-viewer to implement area selection
}
</script>

<style scoped>
.config-panel {
  width: var(--config-panel-width);
  background: var(--bg-surface);
  display: flex; flex-direction: column; overflow: hidden;
  flex-shrink: 0;
  box-shadow: -1px 0 0 var(--border-color);
  z-index: 5;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.config-content {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 16px;
}
.section-title {
  font-size: 0.8125rem; font-weight: 600;
  color: var(--text-primary); margin-bottom: 6px;
}
.card {
  background: var(--bg-hover); border: 1px solid var(--border-color);
  border-radius: var(--radius-md); padding: 10px;
  transition: background-color 0.3s, border-color 0.3s;
}
.layer-list { display: flex; flex-direction: column; gap: 4px; }
.layer-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; background: var(--bg-surface);
  border: 1px solid var(--border-color); border-radius: 6px;
  transition: background-color 0.3s;
}
.layer-color { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.layer-info { flex: 1; min-width: 0; }
.layer-info h4 { font-size: 0.75rem; color: var(--text-primary); }
.layer-info p { font-size: 0.625rem; color: var(--text-secondary); }
.legend-actions { display: flex; gap: 8px; }
.legend-preview { margin-top: 8px; text-align: center; }
.legend-preview img { max-width: 100%; max-height: 80px; border-radius: 4px; border: 1px solid var(--border-color); }
.field-editor {
  border: 1px solid var(--border-color); border-radius: 6px;
  padding: 8px; background: var(--bg-surface);
}
.field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.field-title { font-size: 0.6875rem; font-weight: 600; color: var(--text-secondary); }
.field-row { display: flex; gap: 4px; align-items: center; margin-bottom: 4px; }
.config-footer {
  padding: 10px 12px; border-top: 1px solid var(--border-color);
  background: var(--bg-surface); z-index: 10;
  transition: background-color 0.3s, border-color 0.3s;
}
</style>
