// Common config for the API tests server and the mocha process
// This config file will be used if: NODE_ENV=tests-api
// Override locally in ./local-tests-api.js

const port = 3009

module.exports = {
  env: 'tests-api',
  protocol: 'http',
  host: 'localhost',
  port,
  verbose: false,
  fullHost: function () {
    return `${this.protocol}://${this.host}:${this.port}`
  },
  db: {
    suffix: 'tests',
    // debug: true
    follow: {
      reset: true,
      freeze: false,
      // Give 1000 delay so that tests relying on follow don't have to wait
      delay: 1000
    }
  },

  outgoingRequests: {
    log: true,
    bodyLogLimit: 2000
  },

  mediaStorage: {
    images: {
      checkDelays: {
        update: 200,
        upload: 1000,
      }
    },
    local: {
      internalEndpoint: () => `http://localhost:${port}/local/`
    }
  },

  // Makes tests run faster
  useSlowPasswordHashFunction: false,
  piwik: {
    enabled: false
  },
  dataseed: {
    enabled: false
  },
  deduplicateRequests: false,
  mailer: {
    disabled: true
  },

  itemsCountDebounceTime: 500,
  activitiesDebounceTime: 500,

  oauthServer: {
    authorizationCodeLifetimeMs: 1000
  },
}
