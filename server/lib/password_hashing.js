const { useSlowPasswordHashFunction } = require('config')

if (useSlowPasswordHashFunction) {
  module.exports = require('credential')()
} else {
  // Mimicking 'credential' API, should only be used in test environment
  module.exports = {
    hash: async password => fastHash(password),
    verify: async (hash, password) => hash === fastHash(password),
    // In this mode, tokens never expire
    expired: () => false
  }
}

const fastHash = str => Buffer.from(str).toString('hex')
