module.exports = {
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
  }
}
