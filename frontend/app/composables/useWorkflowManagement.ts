import type { Service, CreateAreaData, BackendWorkflowNode, BackendWorkflowConnection, ServiceConfiguration } from '~/types'

export interface WorkflowBlockData {
  id: string
  service: Service
  position: { x: number; y: number }
  type: 'trigger' | 'action'
  // Backend integration fields
  serviceId?: string
  actionId?: string
  reactionId?: string
  config?: Record<string, any>
  label?: string
}

export interface Connection {
  from: string
  to: string
  // Backend integration fields
  id?: string
  condition?: Record<string, any>
}

/**
 * Workflow blocks and connections management with automatic SVG path generation
 */
export const useWorkflowManagement = (canvas: Ref<HTMLElement | undefined>, zoom: Ref<number>) => {
  const workflowBlocks = ref<WorkflowBlockData[]>([])
  const connections = ref<Connection[]>([])

  // Backend integration
  const workflowApi = useWorkflowApi()
  const currentAreaId = ref<string | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  
  // Plus besoin de mapping UUID - on utilise directement les noms de services

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

  const addServiceBlock = (config: ServiceConfiguration, position?: { x: number; y: number }) => {
    let newPosition
    if (position) {
      // Use provided position (from add button location)
      newPosition = position
    } else if (workflowBlocks.value.length === 0) {
      // First block: use fixed, predictable position at canvas center
      newPosition = { x: 2500, y: 2500 }
    } else {
      const lastBlock = workflowBlocks.value[workflowBlocks.value.length - 1]
      newPosition = {
        x: lastBlock.position.x + 350,
        y: lastBlock.position.y
      }
    }

    const blockType = workflowBlocks.value.length === 0 ? 'trigger' : 'action'

    // Use configuration from the modal
    let actionId: string | undefined
    let reactionId: string | undefined

    if (blockType === 'trigger' && config.selectedAction) {
      actionId = config.selectedAction.id
    } else if (blockType === 'action' && config.selectedReaction) {
      reactionId = config.selectedReaction.id
    }

    const newBlock: WorkflowBlockData = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      service: config.service,
      position: newPosition,
      type: blockType,
      serviceId: config.service.id,
      actionId,
      reactionId,
      config: config.parameters,
      label: config.service.name
    }

    workflowBlocks.value.push(newBlock)

    if (workflowBlocks.value.length > 1) {
      const previousBlock = workflowBlocks.value[workflowBlocks.value.length - 2]
      connections.value.push({
        from: previousBlock.id,
        to: newBlock.id
      })
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
      console.warn('Block not found for configuration:', blockId)
      return null
    }

    // Rafraîchir les données depuis le backend
    console.log('configureBlock - currentAreaId:', currentAreaId.value)
    if (currentAreaId.value) {
      console.log('Refreshing block data from backend for block:', blockId)
      try {
        await refreshBlockFromBackend(blockId)
      } catch (error) {
        console.warn('Failed to refresh block from backend:', error)
        // Continue avec les données actuelles si le rafraîchissement échoue
      }
    } else {
      console.warn('No currentAreaId available, skipping backend refresh. This might be expected for new workflows.')
    }

    // Récupérer le bloc mis à jour - assurer la réactivité
    const refreshedBlock = workflowBlocks.value.find(b => b.id === blockId) || block

    console.log('Configuring block after refresh:', blockId, 'Config:', refreshedBlock.config)
    console.log('Block details:', {
      serviceId: refreshedBlock.serviceId,
      actionId: refreshedBlock.actionId,
      reactionId: refreshedBlock.reactionId,
      type: refreshedBlock.type,
      configKeys: Object.keys(refreshedBlock.config || {}),
      configValues: refreshedBlock.config
    })

    // Trouver l'action ou réaction correspondante
    let selectedAction: any = undefined
    let selectedReaction: any = undefined

    if (refreshedBlock.type === 'trigger' && refreshedBlock.actionId) {
      selectedAction = refreshedBlock.service.actions.find(a => a.id === refreshedBlock.actionId)
      console.log('Found selected action:', selectedAction)
    } else if (refreshedBlock.type === 'action' && refreshedBlock.reactionId) {
      selectedReaction = refreshedBlock.service.reactions.find(r => r.id === refreshedBlock.reactionId)
      console.log('Found selected reaction:', selectedReaction)
    }

    // Créer la configuration finale
    const finalConfig = {
      service: refreshedBlock.service,
      selectedAction,
      selectedReaction,
      parameters: { ...(refreshedBlock.config || {}) }
    } as ServiceConfiguration

    console.log('Final configuration being returned from configureBlock:', {
      parameters: finalConfig.parameters,
      selectedAction: finalConfig.selectedAction,
      selectedReaction: finalConfig.selectedReaction
    })

    // Retourner les informations nécessaires pour ouvrir le modal de configuration
    return {
      blockId: refreshedBlock.id,
      service: refreshedBlock.service,
      blockType: refreshedBlock.type,
      currentConfig: finalConfig,
      onConfigurationChanged
    }
  }

  const refreshBlockFromBackend = async (blockId: string) => {
    if (!currentAreaId.value) return

    try {
      console.log('Fetching latest workflow data for block refresh...')
      const workflow = await workflowApi.getWorkflow(currentAreaId.value)

      // Trouver le nœud correspondant dans le workflow backend
      const backendNode = workflow.nodes.find(node => node.id === blockId)
      if (!backendNode) {
        console.warn('Block not found in backend workflow:', blockId)
        return
      }

      // Mettre à jour le bloc local avec les données du backend
      const blockIndex = workflowBlocks.value.findIndex(b => b.id === blockId)
      if (blockIndex !== -1) {
        const currentBlock = workflowBlocks.value[blockIndex]

        // Mettre à jour les paramètres de configuration avec les données du backend
        workflowBlocks.value[blockIndex] = {
          ...currentBlock,
          actionId: backendNode.actionId,
          reactionId: backendNode.reactionId,
          config: backendNode.config || {}
        }

        console.log('Block refreshed from backend:', {
          blockId,
          actionId: backendNode.actionId,
          reactionId: backendNode.reactionId,
          config: backendNode.config,
          fullBackendNode: backendNode
        })

        console.log('Updated frontend block:', workflowBlocks.value[blockIndex])
      }
    } catch (error) {
      console.error('Failed to refresh block from backend:', error)
      throw error
    }
  }

  const updateBlockConfiguration = (blockId: string, config: ServiceConfiguration) => {
    const block = workflowBlocks.value.find(b => b.id === blockId)
    if (!block) {
      console.warn('Block not found for configuration update:', blockId)
      return
    }

    // Mettre à jour la configuration du bloc
    if (config.selectedAction && block.type === 'trigger') {
      block.actionId = config.selectedAction.id
    } else if (config.selectedReaction && block.type === 'action') {
      block.reactionId = config.selectedReaction.id
    }

    block.config = { ...config.parameters }

    console.log('Block configuration updated:', blockId, block.config)
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

  /**
   * Generate smooth bezier curve paths between workflow blocks
   */
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

  /**
   * Save workflow to backend
   */
  const saveWorkflow = async (areaData?: CreateAreaData) => {
    try {
      isSaving.value = true
      saveError.value = null

      if (workflowBlocks.value.length === 0) {
        throw new Error('Aucun bloc dans le workflow')
      }

      console.log('Saving workflow with block positions:', workflowBlocks.value.map(b => ({
        id: b.id,
        service: b.service.name,
        position: b.position
      })))

      // Save to backend with current positions
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
   * Service mapping cache
   */
  const serviceMapping = ref<Map<string, Service>>(new Map())

  /**
   * Initialize service mapping - plus besoin avec les noms
   */
  const initializeServiceMapping = async () => {
    console.log('[WorkflowManagement] Using service names directly - no UUID mapping needed')
  }

  /**
   * Resolve service identifier (name) to a frontend service object
   */
  const resolveService = (serviceName: string): Service | null => {
    const { getAvailableServices } = useServiceManagement()
    const services = getAvailableServices()

    // Recherche directe par nom ou ID
    const service = services.find(s =>
      s.id === serviceName ||
      s.name?.toLowerCase() === serviceName.toLowerCase()
    )

    if (!service) {
      console.warn(`[WorkflowManagement] Service not found: ${serviceName}`)
    }

    return service || null
  }

  /**
   * Map backend node to frontend block
   */
  const mapBackendNodeToBlock = (node: BackendWorkflowNode): WorkflowBlockData | null => {
    // Utiliser serviceName si disponible, sinon essayer de deviner le nom depuis l'UUID
    let service: Service | null = null

    if (node.serviceName) {
      // Le backend a fourni le nom du service, on résout directement
      service = resolveService(node.serviceName)
    } else if (node.serviceId) {
      // Plus besoin de mapping - le backend devrait toujours fournir serviceName maintenant
      console.warn(`[WorkflowManagement] Node has serviceId but no serviceName - this should not happen with the updated backend:`, node.serviceId)
      return null
    }

    if (!service) {
      console.warn(`Service not found for node:`, node)
      return null
    }

    return {
      id: node.id,
      service,
      position: { x: node.positionX, y: node.positionY },
      type: node.nodeType === 'trigger' ? 'trigger' : 'action',
      serviceId: node.serviceId, // Garder l'UUID pour les sauvegardes
      actionId: node.actionId,
      reactionId: node.reactionId,
      config: node.config,
      label: node.label || service.name
    }
  }

  /**
   * Map backend connection to frontend connection
   */
  const mapBackendConnectionToFrontend = (connection: BackendWorkflowConnection): Connection => {
    return {
      from: connection.sourceNodeId,
      to: connection.targetNodeId,
      id: connection.id,
      condition: connection.condition
    }
  }

  /**
   * Load workflow from backend
   */
  const loadWorkflow = async (areaId: string) => {
    try {
      isSaving.value = true
      saveError.value = null

      const workflow = await workflowApi.getWorkflow(areaId)

      // Initialize service mapping first
      await initializeServiceMapping()

      // Clear existing workflow
      workflowBlocks.value = []
      connections.value = []

      // Map backend nodes to frontend blocks
      const mappedBlocks = workflow.nodes
        .map(mapBackendNodeToBlock)
        .filter((block): block is WorkflowBlockData => block !== null)

      workflowBlocks.value = mappedBlocks

      // Map backend connections to frontend connections
      connections.value = workflow.connections.map(mapBackendConnectionToFrontend)

      currentAreaId.value = areaId

      console.log(`[WorkflowManagement] Loaded ${workflowBlocks.value.length} blocks and ${connections.value.length} connections`)

      return workflow
    } catch (err: any) {
      saveError.value = err.message || 'Erreur lors du chargement'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  return {
    // State
    workflowBlocks: readonly(workflowBlocks),
    connections: readonly(connections),
    currentAreaId: readonly(currentAreaId),
    isSaving: readonly(isSaving),
    saveError: readonly(saveError),

    // Canvas management
    nextCardPosition,
    addServiceBlock,
    updateBlockPosition,
    deleteBlock,
    configureBlock,
    getBlockConnectionState,
    getConnectionPath,

    // Backend integration
    saveWorkflow,
    loadWorkflow,
    serializeWorkflow,
    initializeServiceMapping,

    // Configuration editing
    updateBlockConfiguration
  }
}