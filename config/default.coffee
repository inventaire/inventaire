appRoot = require('app-root-path').path

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
    path:
      root: (name = '')-> "#{appRoot}/"
      server: (name = '')-> "#{appRoot}/server/#{name}"
      lib: (name = '')-> "#{appRoot}/server/lib/#{name}"
      sharedLibs: (name = '')-> "#{appRoot}/client/app/lib/shared/#{name}"
      builders: (name = '')-> "#{appRoot}/server/builders/#{name}"
      controllers: (name = '')-> "#{appRoot}/server/controllers/#{name}"
      graph: (name = '')-> "#{appRoot}/server/lib/graph/#{name}"
      leveldb: (name = '')-> "#{appRoot}/leveldb/#{name}"
    'require': (route, name)-> require @path[route](name)