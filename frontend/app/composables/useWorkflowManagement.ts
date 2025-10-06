import type { Service, CreateAreaData, BackendWorkflowNode, BackendWorkflowConnection } from '~/types'

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

  const addServiceBlock = (service: Service, position?: { x: number; y: number }) => {
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

    // Auto-configure actionId/reactionId based on service and type
    let actionId: string | undefined
    let reactionId: string | undefined
    let config: Record<string, any> = {}

    // Configuration par défaut basée sur le type de bloc et les actions/reactions disponibles
    if (blockType === 'trigger' && service.actions.length > 0) {
      actionId = service.actions[0].id
      config = service.actions[0].defaultConfig || {}
    } else if (blockType === 'action' && service.reactions.length > 0) {
      reactionId = service.reactions[0].id
      config = service.reactions[0].defaultConfig || {}
    }

    const newBlock: WorkflowBlockData = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      service,
      position: newPosition,
      type: blockType,
      serviceId: service.id,
      actionId,
      reactionId,
      config,
      label: service.name
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

  const configureBlock = (blockId: string) => {
    console.log('Configuring block:', blockId)
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
      // Fallback : mapping UUID → nom pour les workflows existants
      const uuidToName = new Map([
        ['9a6eb232-a943-4179-bf67-09ecb912ae26', 'timer'],
        ['197a9125-47fd-4953-a449-0a085e74179c', 'console']
      ])

      const serviceName = uuidToName.get(node.serviceId)
      if (serviceName) {
        service = resolveService(serviceName)
        console.log(`[WorkflowManagement] Mapped UUID ${node.serviceId} → ${serviceName}`)
      } else {
        console.warn(`[WorkflowManagement] Unknown UUID:`, node.serviceId)
        return null
      }
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
      serviceId: service.id, // Utiliser le nom du service au lieu de l'UUID
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
    initializeServiceMapping
  }
}