# fixes the problem with wrong line numbers in stack reports
# in other processes than 'coffee', i.e. mocha
require 'coffee-errors'

module.exports =
  env: 'tests'
  protocol: 'http'
  name: "inventaire"
  host: 'localhost'
  port: 3009
  verbosity: 2
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  db:
    instable: true
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@host}:#{@port}"
    users: 'users-tests'
    fakeUsers: true
    inventory: 'inventory-tests'
  graph:
    social: undefined
  whitelistedRouteRegExp: /^\/api\//