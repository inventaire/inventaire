// Custom config for the API tests server
// This config file will be used if: NODE_ENV=tests-api NODE_APP_INSTANCE=server
// Override locally in ./local-tests-api-server.js

/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  autoRotateKeys: false,
  dataseed: {
    enabled: false,
  },
  mailer: {
    disabled: true,
  },
  jobs: {
    'inv:deduplicate': {
      run: true,
    },
    'entity:popularity': {
      run: true,
    },
    'wd:entity:indexation': {
      run: true,
    },
  },
  nice: false,
  elasticsearch: {
    minReindexationInterval: 0,
  },
}

module.exports = config
