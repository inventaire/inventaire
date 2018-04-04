# This config file contains the default values for a development environment.
# Override by creating per-environment files following the same structure
# in this same folder
# See the config module doc: https://npmjs.com/package/config

contactAddress = 'hello@inventaire.io'

module.exports = config =
  name: 'inventaire'
  env: 'default'
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
  # Use to prefix images path to a custom domain, typically used to point to
  # prod server images URLs when working in development with prod databases
  # cf config/prod-dbs.coffee
  imageRedirection: false
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
    follow:
      # Make external indexes restart from the first seq
      reset: false
      # Use freezeFollow for cases when following the database would have
      # undesired effects. Ex: without freezeFollow, scripts connecting to a
      # remote database (like scripts/increment_undelivered_email_count) would
      # trigger follow onChange actions with the data from the remote database
      # follow.freeze is thus always activated in non-serverMode
      # cf server/lib/follow.coffee
      freeze: false
      delay: 5000
    # logs Couchdb requests parameters
    debug: false
    # Keep the design doc files in sync with CouchDB design docs
    enableDesignDocSync: false
    # db settings for script actions
    # see scripts/lib/action_by_input.coffee
    actionsScripts:
      port: 3456
      suffix: 'prod'
  leveldbMemoryBackend: false
  elasticsearch:
    host: 'http://localhost:9200'
  serveStaticFiles: true
  noCache: false
  staticMaxAge: 30*24*60*60*1000
  cookieMaxAge: 10*365*24*3600*1000
  typeCheck: true
  bluebird:
    warnings: false
    longStackTraces: true
  # Make friends requests and groups invits be automatically accepted
  # can be useful for development
  godMode: false
  hashPasswords: true
  # see server/controllers/tests.coffee
  morgan:
    mutedDomains: []
    mutedPath: [
      '/api/reports?action=online'
    ]
  # enable the api/i18n endpoint and its i18nMissingKeys controller
  logMissingI18nKeys: true
  # disable restrictApiAccess middleware: no more Auth required
  apiOpenBar: false
  # reset server/lib/cache.coffee
  resetCacheAtStartup: false

  # parameters for Nodemailer
  mailer:
    disabled: true
    preview: true
    # Rely on SMTP: make sure the appropriate ports are not blocked by your server provider
    # - Scaleway: https://community.online.net/t/solved-smtp-connection-blocked/2262/3
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
    maxEmailsPerHour: 5
    # the key to find the current news string
    newsKey: 'news_1'
    didYouKnowKeyCount: 5
  # time of validity for email validation tokens
  tokenDaysToLive: 3
  debouncedEmail:
    crawlPeriod: 10*60*1000
    debounceDelay: 30*60*1000
    disabled: false

  # By default, media are saved locally instead of using a remove
  # object storage service such as Swift
  objectStorage: 'local'
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
    piwik: 'https://your.piwik.instance'
    ipfs:
      gateway: 'https://ipfs.io'

  feed:
    limitLength: 50
    image: 'https://inventaire.io/public/icon/120.png'

  deduplicateRequests: true

  # See https://github.com/inventaire/entities-search-engine
  entitiesSearchEngine:
    updateEnabled: false
    host: 'http://localhost:3213'
    delay: 10000
    # Set the path to the local repository to allow api_tests to start it
    # if it isn't already online
    localPath: '/path/to/repo'

  # Doc: https://www.mediawiki.org/wiki/OAuth/For_Developers
  # Request tokens at
  # https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
  wikidataOAuth:
    consumer_key: 'your-consumer-key'
    consumer_secret: 'your-consumer-secret'

  couch2elastic4sync:
    activated: true

  itemsCountDebounceTime: 5000

  runJobsInQueue: true
  wdPopularityWorkerDelay: 3000
