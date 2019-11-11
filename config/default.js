// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// This config file contains the default values for a development environment.
// Override by creating per-environment files following the same structure
// in this same folder
// See the config module doc: https://npmjs.com/package/config

let config
const contactAddress = 'hello@inventaire.io'

module.exports = (config = {
  name: 'inventaire',
  env: 'default',
  host: 'localhost',
  universalPath: require('./universal_path'),
  // Only http is supported: in production, TLS is delegated to Nginx
  // see http://github.com/inventaire/inventaire-deploy
  // protocol: 'http'
  verbosity: 1,
  protocol: 'http',
  port: 3006,
  // Override in ./local.js when working offline to prevent trying to fetch remote resources (like images) when possible
  offline: false,
  fullHost() { return `${this.protocol}://${this.host}:${this.port}` },
  publicProtocol: 'http',
  publicHost: 'localhost',
  fullPublicHost() { return `${this.publicProtocol}://${this.publicHost}:${this.port}` },
  invHost: 'https://inventaire.io',
  secret: 'yoursecrethere',
  // Debug mode:
  // - log requests body
  debug: false,
  // Use to prefix images path to a custom domain, typically used to point to
  // prod server images URLs when working in development with prod databases
  // cf config/prod-dbs.js
  imageRedirection: false,
  // CouchDB settings
  db: {
    protocol: 'http',
    host: 'localhost',
    port: 5984,
    fullHost() { return `${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}` },
    username: 'yourcouchdbusername',
    password: 'yourcouchdbpassword',
    auth() { return `${this.username}:${this.password}` },
    suffix: null,
    name(dbBaseName){
      if (this.suffix != null) { return `${dbBaseName}-${this.suffix}`
      } else { return dbBaseName }
    },
    follow: {
      // Make external indexes restart from the first seq
      reset: false,
      // Allow to activate database events hooks only on certain instances
      // Will always be false when CONFIG.serverMode is false
      freeze: false,
      delay: 5000
    },
    // logs Couchdb requests parameters
    debug: false,
    // Keep the design doc files in sync with CouchDB design docs
    enableDesignDocSync: false,
    backupFolder: '/path/to/backup/folder'
  },
  leveldbMemoryBackend: false,
  elasticsearch: {
    host: 'http://localhost:9200'
  },
  serveStaticFiles: true,
  noCache: false,
  staticMaxAge: 30 * 24 * 60 * 60 * 1000,
  cookieMaxAge: 10 * 365 * 24 * 3600 * 1000,
  bluebird: {
    warnings: false,
    longStackTraces: true
  },
  // Make friends requests and groups invits be automatically accepted
  // can be useful for development
  godMode: false,
  hashPasswords: true,
  // see server/controllers/tests.js
  morgan: {
    mutedDomains: [],
    mutedPath: [
      '/api/reports?action=online'
    ]
  },
  // enable the api/i18n endpoint and its i18nMissingKeys controller
  logMissingI18nKeys: true,

  // parameters for Nodemailer
  mailer: {
    disabled: true,
    preview: true,
    // Rely on SMTP: make sure the appropriate ports are not blocked by your server provider
    // - Scaleway: https://community.online.net/t/solved-smtp-connection-blocked/2262/3
    service: 'yoursettings',
    auth: {
      user: 'yoursettings',
      pass: 'yoursettings'
    },
    defaultFrom: `inventaire.io <${contactAddress}>`,
    initDelay: 10000
  },
  contactAddress,
  activitySummary: {
    disabled: true,
    disableUserUpdate: false,
    maxEmailsPerHour: 5,
    // the key to find the current news string
    newsKey: 'news_1',
    didYouKnowKeyCount: 5
  },
  // time of validity for email validation tokens
  tokenDaysToLive: 3,
  debouncedEmail: {
    crawlPeriod: 10 * 60 * 1000,
    debounceDelay: 30 * 60 * 1000,
    disabled: false
  },

  // By default, media are saved locally instead of using a remove
  // object storage service such as Swift
  mediaStorage: {
    images: {
      maxSize: 1600,
      // 5MB
      maxWeight: 5 * Math.pow(1024, 2)
    },
    mode: 'local',
    // Swift parameters are required only when mediaStorage mode is set to 'swift'
    swift: {
      username: 'customizedInLocalConfig',
      password: 'customizedInLocalConfig',
      authUrl: 'https://openstackEndpointToCustomize/v2.0',
      publicURL: 'https://swiftPublicURL/',
      tenantName: '12345678',
      region: 'SBG-1',
      internalEndpoint() { return this.publicURL + '/' }
    },
    local: {
      folder() { return config.universalPath.path('root', 'storage') },
      route: 'local',
      internalEndpoint() { return `${config.fullHost()}/${this.route}/` }
    }
  },

  // Analytics service
  piwik: {
    enabled: false,
    endpoint: 'https://yourpiwikendpoint/piwik.php',
    idsite: 1,
    rec: 1
  },
  // see server/data/dataseed/search.js
  dataseed: {
    enabled: false,
    host: 'http://localhost:9898'
  },
  searchTimeout: 10000,

  gitlabLogging: {
    enabled: false,
    host: 'https://gitlab.server.tld',
    user: 'gitlab.user',
    token: 'USER_GITLAB_TOKEN',
    project_id: 114,
    assignee_id: 2
  },

  // Config passed to the client
  client: {
    piwik: 'https://your.piwik.instance'
  },

  feed: {
    limitLength: 50,
    image: 'https://inventaire.io/public/icon/120.png'
  },

  deduplicateRequests: true,

  // See https://github.com/inventaire/entities-search-engine
  entitiesSearchEngine: {
    updateEnabled: false,
    host: 'http://localhost:3213',
    delay: 10000,
    // Set the path to the local repository to allow API tests to start it
    // if it isn't already online
    localPath: '/path/to/repo'
  },

  // Doc: https://www.mediawiki.org/wiki/OAuth/For_Developers
  // Request tokens at
  // https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
  wikidataOAuth: {
    consumer_key: 'your-consumer-key',
    consumer_secret: 'your-consumer-secret'
  },

  couch2elastic4sync: {
    activated: true
  },

  itemsCountDebounceTime: 5000,

  jobs: {
    'inv:deduplicate': {
      run: true,
      interval: 3000
    }
  }
})
