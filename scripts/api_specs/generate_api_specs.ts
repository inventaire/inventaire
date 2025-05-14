#!/usr/bin/env tsx
import { writeFile } from 'node:fs/promises'
import config from 'config'
import { capitalize, compact } from 'lodash-es'
import { routes } from '#controllers/routes'
import { absolutePath } from '#lib/absolute_path'
import { softwareName, pkg, version } from '#lib/package'
import { objectKeys } from '#lib/utils/types'
import { buildParameterComponents } from '#scripts/api_specs/lib/parameters'
import { buildEndpointPaths } from '#scripts/api_specs/lib/paths'
import { formatTag } from '#scripts/api_specs/lib/tags'
import { getEndpointSpecs } from '#scripts/api_specs/lib/utils'
import { publicOrigin } from '#server/config'
import type { EndpointSpecs } from '#types/api/specifications'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

const { contactAddress } = config

const endpointsSpecs: EndpointSpecs[] = compact(await Promise.all(objectKeys(routes).map(getEndpointSpecs)))

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
