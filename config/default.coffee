appRoot = require('app-root-path').path

module.exports =
  env: 'default'
  protocol: 'http'
  name: 'inventaire'
  host: 'localhost'
  verbosity: 1
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
    inventory: 'inventory'
  graph:
    social: 'social_graph'
  whitelistedRouteRegExp: /^\/api\/auth\//
  # noCache: true
  noCache: false
  # staticMaxAge: 0
  staticMaxAge: 24*60*60*1000
  aws:
    key: 'customizedInLocalConfig'
    secret: 'customizedInLocalConfig'
    region: 'customizedInLocalConfig'
    bucket: 'customizedInLocalConfig'
  root:
    paths:
      root: ''
      server: '/server'
      lib: '/server/lib'
      sharedLibs: '/client/app/lib/shared'
      db: '/server/lib/db'
      graph: '/server/lib/graph'
      builders: '/server/builders'
      controllers: '/server/controllers'
      leveldb: '/leveldb'
      couchdb: '/couchdb'
    path: (route, name)->
      path = @paths[route]
      return "#{appRoot}#{path}/#{name}"
    'require': (route, name)-> require @path(route, name)