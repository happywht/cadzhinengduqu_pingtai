<template>
  <div class="workspace-container" :class="{ 'is-dark': isDark }">
    <div class="cad-panel">
      <div class="cad-toolbar">
        <el-button type="primary" @click="openFile" :icon="FolderOpened" size="small">
          打开文件
        </el-button>
        <span v-if="store.fileName" class="file-name">{{ store.fileName }}</span>
        <div style="flex:1" />
        <el-button-group>
          <el-button size="small" @click="zoomToFit" :disabled="!store.cadFileLoaded" title="全图适配">
            <el-icon><FullScreen /></el-icon>
          </el-button>
          <el-button size="small" @click="toggleFullscreen" :disabled="!store.cadFileLoaded" title="全屏模式">
            <el-icon><Aim /></el-icon>
          </el-button>
          <el-button size="small" @click="toggleTheme" :title="isDark ? '切换亮色模式' : '切换暗色模式'">
            <el-icon><component :is="isDark ? Sunny : Moon" /></el-icon>
          </el-button>
        </el-button-group>
        <el-button v-if="store.hasResults" text size="small" type="primary" @click="store.showResults = true">
          结果({{ store.results.length }})
        </el-button>
      </div>
      <div class="cad-viewer-wrapper" ref="viewerWrapperRef">
        <div v-if="!store.cadFile" class="empty-state">
          <el-icon :size="48" color="var(--text-secondary)"><Document /></el-icon>
          <p class="empty-title">请打开CAD文件开始工作</p>
          <p class="empty-hint">支持 .dwg / .dxf 格式</p>
          <el-button type="primary" @click="openFile" style="margin-top:12px">选择文件</el-button>
        </div>
        <div v-show="store.cadFile" ref="viewerContainerRef" class="viewer-container">
          <MlCadViewer
            :local-file="store.cadFile ?? undefined"
            :background="isDark ? 0x0f172a : 0xffffff"
            :theme="isDark ? 'dark' : 'light'"
            locale="zh"
            @create="onViewerCreate"
          />
        </div>
      </div>
    </div>
    <ConfigPanel @extract="handleExtract" />
    <ResultsDrawer />
    <el-dialog v-model="showProgress" title="AI提取进度" width="480px" :close-on-click-modal="false" :show-close="false">
      <ExtractionProgress
        :phase="store.extractionPhase"
        :progress="store.extractionProgress"
        :total="store.totalChunks"
        :current="store.processedChunks"
      />
    </el-dialog>
    <input ref="fileInputRef" type="file" accept=".dwg,.dxf" style="display:none" @change="handleFileSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Document, FullScreen, Sunny, Moon, Aim } from '@element-plus/icons-vue'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import { useAppStore } from '@/stores/app'
import { ZhipuAIService } from '@/modules/ai-service'
import { CADImageChunker } from '@/modules/ai-service/chunker'
import { ImageOptimizer } from '@/modules/ai-service/image-optimizer'
import ConfigPanel from '@/components/ConfigPanel/index.vue'
import ResultsDrawer from '@/components/ResultsDrawer/index.vue'
import ExtractionProgress from '@/components/ExtractionProgress.vue'

const store = useAppStore()
const fileInputRef = ref<HTMLInputElement>()
const viewerContainerRef = ref<HTMLDivElement>()
const viewerWrapperRef = ref<HTMLDivElement>()
const showProgress = ref(false)

const isDark = ref(true)

// AI service instances
const aiService = new ZhipuAIService()
const chunker = new CADImageChunker()

// Document manager reference
let docManager: any = null

onMounted(() => {
  document.documentElement.classList.add('dark')
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}

async function onViewerCreate() {
  // Acquire AcApDocManager singleton
  try {
    const mod = await import('@mlightcad/cad-simple-viewer')
    docManager = mod.AcApDocManager?.instance

    // Configure viewer settings - ensure toolbar and menus are visible
    const settings = mod.AcApSettingManager?.instance
    if (settings) {
      settings.isShowToolbar = true
      settings.isShowMainMenu = true
      settings.isShowCommandLine = false
      settings.isShowEntityInfo = false
      settings.isShowCoordinate = true
      settings.isShowStats = false
    }

    // Listen for document activation to sync layers and zoom
    if (docManager?.events?.documentActivated) {
      docManager.events.documentActivated.addEventListener(() => {
        syncLayers()
        zoomToFit()
      })
    }

    // Document may already be loaded - try immediate sync
    syncLayers()
    zoomToFit()
  } catch (err) {
    console.warn('CAD viewer init:', err)
  }

  document.addEventListener('fullscreenchange', onFullscreenChange)
}

function onFullscreenChange() {
  // Sync state when user exits fullscreen via Esc
  if (!document.fullscreenElement) {
    // Exited fullscreen
  }
}

async function zoomToFit() {
  try {
    if (!docManager) {
      const mod = await import('@mlightcad/cad-simple-viewer')
      docManager = mod.AcApDocManager?.instance
    }
    const view = docManager?.curView
    if (view?.zoomToFitDrawing) {
      view.zoomToFitDrawing()
    }
  } catch {
    ElMessage.info('请使用CAD查看器内置工具栏的全图适配功能')
  }
}

function toggleFullscreen() {
  const el = viewerWrapperRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {
      ElMessage.warning('浏览器不支持全屏模式')
    })
  } else {
    document.exitFullscreen()
  }
}

