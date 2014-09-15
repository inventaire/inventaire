module.exports =
  env: 'default'
  protocol: 'http'
  name: "inventaire"
  host: 'localhost'
  verbose: true
  # host: '0.0.0.0' #problem with Persona Audience for local ip anyway
  # host: '192.168.1.49' #problem with Persona Audience for local ip anyway
  # host: '192.168.42.15' #mobile network
  # host: '192.168.0.24' #charenton
  port: 3008
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  secret: "yoursecrethere"
  db:
    instable: false
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@host}:#{@port}"
    users: 'users'
    inv: 'inventory'
  whitelistedRouteRegExp: /^\/api\/auth\//
  # noCache: true
  noCache: false
  # staticMaxAge: 0
  staticMaxAge: 24*60*60*1000
