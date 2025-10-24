import type { Service, ServiceAction } from '~/types'

/**
 * Interface for representing an output variable from a trigger/action
 */
export interface OutputVariable {
  name: string
  type: string
  description: string
  path: string // The full path to access this variable (e.g., "generatedText", "tokensUsed")
}

/**
 * Composable for managing and extracting output variables from triggers/actions
 */
export const useOutputVariables = () => {
  const { getModuleDetails } = useWorkflowApi()

  /**
   * Extract output variables from a JSON schema
   */
  const extractVariablesFromSchema = (outputSchema: any, basePath = ''): OutputVariable[] => {
    if (!outputSchema || !outputSchema.properties) {
      return []
    }

    const variables: OutputVariable[] = []

    for (const [key, property] of Object.entries(outputSchema.properties)) {
      const prop = property as any
      const fullPath = basePath ? `${basePath}.${key}` : key

      const variable: OutputVariable = {
        name: key,
        type: prop.type || 'string',
        description: prop.description || `Variable ${key}`,
        path: fullPath
      }

      variables.push(variable)

      // Handle nested objects
      if (prop.type === 'object' && prop.properties) {
        const nestedVariables = extractVariablesFromSchema(prop, fullPath)
        variables.push(...nestedVariables)
      }
    }

    return variables
  }

  /**
   * Get output variables for a specific service action/trigger
   */
  const getOutputVariablesForAction = async (service: Service, action: ServiceAction): Promise<OutputVariable[]> => {
    try {
      // First try to get the module details to see if we have output schema in the action/trigger
      const moduleDetails = await getModuleDetails(service.slug)

      if (moduleDetails.success) {
        // Find the specific trigger or action
        const allActions = [...(moduleDetails.triggers || []), ...(moduleDetails.actions || [])]
        const targetAction = allActions.find(a => a.name === action.id)

        if (targetAction && targetAction.outputSchema) {
          return extractVariablesFromSchema(targetAction.outputSchema)
        }
      }

      return []
    } catch (error) {
      console.error('Error getting output variables for action:', error)
      return []
    }
  }

  /**
   * Get output variables for a node by its ID
   */
  const getOutputVariablesForNode = async (nodeId: string): Promise<OutputVariable[]> => {
    try {
      const nodeDetails = await getModuleDetails(nodeId)

      if (nodeDetails.success && nodeDetails.outputSchema) {
        return extractVariablesFromSchema(nodeDetails.outputSchema)
      }

      return []
    } catch (error) {
      console.error('Error getting output variables for node:', error)
      return []
    }
  }

  /**
   * Get all available output variables from previous nodes in a workflow
   * This includes both triggers and actions that precede the current node
   */
  const getAvailableOutputVariables = async (previousNodeIds: string[]): Promise<{ nodeId: string; nodeName: string; nodeType: string; variables: OutputVariable[] }[]> => {
    const results = []

    for (const nodeId of previousNodeIds) {
      try {
        const variables = await getOutputVariablesForNode(nodeId)
        const nodeDetails = await getModuleDetails(nodeId)

        // Get a descriptive name for the node
        let nodeName = nodeDetails.label || nodeDetails.displayName || nodeDetails.moduleName || 'Unknown Node'
        const nodeType = nodeDetails.nodeType || 'unknown'

        // Add action/trigger prefix for clarity
        if (nodeDetails.triggerName) {
          nodeName = `${nodeName} (Trigger: ${nodeDetails.triggerName})`
        } else if (nodeDetails.actionName) {
          nodeName = `${nodeName} (Action: ${nodeDetails.actionName})`
        }

        results.push({
          nodeId,
          nodeName,
          nodeType,
          variables
        })
      } catch (error) {
        console.error(`Error getting variables for node ${nodeId}:`, error)
        // Continue processing other nodes even if one fails
      }
    }

    return results
  }

  /**
   * Get available output variables from workflow blocks (for create mode)
   * This works with frontend block data before nodes are saved to backend
   */
  const getAvailableOutputVariablesFromBlocks = async (workflowBlocks: any[]): Promise<{ nodeId: string; nodeName: string; nodeType: string; variables: OutputVariable[] }[]> => {
    const results = []

    for (const block of workflowBlocks) {
      try {
        const service = block.service
        let variables: OutputVariable[] = []

        // For triggers
        if (block.type === 'trigger' && service.actions?.length > 0) {
          // Find the selected action (trigger)
          const selectedAction = service.actions.find((action: any) => action.id === block.actionId)
          if (selectedAction) {
            // Get output schema from service module
            const moduleDetails = await getModuleDetails(service.slug)
            if (moduleDetails.success && moduleDetails.triggers) {
              const triggerDef = moduleDetails.triggers.find((t: any) => t.name === selectedAction.id)
              if (triggerDef && triggerDef.outputSchema) {
                variables = extractVariablesFromSchema(triggerDef.outputSchema)
              }
            }
          }
        }
        // For actions
        else if (block.type === 'action' && service.reactions?.length > 0) {
          // Find the selected reaction (action)
          const selectedReaction = service.reactions.find((reaction: any) => reaction.id === block.reactionId)
          if (selectedReaction) {
            // Get output schema from service module
            const moduleDetails = await getModuleDetails(service.slug)
            if (moduleDetails.success && moduleDetails.actions) {
              const actionDef = moduleDetails.actions.find((a: any) => a.name === selectedReaction.id)
              if (actionDef && actionDef.outputSchema) {
                variables = extractVariablesFromSchema(actionDef.outputSchema)
              }
            }
          }
        }

        results.push({
          nodeId: block.id,
          nodeName: `${service.name} (${block.type})`,
          nodeType: block.type,
          variables
        })

      } catch (error) {
        console.error(`Error getting variables for block ${block.id}:`, error)
      }
    }

    return results
  }

  /**
   * Format a variable for display in the UI
   */
  const formatVariableForDisplay = (variable: OutputVariable): string => {
    return `{{${variable.path}}}`
  }

  /**
   * Get formatted variable name for badge display
   */
  const getVariableBadgeText = (variable: OutputVariable): string => {
    return variable.path
  }

  return {
    extractVariablesFromSchema,
    getOutputVariablesForAction,
    getOutputVariablesForNode,
    getAvailableOutputVariables,
    getAvailableOutputVariablesFromBlocks,
    formatVariableForDisplay,
    getVariableBadgeText
  }
}