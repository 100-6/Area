import type { Service, CreateAreaData, BackendWorkflowNode, BackendWorkflowConnection, ServiceConfiguration } from '~/types'

export interface WorkflowBlockData {
  id: string
  service: Service
  position: { x: number; y: number }
  type: 'trigger' | 'action'
  serviceId?: string
  actionId?: string
  reactionId?: string
  config?: Record<string, any>
  label?: string
}

export interface Connection {
  from: string
  to: string
  id?: string
  condition?: Record<string, any>
}

export const useWorkflowManagement = (canvas: Ref<HTMLElement | undefined>, zoom: Ref<number>) => {
  const workflowBlocks = ref<WorkflowBlockData[]>([])
  const connections = ref<Connection[]>([])

  const workflowApi = useWorkflowApi()
  const currentAreaId = ref<string | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  const isUuid = (value?: string | null): boolean => {
    if (!value)
      return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  }
  

  watch(zoom, () => {
    nextTick(() => {
      connections.value = [...connections.value]
    })
  })

  const firstCardPosition = computed(() => ({ x: 0, y: 0 }))

  const nextCardPosition = computed(() => {
    if (workflowBlocks.value.length === 0) {
      return firstCardPosition.value
    }

    const lastBlock = workflowBlocks.value[workflowBlocks.value.length - 1]
    return {
      x: lastBlock.position.x + 350,
      y: lastBlock.position.y
    }
  })

  const addServiceBlock = (config: ServiceConfiguration, position?: { x: number; y: number }, blockType?: 'trigger' | 'action') => {
    let newPosition
    if (position) {
      newPosition = position
    } else if (workflowBlocks.value.length === 0) {
      newPosition = { x: 2500, y: 2500 }
    } else {
      const lastBlock = workflowBlocks.value[workflowBlocks.value.length - 1]
      newPosition = {
        x: lastBlock.position.x + 350,
        y: lastBlock.position.y
      }
    }

    const finalBlockType = blockType || (workflowBlocks.value.length === 0 ? 'trigger' : 'action')

    let actionId: string | undefined
    let reactionId: string | undefined

    if (finalBlockType === 'trigger' && config.selectedAction) {
      actionId = config.selectedAction.id
    } else if (finalBlockType === 'action' && config.selectedReaction) {
      reactionId = config.selectedReaction.id
    }

    const newBlock: WorkflowBlockData = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      service: config.service,
      position: newPosition,
      type: finalBlockType,
      serviceId: config.service.id,
      actionId,
      reactionId,
      config: config.parameters,
      label: config.service.name
    }

    workflowBlocks.value.push(newBlock)

    if (workflowBlocks.value.length > 1) {
      const previousBlock = workflowBlocks.value[workflowBlocks.value.length - 2]
      const newConnection = {
        from: previousBlock.id,
        to: newBlock.id
      }
      connections.value.push(newConnection)
    }

    nextTick(() => {
      connections.value = [...connections.value]
    })
  }

  const updateBlockPosition = (blockId: string, newPosition: { x: number; y: number }) => {
    const block = workflowBlocks.value.find(b => b.id === blockId)
    if (block) {
      block.position = newPosition
    }
  }

  const deleteBlock = (blockId: string) => {
    workflowBlocks.value = workflowBlocks.value.filter(b => b.id !== blockId)
    connections.value = connections.value.filter(c => c.from !== blockId && c.to !== blockId)
  }

  const configureBlock = async (blockId: string, onConfigurationChanged?: (config: ServiceConfiguration) => void) => {
    const block = workflowBlocks.value.find(b => b.id === blockId)
    if (!block) {
      return null
    }

    if (currentAreaId.value) {
      try {
        await refreshBlockFromBackend(blockId)
      } catch (_error) {
      }
    }

    const refreshedBlock = workflowBlocks.value.find(b => b.id === blockId) || block

    const serviceName = refreshedBlock.serviceName || block.service.name || block.service
    const resolvedService = await resolveService(serviceName)
    if (!resolvedService) {
      return
    }

    let nodeDetails: any = null
    if (isUuid(refreshedBlock.id)) {
      try {
        nodeDetails = await workflowApi.getModuleDetails(refreshedBlock.id)
      } catch (_error) {
        nodeDetails = null
      }
    }

    let selectedAction: any = undefined
    let selectedReaction: any = undefined

    if (refreshedBlock.type === 'trigger' && refreshedBlock.actionId) {
      selectedAction = resolvedService.actions.find(a => a.id === refreshedBlock.actionId)
      if (!selectedAction && nodeDetails?.triggerName) {
        selectedAction = resolvedService.actions.find(a => a.id === nodeDetails.triggerName)
      }
      if (!selectedAction && nodeDetails?.actionName) {
        selectedAction = resolvedService.actions.find(a => a.id === nodeDetails.actionName)
      }
    } else if (refreshedBlock.type === 'action' && refreshedBlock.reactionId) {
      selectedReaction = resolvedService.reactions.find(r => r.id === refreshedBlock.reactionId)
      if (!selectedReaction && nodeDetails?.actionName) {
        selectedReaction = resolvedService.reactions.find(r => r.id === nodeDetails.actionName)
      }
      if (!selectedReaction && nodeDetails?.triggerName) {
        selectedReaction = resolvedService.reactions.find(r => r.id === nodeDetails.triggerName)
      }
    }

    const finalConfig = {
      service: resolvedService,
      selectedAction,
      selectedReaction,
      parameters: { ...(nodeDetails?.currentConfig || refreshedBlock.config || {}) }
    } as ServiceConfiguration

    return {
      blockId: refreshedBlock.id,
      service: resolvedService,
      blockType: refreshedBlock.type,
      currentConfig: finalConfig,
      onConfigurationChanged
    }
  }

  const refreshBlockFromBackend = async (blockId: string) => {
    if (!currentAreaId.value) {
      return
    }

    try {
      const workflow = await workflowApi.getWorkflow(currentAreaId.value)

      const backendNode = workflow.nodes.find(node => node.id === blockId)
      if (!backendNode) {
        return
      }

      const blockIndex = workflowBlocks.value.findIndex(b => b.id === blockId)
      if (blockIndex !== -1) {
        const currentBlock = workflowBlocks.value[blockIndex]

        workflowBlocks.value[blockIndex] = {
          ...currentBlock,
          actionId: backendNode.actionId,
          reactionId: backendNode.reactionId,
          config: backendNode.config || {}
        }

      }
    } catch (error) {
      throw error
    }
  }

  const updateBlockConfiguration = (blockId: string, config: ServiceConfiguration) => {
    const block = workflowBlocks.value.find(b => b.id === blockId)
    if (!block) {
      return
    }

    if (config.selectedAction && block.type === 'trigger') {
      block.actionId = config.selectedAction.id
    } else if (config.selectedReaction && block.type === 'action') {
      block.reactionId = config.selectedReaction.id
    }

    block.config = { ...config.parameters }
  }

  const getBlockConnectionState = (blockId: string) => {
    const hasInputConnection = connections.value.some(conn => conn.to === blockId)
    const hasOutputConnection = connections.value.some(conn => conn.from === blockId)

    return {
      hasInputConnection,
      hasOutputConnection
    }
  }

  const getCardDimensions = (blockId?: string) => {
    if (blockId && canvas.value) {
      const cardElement = canvas.value.querySelector(`[data-block-id="${blockId}"]`)
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect()
        return {
          width: rect.width / zoom.value,
          height: rect.height / zoom.value
        }
      }
    }

    return {
      width: 300,
      height: 200
    }
  }

  const getConnectionPointPosition = (blockId: string, isOutput: boolean) => {
    if (!canvas.value) return null

    const cardElement = canvas.value.querySelector(`[data-block-id="${blockId}"]`)
    if (!cardElement) return null

    const connectionPoint = cardElement.querySelector(isOutput ? '.connection-output' : '.connection-input')
    if (!connectionPoint) return null

    const cardRect = cardElement.getBoundingClientRect()
    const pointRect = connectionPoint.getBoundingClientRect()
    const canvasRect = canvas.value.getBoundingClientRect()

    const x = (pointRect.left + pointRect.width / 2 - canvasRect.left) / zoom.value
    const y = (pointRect.top + pointRect.height / 2 - canvasRect.top) / zoom.value

    return { x, y }
  }

  const getConnectionPath = (connection: Connection) => {
    const fromBlock = workflowBlocks.value.find(b => b.id === connection.from)
    const toBlock = workflowBlocks.value.find(b => b.id === connection.to)

    if (!fromBlock || !toBlock) return ''

    const fromPoint = getConnectionPointPosition(connection.from, true)
    const toPoint = getConnectionPointPosition(connection.to, false)

    let fromX, fromY, toX, toY

    if (fromPoint && toPoint) {
      fromX = fromPoint.x
      fromY = fromPoint.y
      toX = toPoint.x
      toY = toPoint.y
    } else {
      const CARD_WIDTH = 280
      const CARD_HEIGHT = 180

      fromX = fromBlock.position.x + CARD_WIDTH + 6 + 20
      fromY = fromBlock.position.y + CARD_HEIGHT / 2 + 20
      toX = toBlock.position.x - 6
      toY = toBlock.position.y + CARD_HEIGHT / 2 + 25
    }

    const controlOffset = Math.max(100, Math.abs(toX - fromX) * 0.25)
    const fromControlX = fromX + controlOffset
    const toControlX = toX - controlOffset

    return `M ${fromX} ${fromY} C ${fromControlX} ${fromY}, ${toControlX} ${toY}, ${toX} ${toY}`
  }

  const serializeWorkflow = () => {
    return {
      blocks: workflowBlocks.value.map(block => ({
        id: block.id,
        serviceId: block.service.id,
        type: block.type,
        position: block.position,
        config: {}
      })),
      connections: connections.value
    }
  }

  const saveWorkflow = async (areaData?: CreateAreaData) => {
    try {
      isSaving.value = true
      saveError.value = null

      if (workflowBlocks.value.length === 0) {
        throw new Error('Aucun bloc dans le workflow')
      }


      const result = await workflowApi.saveWorkflowToBackend(
        workflowBlocks.value,
        connections.value,
        areaData,
        currentAreaId.value || undefined
      )

      currentAreaId.value = result.area.id
      return result
    } catch (err: any) {
      saveError.value = err.message || 'Erreur lors de la sauvegarde'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Initialize service mapping - plus besoin avec les noms
   */
  const initializeServiceMapping = async () => {
    // Using service names directly - no UUID mapping needed
  }

  /**
   * Resolve service identifier (name) to a frontend service object
   */
  const resolveService = async (serviceName: string): Promise<Service | null> => {
    const { getAvailableServices } = useServiceManagement()
    const services = await getAvailableServices()

    const service = services.find(s =>
      s.id === serviceName ||
      s.name?.toLowerCase() === serviceName.toLowerCase()
    )

    return service || null
  }

  /**
   * Map backend node to frontend block
   */
  const mapBackendNodeToBlock = async (node: BackendWorkflowNode): Promise<WorkflowBlockData | null> => {
    let service: Service | null = null

    if (node.serviceName) {
      service = await resolveService(node.serviceName)
    } else if (node.serviceId) {
      return null
    }

    if (!service) {
      return null
    }

    return {
      id: node.id,
      service,
      position: { x: node.positionX, y: node.positionY },
      type: node.nodeType === 'trigger' ? 'trigger' : 'action',
      serviceId: node.serviceId,
      actionId: node.actionId,
      reactionId: node.reactionId,
      config: node.config,
      label: node.label || service.name
    }
  }

  const mapBackendConnectionToFrontend = (connection: BackendWorkflowConnection): Connection => {
    return {
      from: connection.sourceNodeId,
      to: connection.targetNodeId,
      id: connection.id,
      condition: connection.condition
    }
  }

  const loadWorkflow = async (areaId: string) => {
    try {
      isSaving.value = true
      saveError.value = null

      const workflow = await workflowApi.getWorkflow(areaId)

      workflowBlocks.value = []
      connections.value = []

      // Map backend nodes to frontend blocks
      const mappedBlocks = await Promise.all(
        workflow.nodes.map(node => mapBackendNodeToBlock(node))
      )

      workflowBlocks.value = mappedBlocks.filter((block): block is WorkflowBlockData => block !== null)

      connections.value = workflow.connections.map(mapBackendConnectionToFrontend)

      currentAreaId.value = areaId

      nextTick(() => {
        connections.value = [...connections.value]
      })

      return workflow
    } catch (err: any) {
      saveError.value = err.message || 'Erreur lors du chargement'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const updateBlockConfig = async (blockId: string, newConfig: ServiceConfiguration) => {
    const blockIndex = workflowBlocks.value.findIndex(b => b.id === blockId)
    if (blockIndex === -1) {
      return
    }

    const block = workflowBlocks.value[blockIndex]
    if (!block) {
      return
    }

    const updatedBlock: WorkflowBlockData = {
      id: block.id,
      service: newConfig.service,
      position: block.position,
      type: block.type,
      config: newConfig.parameters,
      actionId: newConfig.selectedAction?.id,
      reactionId: newConfig.selectedReaction?.id,
      serviceId: newConfig.service.id,
      label: newConfig.service.name
    }

    workflowBlocks.value[blockIndex] = updatedBlock

    if (currentAreaId.value && block.id.startsWith('node-')) {
      try {
        isSaving.value = true
        saveError.value = null

        await workflowApi.updateNode(block.id.replace('node-', ''), {
          config: newConfig.parameters,
          actionId: newConfig.selectedAction?.id,
          reactionId: newConfig.selectedReaction?.id,
          serviceId: newConfig.service.id,
          label: newConfig.service.name
        })

      } catch (err: any) {
        saveError.value = err.message || 'Erreur lors de la mise à jour'
        throw err
      } finally {
        isSaving.value = false
      }
    }
  }
  return {
    workflowBlocks: readonly(workflowBlocks),
    connections: readonly(connections),
    currentAreaId: readonly(currentAreaId),
    isSaving: readonly(isSaving),
    saveError: readonly(saveError),

    nextCardPosition,
    addServiceBlock,
    updateBlockPosition,
    deleteBlock,
    configureBlock,
    updateBlockConfig,
    getBlockConnectionState,
    getConnectionPath,

    saveWorkflow,
    loadWorkflow,
    serializeWorkflow,
    initializeServiceMapping,

    updateBlockConfiguration,
    updateBlockConfig
  }
}
