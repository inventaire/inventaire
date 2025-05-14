#!/usr/bin/env tsx
import { writeFile } from 'node:fs/promises'
import config from 'config'
import { capitalize, compact, mapValues, pick } from 'lodash-es'
import { routes } from '#controllers/routes'
import { absolutePath } from '#lib/absolute_path'
import { softwareName, pkg, version } from '#lib/package'
import { sanitizationParameters } from '#lib/sanitize/parameters'
import { getPlace } from '#lib/sanitize/sanitize'
import { objectEntries, objectValues } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import { objectKeys } from '#lib/utils/types'
import { getEndpointSpecs } from '#scripts/api_specs/lib/utils'
import { publicOrigin } from '#server/config'
import type { EndpointSpecs } from '#types/api/specifications'
import type { HttpMethod } from '#types/common'
import type { ControllerInputSanitization, SanitizationParameter } from '#types/controllers_input_sanitization'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

const { contactAddress } = config

const endpointsSpecs: EndpointSpecs[] = compact(await Promise.all(objectKeys(routes).map(getEndpointSpecs)))

interface ControllerContext {
  method: HttpMethod
  name: string
  action: string
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

function buildEndpointPaths (endpointSpecs: EndpointSpecs) {
  const endpointPaths: OpenAPIV3.PathsObject = {}
  const { name, controllers: methodsAndActionsControllers } = endpointSpecs
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
            parameters: getParametersSpecs(method, sanitization, { method, name, action: action as string }),
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

function formatTag (endpointSpecs: EndpointSpecs) {
  return pick(endpointSpecs, [ 'name', 'description', 'externalDocs' ])
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
  paths: Object.assign({}, ...endpointsSpecs.map(buildEndpointPaths)),
  components: {
    parameters: buildParameterComponents(),
  },
  webhooks: {},
  tags: endpointsSpecs.map(formatTag),
}

const filePath = absolutePath('client', 'public/api_specs.json')

await writeFile(filePath, JSON.stringify(specs, null, 2) + '\n')

process.exit(0)
