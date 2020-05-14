// Custom config for the API tests mocha process
// This config file will be used if: NODE_ENV=tests-api NODE_APP_INSTANCE=mocha
// Override locally in ./local-tests-api-mocha.js

module.exports = {
  mocha: {
    // Fit to match the needs of the slowest API,
    // but can most of the time be overriden in ./local.js config with a lower value
    timeout: 20000
  }
}
