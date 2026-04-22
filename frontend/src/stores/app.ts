import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CADLayer {
  name: string
  color: string
  description: string
  visible: boolean
}

export interface ExtractResult {
  id: number
  data: Record<string, string>
  verified: boolean
}

export const useAppStore = defineStore('app', () => {
  // 应用状态
  const isLoading = ref(false)
  const currentProject = ref<string | null>(null)

  // CAD相关状态
  const cadLayers = ref<CADLayer[]>([
    {
      name: 'WALLS',
      color: '#ef4444',
      description: 'AI推断：建筑墙体，主要结构',
      visible: true
    },
    {
      name: 'PIPE-WATER',
      color: '#3b82f6',
      description: 'AI推断：给水管线，含走向标记',
      visible: true
    },
    {
      name: 'ELEVATION',
      color: '#10b981',
      description: 'AI推断：标高标注点及高程数据',
      visible: true
    }
  ])

  const extractResults = ref<ExtractResult[]>([])
  const selectedTemplate = ref('管线起止点（起点、终点、高程...）')

  // 操作方法
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setCurrentProject = (projectId: string | null) => {
    currentProject.value = projectId
  }

  const updateLayerVisibility = (layerName: string, visible: boolean) => {
    const layer = cadLayers.value.find((l) => l.name === layerName)
    if (layer) {
      layer.visible = visible
    }
  }

  const addExtractResult = (result: ExtractResult) => {
    extractResults.value.push(result)
  }

  const updateExtractResult = (id: number, data: Record<string, string>) => {
    const result = extractResults.value.find((r) => r.id === id)
    if (result) {
      result.data = data
    }
  }

  const clearExtractResults = () => {
    extractResults.value = []
  }

  return {
    // 状态
    isLoading,
    currentProject,
    cadLayers,
    extractResults,
    selectedTemplate,

    // 方法
    setLoading,
    setCurrentProject,
    updateLayerVisibility,
    addExtractResult,
    updateExtractResult,
    clearExtractResults
  }
})
