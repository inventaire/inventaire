import { compact } from 'lodash-es'
import { sanitizationParameters } from '#lib/sanitize/parameters'
import { getPlace } from '#lib/sanitize/sanitize'
import { objectEntries, objectValues } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import type { EndpointSpecs } from '#types/api/specifications'
import type { HttpMethod } from '#types/common'
import type { ControllerInputSanitization } from '#types/controllers_input_sanitization'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

interface ControllerContext {
  method: HttpMethod
  name: string
  action: string
}

export function buildEndpointPaths (endpointSpecs: EndpointSpecs) {
  const endpointPaths: OpenAPIV3.PathsObject = {}
  const { name, controllers: methodsAndActionsControllers } = endpointSpecs
  for (const [ method, actionsControllersByAccessLevel ] of objectEntries(methodsAndActionsControllers)) {
    for (const actionsControllers of objectValues(actionsControllersByAccessLevel)) {
      for (const [ action, controllerObject ] of objectEntries(actionsControllers)) {
        const path = action === 'default' ? `/${name}` : `/${name}?action=${action}`
        if (typeof controllerObject === 'object') {
          const { metadata, sanitization } = controllerObject
          if (!controllerObject.metadata) warn(`no metadata found for ${path}`)
          const summary = metadata ? metadata.summary : undefined
          endpointPaths[path] ??= {}
          endpointPaths[path][method] = {
            tags: [ name ],
            summary,
            parameters: getParametersSpecs(method, sanitization, { method, name, action: action as string }),
          }
        } else {
          warn(`no metadata found for ${path} (standalone controller function)`)
        }
      }
    }
  }
  return endpointPaths
}

function getParametersSpecs (method: HttpMethod, sanitization: ControllerInputSanitization, context: ControllerContext) {
  return compact(objectEntries(sanitization).map(([ parameterName, controllerParameterConfig ]) => {
    if (typeof controllerParameterConfig !== 'object') return
    const parameterGeneralConfig = sanitizationParameters[parameterName]
    if (parameterGeneralConfig == null) {
      const { name, action } = context
      warn(`missing parameter general config: ${parameterName} (used by ${method.toUpperCase()} /api/${name}?action=${action})`)
      return
    }
    const place = getPlace(method, sanitization)
    const required = !controllerParameterConfig.optional && controllerParameterConfig.default === undefined
    if ('metadata' in parameterGeneralConfig && typeof parameterGeneralConfig.metadata === 'function') {
      return {
        name: parameterName,
        in: place,
        required,
        ...parameterGeneralConfig.metadata(controllerParameterConfig, place),
      }
    } else {
      return {
        $ref: `#/components/parameters/${parameterName}`,
        in: place,
        required,
      }
    }
  }))
}
