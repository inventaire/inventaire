# supposed to fix the problem with wrong line numbers in stack reports
# in other processes than 'coffee', i.e. mocha
# not working much as such: any thing made the wrong way?

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
    suffix: 'tests'
    debug: true
  graph:
    social: undefined
  godMode: false
