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
  graph:
    social: undefined
  godMode: false
  piwik:
    enabled: false
