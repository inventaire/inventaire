module.exports =
  env: 'default'
  protocol: 'http'
  name: 'inventaire'
  host: 'localhost'
  verbosity: 1
  # host: '192.168.1.30'
  port: 3008
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  secret: 'yoursecrethere'
  db:
    instable: true
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@host}:#{@port}"
    users: 'users'
    fakeUsers: false
    inv: 'inventory'
  whitelistedRouteRegExp: /^\/api\/auth\//
  noCache: true
  # noCache: false
  staticMaxAge: 0
  # staticMaxAge: 24*60*60*1000
