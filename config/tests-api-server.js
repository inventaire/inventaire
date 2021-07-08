// Custom config for the API tests server
// This config file will be used if: NODE_ENV=tests-api NODE_APP_INSTANCE=server
// Override locally in ./local-tests-api-server.js

module.exports = {
  autoRotateKeys: false,
  dataseed: {
    enabled: false
  },
  mailer: {
    enabled: false
  },
  jobs: {
    'inv:deduplicate': {
      run: true,
      interval: 0
    }
  }
}
