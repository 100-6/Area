export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: string
}

export interface ModalProps {
  isOpen: boolean
  title?: string
  description?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  persistent?: boolean
  overlay?: boolean
}

export interface CardProps {
  title?: string
  description?: string
  footer?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export interface FormFieldProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
}

export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'search' | 'tel'
  placeholder?: string
  maxlength?: number
  minlength?: number
  autocomplete?: string
}

export interface SelectProps extends FormFieldProps {
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  multiple?: boolean
  clearable?: boolean
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  description?: string
  icon?: string
}

export interface NotificationProps {
  id?: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  actions?: NotificationAction[]
  persistent?: boolean
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}

export interface TabProps {
  items: TabItem[]
  modelValue?: string | number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'line' | 'solid' | 'pill'
}

export interface TabItem {
  key: string | number
  label: string
  content?: string
  disabled?: boolean
  icon?: string
  badge?: string | number
}