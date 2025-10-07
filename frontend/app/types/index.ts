// Export all types from a central location
export * from './User'
export * from './api'
export * from './Service'
export * from './ServiceConfiguration'
export * from './Workflow'
export * from './components'
export * from './store'

// Common utility types
export type Maybe<T> = T | null | undefined
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
  [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
}[Keys]

// Date and time types
export type DateString = string // ISO 8601 format
export type Timestamp = number // Unix timestamp

// API status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type RequestStatus = 'pending' | 'fulfilled' | 'rejected'

// Common ID types
export type UserId = string
export type WorkflowId = string
export type ServiceId = string
export type ActionId = string

// Theme types
export type ThemeMode = 'light' | 'dark'
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red'

// Breakpoint types (Tailwind CSS)
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// File types
export interface FileUpload {
  name: string
  size: number
  type: string
  lastModified: number
  file: File
}

// Generic CRUD operations
export interface CrudOperations<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  create: (data: CreateT) => Promise<T>
  read: (id: string) => Promise<T>
  update: (id: string, data: UpdateT) => Promise<T>
  delete: (id: string) => Promise<void>
  list: (params?: any) => Promise<T[]>
}