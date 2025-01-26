// Common config for the API tests server and the mocha process
// This config file will be used if: NODE_ENV=tests-api
// Override locally in ./local-tests-api.cjs

/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  env: 'tests-api',
  protocol: 'http',
  hostname: 'localhost',
  port: 3009,
  verbose: false,
  db: {
    suffix: 'tests',
    // debug: true
    follow: {
      reset: true,
      freeze: false,
      // Give 1000 delay so that tests relying on follow don't have to wait
      delay: 1000,
    },
  },

  outgoingRequests: {
    bodyLogLimit: 2000,
  },

  mediaStorage: {
    images: {
      checkDelays: {
        update: 200,
        upload: 1000,
      },
    },
  },

  // Makes tests run faster
  useSlowPasswordHashFunction: false,
  matomo: {
    enabled: false,
  },
  dataseed: {
    enabled: false,
  },
  deduplicateRequests: false,
  mailer: {
    disabled: true,
  },

  snapshotsDebounceTime: 500,

  oauthServer: {
    authorizationCodeLifetimeMs: 1000,
  },

  activitypub: {
    sanitizeUrls: false,
    activitiesDebounceTime: 500,
  },
}

module.exports = config
