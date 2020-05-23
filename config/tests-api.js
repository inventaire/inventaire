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

  mediaStorage: {
    local: {
      internalEndpoint: () => `http://localhost:${port}/local/`
    }
  },

  leveldbMemoryBackend: true,
  // Disable password hashing to make tests run faster
  hashPasswords: false,
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

  entitiesSearchEngine: {
    updateEnabled: true,
    // Using a custom for testsinstance
    host: 'http://localhost:3214',
    // Go fast to avoid having to wait in tests
    delay: 10,
    elasticsearchUpdateDelay: 3000
  },

  itemsCountDebounceTime: 500
}
