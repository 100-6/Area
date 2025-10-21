import type { Service, ServiceAction, ServiceReaction, ActionParameter } from './Service'

/**
 * Configuration pour un service sélectionné
 */
export interface ServiceConfiguration {
  service: Service
  selectedAction?: ServiceAction
  selectedReaction?: ServiceReaction
  parameters: Record<string, any>
}

/**
 * Valeur d'un paramètre avec état de validation
 */
export interface ParameterValue {
  value: any
  isValid: boolean
  error?: string
}

/**
 * État de validation pour tous les paramètres
 */
export interface ConfigurationValidation {
  isValid: boolean
  parameters: Record<string, ParameterValue>
  errors: string[]
}

/**
 * Props pour les composants de configuration de champs
 */
export interface ConfigFieldProps {
  parameter: ActionParameter
  value: any
  error?: string
  disabled?: boolean
}

/**
 * Émissions des composants de configuration de champs
 */
export interface ConfigFieldEmits {
  (e: 'update:value', value: any): void
  (e: 'validate', isValid: boolean, error?: string): void
}

/**
 * Configuration par défaut pour les types de champs
 */
export interface FieldTypeConfig {
  component: string
  validator?: (value: any, parameter: ActionParameter) => { isValid: boolean; error?: string }
  defaultValue?: any
}

/**
 * Mapping des types de paramètres aux composants
 */
export const FIELD_TYPE_MAPPING: Record<string, FieldTypeConfig> = {
  string: {
    component: 'ConfigInput',
    defaultValue: '',
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value.toString().trim() === '')) {
        return { isValid: false, error: 'Ce champ est requis' }
      }
      if (value && parameter.validation?.pattern) {
        const regex = new RegExp(parameter.validation.pattern)
        if (!regex.test(value.toString())) {
          return { isValid: false, error: 'Format invalide' }
        }
      }
      return { isValid: true }
    }
  },
  number: {
    component: 'ConfigNumber',
    defaultValue: 0,
    validator: (value: any, parameter: ActionParameter) => {
      const numValue = Number(value)
      if (parameter.required && (value === null || value === undefined || isNaN(numValue))) {
        return { isValid: false, error: 'Ce champ est requis' }
      }
      if (!isNaN(numValue)) {
        if (parameter.validation?.min !== undefined && numValue < parameter.validation.min) {
          return { isValid: false, error: `La valeur doit être supérieure à ${parameter.validation.min}` }
        }
        if (parameter.validation?.max !== undefined && numValue > parameter.validation.max) {
          return { isValid: false, error: `La valeur doit être inférieure à ${parameter.validation.max}` }
        }
      }
      return { isValid: true }
    }
  },
  boolean: {
    component: 'ConfigCheckbox',
    defaultValue: false,
    validator: () => ({ isValid: true }) // Les boolean sont toujours valides
  },
  select: {
    component: 'ConfigSelectMenu',
    defaultValue: null,
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value === '')) {
        return { isValid: false, error: 'Veuillez sélectionner une option' }
      }
      if (value && parameter.options && !parameter.options.includes(value)) {
        return { isValid: false, error: 'Option invalide' }
      }
      return { isValid: true }
    }
  },
  date: {
    component: 'ConfigDate',
    defaultValue: '',
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value === '')) {
        return { isValid: false, error: 'Ce champ est requis' }
      }
      if (value) {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Date invalide' }
        }
      }
      return { isValid: true }
    }
  },
  email: {
    component: 'ConfigInput',
    defaultValue: '',
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value.toString().trim() === '')) {
        return { isValid: false, error: 'Ce champ est requis' }
      }
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.toString())) {
          return { isValid: false, error: 'Adresse email invalide' }
        }
      }
      return { isValid: true }
    }
  },
  url: {
    component: 'ConfigInput',
    defaultValue: '',
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value.toString().trim() === '')) {
        return { isValid: false, error: 'Ce champ est requis' }
      }
      if (value) {
        try {
          new URL(value.toString())
        } catch {
          return { isValid: false, error: 'URL invalide' }
        }
      }
      return { isValid: true }
    }
  },
  discord_channel: {
    component: 'ConfigDiscordChannel',
    defaultValue: '',
    validator: (value: any, parameter: ActionParameter) => {
      if (parameter.required && (!value || value.toString().trim() === '')) {
        return { isValid: false, error: 'Veuillez sélectionner un channel' }
      }
      return { isValid: true }
    }
  }
}

/**
 * Utilitaires de validation
 */
export class ConfigurationValidator {
  static validateParameter(value: any, parameter: ActionParameter): { isValid: boolean; error?: string } {
    const fieldConfig = FIELD_TYPE_MAPPING[parameter.type]
    if (fieldConfig?.validator) {
      return fieldConfig.validator(value, parameter)
    }
    return { isValid: true }
  }

  static validateConfiguration(parameters: Record<string, any>, actionOrReaction: ServiceAction | ServiceReaction): ConfigurationValidation {
    const parameterValidation: Record<string, ParameterValue> = {}
    const errors: string[] = []
    let isValid = true

    for (const param of actionOrReaction.parameters) {
      const value = parameters[param.name]
      const validation = this.validateParameter(value, param)

      parameterValidation[param.name] = {
        value,
        isValid: validation.isValid,
        error: validation.error
      }

      if (!validation.isValid) {
        isValid = false
        if (validation.error) {
          errors.push(`${param.name}: ${validation.error}`)
        }
      }
    }

    return {
      isValid,
      parameters: parameterValidation,
      errors
    }
  }

  static getDefaultValue(parameter: ActionParameter): any {
    const fieldConfig = FIELD_TYPE_MAPPING[parameter.type]
    return fieldConfig?.defaultValue ?? ''
  }

  static initializeParameters(actionOrReaction: ServiceAction | ServiceReaction): Record<string, any> {
    const parameters: Record<string, any> = {}

    for (const param of actionOrReaction.parameters) {
      parameters[param.name] = this.getDefaultValue(param)
    }

    return parameters
  }
}