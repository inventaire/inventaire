#!/usr/bin/env tsx
import config from 'config'
import { capitalizedSoftwareName, pkg, version } from '#lib/package'
import { publicOrigin } from '#server/config'
import type { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types.js'

const { contactAddress } = config

// Specification documentation https://spec.openapis.org/oas/latest.html#fixed-fields
const specs: OpenAPIV3.DocumentV3_1 = {
  openapi: '3.1.1',
  info: {
    title: `${capitalizedSoftwareName} API`,
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
  paths: {},
  components: {},
  webhooks: {},
}

process.stdout.write(JSON.stringify(specs, null, 2) + '\n')
