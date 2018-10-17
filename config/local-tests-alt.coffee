# Custom config for API tests
# Use NODE_APP_INSTANCE=tests-alt to override local config with local-tests config

module.exports =
  dataseed:
    enabled: false
  mailer:
    enabled: false
  leveldbMemoryBackend: false
  jobs:
    'wd:popularity':
      run: false
    'inv:deduplicate':
      run: true
      interval: 0