async function syncLayers() {
  try {
    if (!docManager) {
      const mod = await import('@mlightcad/cad-simple-viewer')
      docManager = mod.AcApDocManager?.instance
    }
    if (!docManager) return

    const doc = docManager.curDocument || docManager.mdiActiveDocument
    if (!doc) return
    const db = doc.database
    if (!db) return

    // Correct API path: db.tables → tables.layer → _recordsByName
    const tables = (db as any).tables
    if (!tables) return

    const layerTable = tables.layer || tables.layerTable || tables.layers
    if (!layerTable) return

    const recordsByName = (layerTable as any)._recordsByName
    if (!recordsByName) return

    // Handle Map vs plain object
    const layerEntries = recordsByName instanceof Map
      ? [...recordsByName.entries()]
      : Object.entries(recordsByName)

    if (layerEntries.length === 0) return

    store.layers = layerEntries.map(([name, record]: [string, any]) => ({
      name,
      color: record?.color?.cssColor || record?.color?.toString?.() || '#94a3b8',
      description: record?.isOn !== undefined ? (record.isOn ? '可见图层' : '隐藏图层') : '图层',
      visible: record?.isOn ?? true
    }))
  } catch {
    // Layer sync may fail if document is not fully loaded yet
  }
}

function openFile() { fileInputRef.value?.click() }

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  store.setCadFile(file)
  ;(e.target as HTMLInputElement).value = ''
  ElMessage.success(`已加载: ${file.name}`)
  // Retry layer sync: document may take time to parse and activate
  retrySyncLayers()
}

function retrySyncLayers(attempt = 0) {
  if (attempt >= 6 || store.layers.length > 0) return
  setTimeout(() => {
    syncLayers()
    if (store.layers.length === 0) retrySyncLayers(attempt + 1)
  }, 2000 + attempt * 1000)
}

async function handleExtract() {
  if (store.isExtracting) return
  if (!store.cadFile) { ElMessage.warning('请先打开CAD文件'); return }
  if (store.fields.length === 0) { ElMessage.warning('请配置提取字段'); return }

  store.isExtracting = true
  store.clearResults()
  showProgress.value = true

  try {
    const canvas = viewerContainerRef.value?.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) throw new Error('未找到CAD画布，请先加载图纸')

    store.extractionPhase = '正在分析图纸结构...'
    store.extractionProgress = 10

    const chunks = await chunker.intelligentChunk(canvas, {
      strategy: store.chunkStrategy,
      chunkSize: 800,
      overlap: 120
    })
    store.totalChunks = chunks.length
    store.processedChunks = 0

    if (chunks.length === 0) {
      ElMessage.warning('未检测到有效内容区域，请尝试切换分块策略')
      return
    }

    const config = {
      headers: store.fields.map(f => ({ name: f.name, description: f.description, example: f.example })),
      examples: [] as Array<{ image: string; data: Record<string, string> }>,
      instructions: store.instructions || undefined
    }

    let totalInput = 0, totalOutput = 0

    for (let i = 0; i < chunks.length; i++) {
      if (!store.isExtracting) break
      store.extractionPhase = `提取区域 ${i + 1}/${chunks.length}...`
      store.extractionProgress = 10 + ((i + 1) / chunks.length) * 85

      const chunkImage = chunker.extractChunk(canvas, chunks[i])

      // Detect blank BEFORE compressing to save compute
      const isBlank = await ImageOptimizer.detectBlankArea(chunkImage)
      if (isBlank) { store.processedChunks++; continue }

      const compressed = await ImageOptimizer.compressImage(chunkImage, { format: 'image/png' })
      const base64 = compressed.dataUrl.split(',')[1]
      const result = await aiService.extractFromImage(base64, config)

      if (result.success && result.data && Object.keys(result.data).length > 0) {
        store.addResult({
          id: `chunk-${i}`,
          image: compressed.dataUrl,
          data: result.data,
          confidence: result.confidence || 0.5,
          status: 'pending'
        })
      }
      if (result.usage) {
        totalInput += result.usage.input_tokens
        totalOutput += result.usage.output_tokens
      }
      store.processedChunks++
    }

    store.tokenStats = {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      estimatedCost: totalInput * 0.0001 + totalOutput * 0.0002
    }
    store.extractionPhase = '提取完成！'
    store.extractionProgress = 100

    if (store.results.length > 0) {
      store.showResults = true
      ElMessage.success(`成功提取 ${store.results.length} 条数据`)
    } else {
      ElMessage.info('未提取到有效数据，请检查配置和图纸')
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知错误'
    ElMessage.error(`提取失败: ${msg}`)
  } finally {
    store.isExtracting = false
    showProgress.value = false
  }
}
</script>

<style scoped>
.workspace-container {
  display: flex; width: 100%; height: 100%; position: relative;
  background: var(--bg-app);
  transition: background-color 0.3s;
}
.cad-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.cad-toolbar {
  height: 44px; background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  display: flex; align-items: center; padding: 0 12px; gap: 8px;
  position: relative; z-index: 10;
  transition: background-color 0.3s, border-color 0.3s;
}
.cad-viewer-wrapper { flex: 1; overflow: hidden; position: relative; }
.cad-viewer-wrapper:fullscreen { background: var(--bg-canvas); }
.cad-viewer-wrapper:fullscreen .viewer-container { height: 100vh; }
.viewer-container { width: 100%; height: 100%; }
.file-name { color: var(--text-secondary); font-size: 0.8125rem; }
.empty-state {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: var(--bg-canvas);
}
.empty-title { color: var(--text-secondary); font-size: 1rem; margin-top: 12px; }
.empty-hint { color: var(--text-secondary); opacity: 0.5; font-size: 0.75rem; margin-top: 4px; }
</style>
