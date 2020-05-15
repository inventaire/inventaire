// Common config for the API tests server and the mocha process
// This config file will be used if: NODE_ENV=tests-unit
// Override locally in ./local-tests-unit.js

module.exports = {
  env: 'tests-unit',
  verbose: false,
  leveldbMemoryBackend: true
}
