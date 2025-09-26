import type { Service, ServiceAction, ServiceReaction } from './Service'

export interface Workflow {
  id: string
  name: string
  description?: string
  isActive: boolean
  userId: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  runCount: number
  status: 'active' | 'paused' | 'error' | 'draft'
}

export interface WorkflowTrigger {
  id: string
  serviceId: string
  service: Service
  actionId: string
  action: ServiceAction
  parameters: Record<string, any>
  conditions?: TriggerCondition[]
}

export interface WorkflowAction {
  id: string
  serviceId: string
  service: Service
  reactionId: string
  reaction: ServiceReaction
  parameters: Record<string, any>
  order: number
  conditions?: ActionCondition[]
}

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'not_empty'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface ActionCondition extends TriggerCondition {}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'success' | 'error' | 'cancelled'
  startedAt: string
  completedAt?: string
  duration?: number
  triggerData: Record<string, any>
  steps: ExecutionStep[]
  errorMessage?: string
}

export interface ExecutionStep {
  id: string
  actionId: string
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped'
  startedAt?: string
  completedAt?: string
  inputData: Record<string, any>
  outputData?: Record<string, any>
  errorMessage?: string
}

export interface WorkflowStats {
  totalRuns: number
  successRate: number
  averageDuration: number
  lastRunAt?: string
  runsThisWeek: number
  runsThisMonth: number
}

// Types pour la création/édition
export interface CreateWorkflowData {
  name: string
  description?: string
  trigger: Omit<WorkflowTrigger, 'id' | 'service'>
  actions: Omit<WorkflowAction, 'id' | 'service'>[]
}

export interface UpdateWorkflowData extends Partial<CreateWorkflowData> {
  isActive?: boolean
  status?: Workflow['status']
}