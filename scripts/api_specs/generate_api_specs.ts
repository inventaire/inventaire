#!/usr/bin/env tsx
import config from 'config'
import { capitalize, compact, mapValues } from 'lodash-es'
import { specs as entitiesSpecs } from '#controllers/entities/entities'
import { softwareName, pkg, version } from '#lib/package'
import { sanitizationParameters } from '#lib/sanitize/parameters'
import { getPlace } from '#lib/sanitize/sanitize'
import { objectEntries, objectValues } from '#lib/utils/base'
import { publicOrigin } from '#server/config'
import type { HttpMethod } from '#types/common'
import type { MethodsAndActionsControllers } from '#types/controllers'
import type { ControllerInputSanitization, SanitizationParameter } from '#types/controllers_input_sanitization'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

const { contactAddress } = config

function getParametersSpecs (method: HttpMethod, sanitization: ControllerInputSanitization) {
  return compact(objectEntries(sanitization).map(([ parameterName, controllerParameterConfig ]) => {
    if (typeof controllerParameterConfig !== 'object') return
    const parameterGeneralConfig = sanitizationParameters[parameterName]
    const place = getPlace(method, sanitization)
    const required = !controllerParameterConfig.optional && controllerParameterConfig.default === undefined
    if ('metadata' in parameterGeneralConfig && typeof parameterGeneralConfig.metadata === 'function') {
      return {
        name: parameterName,
        in: place,
        required,
        ...parameterGeneralConfig.metadata(controllerParameterConfig),
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

function buildEndpointPaths (name: string, methodsAndActionsControllers: MethodsAndActionsControllers) {
  const endpointPaths: OpenAPIV3.PathsObject = {}
  for (const [ method, actionsControllersByAccessLevel ] of objectEntries(methodsAndActionsControllers)) {
    for (const actionsControllers of objectValues(actionsControllersByAccessLevel)) {
      for (const [ action, controllerObject ] of objectEntries(actionsControllers)) {
        if (typeof controllerObject === 'object' && controllerObject.metadata) {
          const { metadata, sanitization } = controllerObject
          const summary = metadata ? metadata.summary : undefined
          endpointPaths[`/${name}?action=${action}`] ??= {}
          endpointPaths[`/${name}?action=${action}`][method] = {
            tags: [ name ],
            summary,
            parameters: getParametersSpecs(method, sanitization),
          }
        }
      }
    }
  }
  return endpointPaths
}

function buildParameterComponents () {
  return mapValues(sanitizationParameters, (parameter: SanitizationParameter, name: string) => {
    let description: string
    let schema: OpenAPIV3.SchemaObject
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

// Specification documentation https://spec.openapis.org/oas/latest.html#fixed-fields
const specs: OpenAPIV3.DocumentV3_1 = {
  openapi: '3.1.1',
  info: {
    title: `${capitalize(softwareName)} API`,
    version,
    description: '**[Inventaire](https://wiki.inventaire.io/wiki/Inventaire_software) HTTP API documentation**',
    summary: '',
    license: {
      name: pkg.license,
    },
    contact: {
      email: contactAddress,
    },
  },
  servers: [
    {
      url: `${publicOrigin}/api`,
    },
  ],
  paths: {
    ...buildEndpointPaths('entities', entitiesSpecs),
  },
  components: {
    parameters: buildParameterComponents(),
  },
  webhooks: {},
}

process.stdout.write(JSON.stringify(specs, null, 2) + '\n')
process.exit(0)
