import { getReverseClaims } from './lib/reverse_claims.js'

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

async function controller (params) {
  const uris = await getReverseClaims(params)
  return { uris }
}

export default { sanitization, controller }
