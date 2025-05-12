import type { genericParameters, sanitizationParameters } from '#lib/sanitize/parameters'

export type ParameterName = string
type WellknownParameterName = keyof typeof sanitizationParameters
type WellknownSanitizationParameter = typeof sanitizationParameters[WellknownParameterName]
export type GenericParameterName = keyof typeof genericParameters
type GenericSanitizationParameter = typeof genericParameters[GenericParameterName]
export type SanitizationParameter = WellknownSanitizationParameter | GenericSanitizationParameter

export type ParameterPlace = 'query' | 'body'

export interface ControllerSanitizationParameterConfig {
  allowlist?: readonly string[]
  canBeNull?: boolean
  default?: unknown
  drop?: boolean
  max?: number
  optional?: boolean
  type?: string
  generic?: GenericParameterName
}

type ControllerInputSanitizationOptions = {
  nonJsonBody: boolean
}

export type ControllerInputSanitization = Record<string, ControllerSanitizationParameterConfig> & Partial<ControllerInputSanitizationOptions>

export type FormatFunction = (value: string, name: ParameterName, config: ControllerSanitizationParameterConfig) => unknown
export type RenameFunction = (name: ParameterName, config: ControllerSanitizationParameterConfig) => string
