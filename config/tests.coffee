# Use by setting NODE_ENV=tests
# Will be overriden by local.coffee

module.exports =
  env: 'tests'
  protocol: 'http'
  name: "inventaire"
  host: 'localhost'
  port: 3009
  verbosity: 0
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  db:
    suffix: 'tests'
    # debug: true
    follow:
      reset: true
      freeze: false
      # Give 1000 delay so that tests relying on follow don't have to wait
      delay: 1000
  leveldbMemoryBackend: true
  godMode: false
  # Disable password hashing to make tests run faster
  hashPasswords: false
  piwik:
    enabled: false
  dataseed:
    enabled: false
  deduplicateRequests: false
  mailer:
    disabled: true

  entitiesSearchEngine:
    updateEnabled: true
    # Using a custom for testsinstance
    host: 'http://localhost:3214'
    # Go fast to avoid having to wait in tests
    delay: 10
    elasticsearchUpdateDelay: 3000

  itemsCountDebounceTime: 500
