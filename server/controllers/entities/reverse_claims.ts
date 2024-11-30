import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { reverseClaims } from './lib/reverse_claims.js'

const sanitization = {
  property: {},
  value: { type: 'string' },
  refresh: {
    optional: true,
  },
  sort: {
    generic: 'boolean',
    default: false,
  },
}

async function controller (params: SanitizedParameters) {
  const { property, value, refresh, sort } = params
  const uris = await reverseClaims({
    property,
    value: value as string,
    refresh,
    sort,
  })
  return { uris }
}

export default { sanitization, controller }
