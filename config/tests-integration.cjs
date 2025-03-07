/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  env: 'tests-integration',

  db: {
    suffix: 'tests',
  },

  outgoingRequests: {
    baseBanTime: 500,
    retryDelayBase: 1,
  },

  entitiesRelationsTemporaryCache: {
    checkFrequency: 1000,
    ttl: 3 * 1000,
  },

  mocha: {
    timeout: 10000,
  },
}

module.exports = config
