contactAddress = 'hello@inventaire.io'

module.exports = config =
  env: 'dev'
  universalPath: require './universal_path'
  offline: false
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
    # make external indexes restart from the first seq
    resetFollow: false
    # use freezeFollow for cases when following the database would have undesired effects
    # ex: without freezeFollow, scripts connecting to a remote database (like scripts/increment_undelivered_email_count)
    # would trigger follow onChange actions with the data from the remote database
    freezeFollow: false
    # logs Couchdb requests parameters
    debug: false
  noCache: false
  staticMaxAge: 30*24*60*60*1000
  cookieMaxAge: 10*365*24*3600*1000
  https:
    key: '/cert/inventaire.key'
    cert: '/cert/inventaire.csr'
  typeCheck: true
  bluebird:
    warnings: true
    longStackTraces: true
  godMode: false # friends requests and groups invits automatically accepted
  cookieThief: false
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
  contactAddress: contactAddress
  mailer:
    disabled: true
    preview: true
    service: 'yoursettings',
    auth:
      user: 'yoursettings'
      pass: 'yoursettings'
    defaultFrom: "inventaire.io <#{contactAddress}>"
    initDelay: 10000
  activitySummary:
    disabled: true
    disableUserUpdate: false
    # in days
    maxEmailsPerHour: 5
    # the key to find the current news string
    newsKey: 'news_1'
    didYouKnowKey: 'did_you_know_1'
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
  images:
    urlBase: -> '/local/'
    localEndpoint: -> config.fullHost() + @urlBase()
    maxSize: 1600
    # 5MB
    maxWeight: 5*1024**2
  prerender:
    # specify the ip of the prerender server
    # to eventually filter it out
    ip: null
    # setting prerendere's quota to half Google Books quota
    quota: 500
  piwik:
    enabled: false
    endpoint: 'https://yourpiwikendpoint/piwik.php'
    idsite: 1
    rec: 1
  elasticsearch:
    base: 'http://localhost:9200/inventaire'
    sync: [
      { database: 'entities', type: 'entity' }
      # Unblock: solve https://github.com/ryanramage/couch2elastic4sync/issues/14
      # { database: 'users', type: 'user' }
      # { database: 'users', type: 'group'}
    ]
