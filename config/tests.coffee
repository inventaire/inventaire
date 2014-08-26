module.exports =
  env: 'tests'
  protocol: 'http'
  name: "inventaire"
  host: 'localhost'
  port: 3009
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  db:
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@host}:#{@port}"
    users: 'users-tests'
    inv: 'inventory-tests'
  whitelistedRouteRegExp: /^\/api\//