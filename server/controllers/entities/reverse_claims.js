const reverseClaims = require('./lib/reverse_claims')

const sanitization = {
  property: {},
  value: { type: 'string' },
  refresh: {
    optional: true
  },
  sort: {
    generic: 'boolean',
    default: false
  }
}

const controller = async params => {
  const uris = await reverseClaims(params)
  return { uris }
}

module.exports = { sanitization, controller }
