appRoot = require('app-root-path').path

module.exports =
  env: 'default'
  protocol: 'https'
  name: 'inventaire'
  host: 'localhost'
  verbosity: 1
  port: 3008
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  secret: 'yoursecrethere'
  db:
    instable: true
    protocol: 'https'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@username}:#{@password}@#{@host}:#{@port}"
    username: 'yourcouchdbusername'
    password: 'yourcouchdbpassword'
    auth: -> "#{@username}:#{@password}"
    names: [
      'users'
      'inventory'
      'entities'
    ]
    suffix: null
    name: (base)->
      if @suffix? then return "#{base}-#{@suffix}"
      else base
    fakeUsers: false
    restricted: true
  noCache: false
  staticMaxAge: 30*24*60*60*1000
  aws:
    key: 'customizedInLocalConfig'
    secret: 'customizedInLocalConfig'
    region: 'customizedInLocalConfig'
    bucket: 'customizedInLocalConfig'
    protocol: 'http'
  root:
    paths:
      root: ''
      server: '/server'
      lib: '/server/lib'
      utils: '/server/lib/utils'
      sharedLibs: '/client/app/lib/shared'
      data: '/server/data'
      db: '/server/db'
      couch: '/server/db/couch'
      level: '/server/db/level'
      graph: '/server/db/level/graph'
      builders: '/server/builders'
      controllers: '/server/controllers'
      leveldb: '/db/leveldb'
      couchdb: '/db/couchdb'
      client: '/client'
    path: (route, name)->
      path = @paths[route]
      return "#{appRoot}#{path}/#{name}"
    require: (route, name)-> require @path(route, name)
  https:
    key: '/cert/inventaire.key'
    cert: '/cert/inventaire.csr'
  typeCheck: true
  promisesStackTrace: true
  godMode: false # friends requests automatically accepted
  monitoring: false
  morganLogFormat: 'dev'
  logStaticFilesRequests: true
  sendServerErrorsClientSide: true
  logMissingI18nKeys: true
  apiOpenBar: false
