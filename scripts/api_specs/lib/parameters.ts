import { mapValues } from 'lodash-es'
import { sanitizationParameters } from '#lib/sanitize/parameters'
import type { SanitizationParameter } from '#types/controllers_input_sanitization'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

export function buildParameterComponents () {
  return mapValues(sanitizationParameters, (parameter: SanitizationParameter, name: string) => {
    let description: string
    let schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
    let example: string
    if ('metadata' in parameter && typeof parameter.metadata === 'object') {
      const { metadata } = parameter
      if ('description' in metadata) description = metadata.description
      if ('schema' in metadata) schema = metadata.schema
      if ('example' in metadata) example = metadata.example
    }
    return {
      name,
      description,
      schema,
      example,
      // Placeholder to please the type checker, will be overriden in specs.paths
      in: 'query',
    }
  })
}
