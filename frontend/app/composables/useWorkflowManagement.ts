import type { Service } from '~/types'

export interface WorkflowBlockData {
  id: string
  service: Service
  position: { x: number; y: number }
  type: 'trigger' | 'action'
}

export interface Connection {
  from: string
  to: string
}

/**
 * Workflow blocks and connections management with automatic SVG path generation
 */
export const useWorkflowManagement = (canvas: Ref<HTMLElement | undefined>, zoom: Ref<number>) => {
  const workflowBlocks = ref<WorkflowBlockData[]>([])
  const connections = ref<Connection[]>([])

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

  const addServiceBlock = (service: Service) => {
    let newPosition
    if (workflowBlocks.value.length === 0) {
      newPosition = { x: 2500, y: 2500 }
    } else {
      const lastBlock = workflowBlocks.value[workflowBlocks.value.length - 1]
      newPosition = {
        x: lastBlock.position.x + 350,
        y: lastBlock.position.y
      }
    }

    const newBlock: WorkflowBlockData = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      service,
      position: newPosition,
      type: workflowBlocks.value.length === 0 ? 'trigger' : 'action'
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
   * Save workflow - ready for backend integration
   */
  const saveWorkflow = async () => {
    const workflowData = serializeWorkflow()
    console.log('Saving workflow:', workflowData)

    // TODO: Replace with actual API call
    return Promise.resolve(workflowData)
  }

  /**
   * Load workflow - ready for backend integration
   */
  const loadWorkflow = async (workflowId: string) => {
    console.log('Loading workflow:', workflowId)
    // TODO: Replace with actual API call
  }

  return {
    workflowBlocks: readonly(workflowBlocks),
    connections: readonly(connections),
    nextCardPosition,
    addServiceBlock,
    updateBlockPosition,
    deleteBlock,
    configureBlock,
    getBlockConnectionState,
    getConnectionPath,
    saveWorkflow,
    loadWorkflow,
    serializeWorkflow
  }
}