import type {
  AreaData,
  CreateAreaData,
  BackendWorkflow,
  BackendWorkflowNode,
  BackendWorkflowConnection,
  CreateWorkflowNodeDto,
  CreateWorkflowConnectionDto
} from '~/types'
import type { WorkflowBlockData, Connection } from './useWorkflowManagement'

/**
 * API composable for workflow backend integration
 */
export const useWorkflowApi = () => {
  const config = useRuntimeConfig()
  const backendUrl = process.server
    ? (config.backendUrl || 'http://area_backend_dev:8080')
    : (config.public.backendUrl || 'http://localhost:8080')

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Create a new AREA
   */
  const createArea = async (data: CreateAreaData): Promise<AreaData> => {
    try {
      isLoading.value = true
      error.value = null

      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean; area: AreaData }>('/api/areas', {
        method: 'POST',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: data
      })

      if (response.success) {
        return response.area
      } else {
        throw new Error('Failed to create area')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la création de l\'automatisation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get complete workflow (area + nodes + connections)
   */
  const getWorkflow = async (areaId: string): Promise<BackendWorkflow> => {
    try {
      isLoading.value = true
      error.value = null

      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      console.log('WorkflowApi - getWorkflow called with areaId:', areaId, typeof areaId)
      console.log('WorkflowApi - URL will be:', `/api/workflows/${areaId}`)

      const response = await $fetch<{ success: boolean; workflow: BackendWorkflow }>(`/api/workflows/${areaId}`, {
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (response.success) {
        return response.workflow
      } else {
        throw new Error('Failed to load workflow')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du chargement du workflow'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a workflow node
   */
  const createNode = async (areaId: string, nodeData: CreateWorkflowNodeDto): Promise<BackendWorkflowNode> => {
    try {
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean; node: BackendWorkflowNode }>(`/api/workflows/${areaId}/nodes`, {
        method: 'POST',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: nodeData
      })

      if (response.success) {
        return response.node
      } else {
        throw new Error('Failed to create node')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la création du nœud'
      throw err
    }
  }

  /**
   * Create a workflow connection
   */
  const createConnection = async (areaId: string, connectionData: CreateWorkflowConnectionDto): Promise<BackendWorkflowConnection> => {
    try {
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean; connection: BackendWorkflowConnection }>(`/api/workflows/${areaId}/connections`, {
        method: 'POST',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: connectionData
      })

      if (response.success) {
        return response.connection
      } else {
        throw new Error('Failed to create connection')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la création de la connexion'
      throw err
    }
  }

  /**
   * Update a workflow node
   */
  const updateNode = async (nodeId: string, nodeData: Partial<CreateWorkflowNodeDto>): Promise<BackendWorkflowNode> => {
    try {
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean; node: BackendWorkflowNode }>(`/api/workflows/nodes/${nodeId}`, {
        method: 'PATCH',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`,
          'Content-Type': 'application/json'
        },
        body: nodeData
      })

      if (response.success) {
        return response.node
      } else {
        throw new Error('Failed to update node')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la mise à jour du nœud'
      throw err
    }
  }

  /**
   * Delete a workflow node
   */
  const deleteNode = async (nodeId: string): Promise<void> => {
    try {
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean }>(`/api/workflows/nodes/${nodeId}`, {
        method: 'DELETE',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (!response.success) {
        throw new Error('Failed to delete node')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la suppression du nœud'
      throw err
    }
  }

  /**
   * Delete a workflow connection
   */
  const deleteConnection = async (connectionId: string): Promise<void> => {
    try {
      const authToken = useCookie('auth-token')
      if (!authToken.value) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await $fetch<{ success: boolean }>(`/api/workflows/connections/${connectionId}`, {
        method: 'DELETE',
        baseURL: backendUrl,
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      if (!response.success) {
        throw new Error('Failed to delete connection')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la suppression de la connexion'
      throw err
    }
  }

  /**
   * Convert frontend WorkflowBlockData to backend CreateWorkflowNodeDto
   */
  const mapBlockToNode = (block: WorkflowBlockData): CreateWorkflowNodeDto => {
    return {
      nodeType: block.type,
      serviceId: block.serviceId || block.service.id,
      actionId: block.actionId,
      reactionId: block.reactionId,
      config: block.config || {},
      positionX: Math.round(block.position.x),
      positionY: Math.round(block.position.y),
      label: block.label || block.service.name
    }
  }

  /**
   * Convert frontend Connection to backend CreateWorkflowConnectionDto
   */
  const mapConnectionToDto = (connection: Connection, nodeIdMap: Map<string, string>): CreateWorkflowConnectionDto => {
    const sourceNodeId = nodeIdMap.get(connection.from)
    const targetNodeId = nodeIdMap.get(connection.to)

    if (!sourceNodeId || !targetNodeId) {
      throw new Error('Invalid connection: node IDs not found')
    }

    return {
      sourceNodeId,
      targetNodeId,
      condition: connection.condition
    }
  }

  /**
   * Convert backend BackendWorkflowNode to frontend WorkflowBlockData
   */
  const mapNodeToBlock = (node: BackendWorkflowNode, service: any): WorkflowBlockData => {
    return {
      id: node.id,
      service,
      position: { x: node.positionX, y: node.positionY },
      type: node.nodeType === 'trigger' ? 'trigger' : 'action',
      serviceId: node.serviceId,
      actionId: node.actionId,
      reactionId: node.reactionId,
      config: node.config,
      label: node.label
    }
  }

  /**
   * Convert backend BackendWorkflowConnection to frontend Connection
   */
  const mapConnectionToFrontend = (connection: BackendWorkflowConnection): Connection => {
    return {
      from: connection.sourceNodeId,
      to: connection.targetNodeId,
      id: connection.id,
      condition: connection.condition
    }
  }

  /**
   * Save complete workflow to backend
   */
  const saveWorkflowToBackend = async (
    blocks: WorkflowBlockData[],
    connections: Connection[],
    areaData?: CreateAreaData,
    existingAreaId?: string
  ): Promise<{ area: AreaData; success: boolean }> => {
    try {
      isLoading.value = true
      error.value = null

      let area: AreaData

      // Create or use existing area
      if (existingAreaId) {
        console.log('[WorkflowApi] Updating existing workflow:', existingAreaId)
        
        // Get existing workflow
        const existingWorkflow = await getWorkflow(existingAreaId)
        
        // Build sets for comparison
        const existingNodeMap = new Map(existingWorkflow.nodes.map(n => [n.id, n]))
        const currentBlockMap = new Map(blocks.map(b => [b.id, b]))
        const existingConnMap = new Map(existingWorkflow.connections.map(c => [c.id!, c]))
        
        // 1. UPDATE existing nodes that are still present
        const nodesToUpdate = blocks.filter(b => existingNodeMap.has(b.id))
        console.log('[WorkflowApi] Updating', nodesToUpdate.length, 'nodes')
        for (const block of nodesToUpdate) {
          const nodeDto = mapBlockToNode(block)
          await updateNode(block.id, nodeDto)
        }
        
        // 2. CREATE new nodes
        const nodesToCreate = blocks.filter(b => !existingNodeMap.has(b.id))
        console.log('[WorkflowApi] Creating', nodesToCreate.length, 'new nodes')
        const nodeIdMap = new Map<string, string>()
        
        // Keep existing node IDs in the map
        nodesToUpdate.forEach(b => nodeIdMap.set(b.id, b.id))
        
        // Create new nodes and map their IDs
        for (const block of nodesToCreate) {
          const nodeDto = mapBlockToNode(block)
          const createdNode = await createNode(existingAreaId, nodeDto)
          nodeIdMap.set(block.id, createdNode.id)
        }
        
        // 3. DELETE removed nodes
        const nodesToDelete = existingWorkflow.nodes.filter(n => !currentBlockMap.has(n.id))
        console.log('[WorkflowApi] Deleting', nodesToDelete.length, 'nodes')
        for (const node of nodesToDelete) {
          await deleteNode(node.id)
        }
        
        // 4. Handle connections - delete all and recreate (simpler than diff)
        console.log('[WorkflowApi] Recreating', connections.length, 'connections')
        for (const conn of existingWorkflow.connections) {
          if (conn.id) {
            await deleteConnection(conn.id)
          }
        }
        
        for (const connection of connections) {
          const connectionDto = mapConnectionToDto(connection, nodeIdMap)
          await createConnection(existingAreaId, connectionDto)
        }
        
        area = { id: existingAreaId } as AreaData
      } else {
        // New workflow - create everything
        if (!areaData) {
          throw new Error('Area data required for new workflow')
        }
        area = await createArea(areaData)
        
        const nodeIdMap = new Map<string, string>()
        
        for (const block of blocks) {
          const nodeDto = mapBlockToNode(block)
          const createdNode = await createNode(area.id, nodeDto)
          nodeIdMap.set(block.id, createdNode.id)
        }
        
        for (const connection of connections) {
          const connectionDto = mapConnectionToDto(connection, nodeIdMap)
          await createConnection(area.id, connectionDto)
        }
      }

      console.log('[WorkflowApi] Saved', blocks.length, 'nodes and', connections.length, 'connections')
      return { area, success: true }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la sauvegarde du workflow'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // API Methods
    createArea,
    getWorkflow,
    createNode,
    updateNode,
    createConnection,
    deleteNode,
    deleteConnection,

    // Mapping utilities
    mapBlockToNode,
    mapConnectionToDto,
    mapNodeToBlock,
    mapConnectionToFrontend,

    // High-level operations
    saveWorkflowToBackend
  }
}