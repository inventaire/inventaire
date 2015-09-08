appRoot = require('app-root-path').path

module.exports =
  env: 'default'
  protocol: 'http'
  name: 'inventaire'
  host: 'localhost'
  publicHost: 'localhost'
  verbosity: 1
  port: 3006
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  fullPublicHost: -> "#{@protocol}://#{@publicHost}:#{@port}"
  secret: 'yoursecrethere'
  db:
    unstable: true
    reloadDesignDocs: false
    protocol: 'http'
    host: 'localhost'
    port: 5984
    fullHost: -> "#{@protocol}://#{@username}:#{@password}@#{@host}:#{@port}"
    username: 'yourcouchdbusername'
    password: 'yourcouchdbpassword'
    auth: -> "#{@username}:#{@password}"
    suffix: null
    name: (dbBaseName)->
      if @suffix? then return "#{dbBaseName}-#{@suffix}"
      else dbBaseName
    fakeUsers: false
    restricted: true
  noCache: false
  staticMaxAge: 30*24*60*60*1000
  cookieMaxAge: 10*365*24*3600*1000
  root:
    paths:
      root: ''
      server: '/server'
      lib: '/server/lib'
      models: '/server/models'
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
      i18nSrc: '/server/lib/emails/i18n/src'
      i18nArchive: '/server/lib/emails/i18n/src/archive'
      i18nTransifex: '/server/lib/emails/i18n/src/transifex'
      i18nDist: '/server/lib/emails/i18n/dist'
      client: '/client'
      scripts: '/scripts'
      uploads: '/client/public/uploads'
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
  morgan:
    logFormat: 'dev'
    mutedRoutes: [
      '/api/logs/public'
    ]
  logStaticFilesRequests: true
  sendServerErrorsClientSide: true
  logMissingI18nKeys: true
  apiOpenBar: false
  resetCacheAtStartup: false
  serveStatic: true
  mailer:
    disabled: true
    service: 'yoursettings',
    auth:
      user: 'yoursettings'
      pass: 'yoursettings'
  emailValidation:
    activated: false
    pubkey: 'yourkey'
  tokenDaysToLive: 3
  debouncedEmail:
    crawlPeriod: 10*60*1000
    debounceDelay: 30*60*1000
  # google Books keys are to be generated in
  # https://console.developers.google.com/project
  googleBooks:
    useKey: false
    key: 'yourkey'
  fallback:
    wdq: 'http://your-inv-wdq-instance:1234'
  imagesUrlBase: -> @fullHost() + '/img/'
  objectStorage: 'local'
  # AWS credentials are requierd only when objectStorage is set to 'aws'
  aws:
    key: 'customizedInLocalConfig'
    secret: 'customizedInLocalConfig'
    region: 'customizedInLocalConfig'
    bucket: 'customizedInLocalConfig'
    protocol: 'http'
  swift:
    username: 'customizedInLocalConfig'
    password: 'customizedInLocalConfig'
    authUrl: 'https://openstackEndpointToCustomize/v2.0'
    publicURL: 'https://swiftPublicURL/'
    tenantName: '12345678'
    region: 'SBG-1'
    container: 'customizedInLocalConfig'
