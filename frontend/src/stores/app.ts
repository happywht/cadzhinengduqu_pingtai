import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CADLayer {
  name: string
  color: string
  description: string
  visible: boolean
}

export interface ExtractionResult {
  id: string
  image: string
  data: Record<string, string>
  confidence: number
  status: 'pending' | 'verified' | 'corrected'
}

export interface ExtractionField {
  name: string
  description: string
  example: string
}

export interface TokenStats {
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

export const useAppStore = defineStore('app', () => {
  const cadFile = ref<File | null>(null)
  const fileName = ref('')
  const cadFileLoaded = ref(false)

  const layers = ref<CADLayer[]>([])
  const selectedTemplate = ref('')
  const fields = ref<ExtractionField[]>([])
  const legendImage = ref('')
  const instructions = ref('')
  const chunkStrategy = ref<'grid' | 'content-aware' | 'hybrid'>('hybrid')

  const isExtracting = ref(false)
  const extractionPhase = ref('')
  const extractionProgress = ref(0)
  const totalChunks = ref(0)
  const processedChunks = ref(0)
  const results = ref<ExtractionResult[]>([])
  const tokenStats = ref<TokenStats | null>(null)

  const showResults = ref(false)
  const hasResults = computed(() => results.value.length > 0)

  const templatePresets: Record<string, ExtractionField[]> = {
    pipeline: [
      { name: '起始点号', description: '管线的起始节点编号', example: 'J1' },
      { name: '结束点号', description: '管线的结束节点编号', example: 'J2' },
      { name: '起始高程', description: '起始点的标高值（米）', example: '123.45' },
      { name: '结束高程', description: '结束点的标高值（米）', example: '122.80' },
      { name: '管径', description: '管道直径（毫米）', example: 'DN300' },
      { name: '管材', description: '管道材质', example: 'PE管' }
    ],
    column: [
      { name: '柱编号', description: '柱子的编号标识', example: 'KZ-1' },
      { name: '截面尺寸', description: '柱子截面尺寸（mm）', example: '500×500' },
      { name: '混凝土等级', description: '混凝土强度等级', example: 'C30' },
      { name: '纵筋', description: '纵向钢筋配置', example: '12Φ20' },
      { name: '箍筋', description: '箍筋配置', example: 'Φ8@100' }
    ],
    coordinate: [
      { name: '基础编号', description: '基础的编号标识', example: 'J-1' },
      { name: 'X坐标', description: 'X方向坐标值（米）', example: '1234.567' },
      { name: 'Y坐标', description: 'Y方向坐标值（米）', example: '5678.901' },
      { name: '基底高程', description: '基础底面标高（米）', example: '120.00' }
    ]
  }

  function setCadFile(file: File | null) {
    cadFile.value = file
    fileName.value = file?.name || ''
    cadFileLoaded.value = !!file
  }

  function loadTemplate(key: string) {
    selectedTemplate.value = key
    if (templatePresets[key]) {
      fields.value = templatePresets[key].map(f => ({ ...f }))
    }
  }

  function addField() {
    fields.value.push({ name: '', description: '', example: '' })
  }

  function removeField(index: number) {
    fields.value.splice(index, 1)
  }

  function updateField(index: number, field: Partial<ExtractionField>) {
    Object.assign(fields.value[index], field)
  }

  function updateLayerVisibility(index: number, visible: boolean) {
    if (layers.value[index]) layers.value[index].visible = visible
  }

  function addResult(result: ExtractionResult) {
    results.value.push(result)
  }

  function updateResult(id: string, data: Record<string, string>) {
    const r = results.value.find(r => r.id === id)
    if (r) { r.data = data; r.status = 'corrected' }
  }

  function clearResults() {
    results.value = []
    tokenStats.value = null
    extractionProgress.value = 0
  }

  function resetExtraction() {
    isExtracting.value = false
    extractionPhase.value = ''
    extractionProgress.value = 0
    totalChunks.value = 0
    processedChunks.value = 0
  }

  return {
    cadFile, fileName, cadFileLoaded,
    layers, selectedTemplate, fields, legendImage, instructions, chunkStrategy,
    templatePresets, loadTemplate, addField, removeField, updateField,
    updateLayerVisibility, setCadFile,
    isExtracting, extractionPhase, extractionProgress,
    totalChunks, processedChunks,
    results, tokenStats, showResults, hasResults,
    addResult, updateResult, clearResults, resetExtraction
  }
})
