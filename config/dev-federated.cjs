// This config file will be used if: NODE_ENV=dev NODE_APP_INSTANCE=federated
// Override locally in ./local-dev-federated.cjs

/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  env: 'federated',

  instanceName: 'fed-inv',
  orgName: 'Example Organization',
  orgUrl: 'https://inventaire.example.org',

  // By convention, federated server port = (equivalent default server port + 10)
  port: 3016,
  db: {
    suffix: 'federated',
  },
  federation: {
    remoteEntitiesOrigin: 'http://localhost:3006',
  },
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

  mediaStorage: {
    mode: 'local',
    local: {
      // Storage path relative to the project root
      directory: './storage_federated',
    },
  },
}

module.exports = config
