module.exports = {
  env: 'tests-integration',

  db: {
    suffix: 'tests'
  },

  leveldbMemoryBackend: false,

  outgoingRequests: {
    baseBanTime: 500
  },

  entitiesRelationsTemporaryCache: {
    checkFrequency: 1000,
    ttl: 3 * 1000
  },

  mocha: {
    timeout: 10000,
  },
}
