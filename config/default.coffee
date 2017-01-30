# This config file contains the default values for a development environment.
# Override by creating per-environment files following the same structure
# in this same folder
# See the config module doc: https://npmjs.com/package/config

contactAddress = 'hello@inventaire.io'

module.exports = config =
  name: 'inventaire'
  env: 'dev'
  host: 'localhost'
  universalPath: require './universal_path'
  # Only http is supported: in production, TLS is delegated to Nginx
  # see http://github.com/inventaire/inventaire-deploy
  # protocol: 'http'
  verbosity: 1
  protocol: 'http'
  port: 3006
  # Override in ./local.coffee when working offline to prevent trying to fetch remote resources (like images) when possible
  offline: false
  fullHost: -> "#{@protocol}://#{@host}:#{@port}"
  publicProtocol: 'http'
  publicHost: 'localhost'
  fullPublicHost: -> "#{@publicProtocol}://#{@publicHost}:#{@port}"
  invHost: 'https://inventaire.io'
  secret: 'yoursecrethere'
  # Debug mode:
  # - log requests body
  debug: false

  # CouchDB settings
  db:
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
    # make external indexes restart from the first seq
    resetFollow: false
    # use freezeFollow for cases when following the database would have undesired effects
    # ex: without freezeFollow, scripts connecting to a remote database (like scripts/increment_undelivered_email_count)
    # would trigger follow onChange actions with the data from the remote database
    freezeFollow: false
    # logs Couchdb requests parameters
    debug: false
    # db settings for script actions
    # see scripts/lib/action_by_input.coffee
    actionsScripts:
      port: 3456
      suffix: 'prod'
      # prevent triggering follow onChange actions with data from the remote database
      freezeFollow: true
  elasticsearch:
    base: 'http://localhost:9200/inventaire'
    sync: [
      { database: 'entities', type: 'entity' }
      # Unblock: solve https://github.com/ryanramage/couch2elastic4sync/issues/14
      # { database: 'users', type: 'user' }
      # { database: 'users', type: 'group'}
    ]

  serveStaticFiles: true
  noCache: false
  staticMaxAge: 30*24*60*60*1000
  cookieMaxAge: 10*365*24*3600*1000
  typeCheck: true
  bluebird:
    warnings: true
    longStackTraces: true
  # Make friends requests and groups invits be automatically accepted
  # can be useful for development
  godMode: false
  # see server/controllers/tests.coffee
  morgan:
    logFormat: 'dev'
    mutedRoutes: [
      '/api/logs/public'
    ]
  logStaticFilesRequests: true
  # enable the api/i18n/public endpoint and its i18nMissingKeys controller
  logMissingI18nKeys: true
  # disable restrictApiAccess middleware: no more Auth required
  apiOpenBar: false
  # reset server/lib/cache.coffee
  resetCacheAtStartup: false

  # parameters for Nodemailer
  mailer:
    disabled: true
    preview: true
    service: 'yoursettings',
    auth:
      user: 'yoursettings'
      pass: 'yoursettings'
    defaultFrom: "inventaire.io <#{contactAddress}>"
    initDelay: 10000
  contactAddress: contactAddress
  activitySummary:
    disabled: true
    disableUserUpdate: false
    # in days
    maxEmailsPerHour: 5
    # the key to find the current news string
    newsKey: 'news_1'
    didYouKnowKey: 'did_you_know_1'
  # use mailgun API to validate emails
  emailValidation:
    activated: false
    mailgunPubkey: 'yourkey'
  # time of validity for email validation tokens
  tokenDaysToLive: 3
  debouncedEmail:
    crawlPeriod: 10*60*1000
    debounceDelay: 30*60*1000

  # By default, media are saved locally instead of using a remove
  # object storage service such as Swift or AWS
  objectStorage: 'local'
  # AWS credentials are requierd only when objectStorage is set to 'aws'
  aws:
    key: 'customizedInLocalConfig'
    secret: 'customizedInLocalConfig'
    region: 'customizedInLocalConfig'
    bucket: 'customizedInLocalConfig'
    protocol: 'http'
  # Swift parameters are requierd only when objectStorage is set to 'swift'
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

  # Analytics service
  piwik:
    enabled: false
    endpoint: 'https://yourpiwikendpoint/piwik.php'
    idsite: 1
    rec: 1
  # see server/data/dataseed/search.coffee
  dataseed:
    enabled: false
    host: 'http://localhost:9898'
  ipfs:
    # activate if you have a local instance running
    enabled: false
    localGateway: 'http://localhost:8080'
    publicGateway: 'https://ipfs.io'
  searchTimeout: 10000

  gitlabLogging:
    enabled: false
    host: 'https://gitlab.server.tld'
    user: 'gitlab.user'
    token: 'USER_GITLAB_TOKEN'
    project_id: 114
    assignee_id: 2

  # Config passed to the client
  client:
    elasticsearch:
      wikidata: 'https://data.inventaire.io/wikidata'
    ipfs:
      gateway: 'https://ipfs.io'
