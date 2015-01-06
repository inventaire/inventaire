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
    suffix: 'tests'
    fakeUsers: true
  graph:
    social: undefined
