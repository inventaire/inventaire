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

const controller = async params => {
  const uris = await reverseClaims(params)
  return { uris }
}

export default { sanitization, controller }
