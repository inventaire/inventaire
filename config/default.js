// This config file contains the default values for a development environment.
// Override by creating per-environment files following the same structure
// in this same folder
// See the config module doc: https://npmjs.com/package/config

const contactAddress = 'hello@inventaire.io'

const config = module.exports = {
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
  fullHost: function () {
    return `${this.protocol}://${this.host}:${this.port}`
  },
  publicProtocol: 'http',
  publicHost: 'localhost',
  fullPublicHost: function () {
    return `${this.publicProtocol}://${this.publicHost}:${this.port}`
  },
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
    fullHost: function () {
      return `${this.protocol}://${this.username}:${this.password}@${this.host}:${this.port}`
    },
    username: 'yourcouchdbusername',
    password: 'yourcouchdbpassword',
    auth: function () {
      return `${this.username}:${this.password}`
    },
    suffix: null,
    name: function (dbBaseName) {
      if (this.suffix != null) return `${dbBaseName}-${this.suffix}`
      else return dbBaseName
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

  // See server/controllers/entities/lib/update_search_engine.js
  // and https://github.com/inventaire/entities-search-engine
  entitiesSearchEngine: {
    updateEnabled: false,
    host: 'http://localhost:3213',
    delay: 10000,
    // Set the path to the local repository to allow API tests to start it
    // if it isn't already online
    localPath: '/path/to/repo'
  },

  couch2elastic4sync: {
    activated: true
  },

  // See server/data/dataseed/dataseed.js
  dataseed: {
    enabled: false,
    host: 'http://localhost:9898'
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
  requestsLogger: {
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

  mediaStorage: {
    images: {
      // In pixels
      maxSize: 1600,
      // 5MB
      maxWeight: 5 * Math.pow(1024, 2)
    },
    // By default, media are saved locally instead of using a remote
    // object storage service such as Swift
    mode: 'local',
    local: {
      folder: () => config.universalPath.path('root', 'storage'),
      route: 'local',
      internalEndpoint: function () {
        return `${config.fullHost()}/${this.route}/`
      }
    },
    // Swift parameters are required only when mediaStorage mode is set to 'swift'
    swift: {
      username: 'customizedInLocalConfig',
      password: 'customizedInLocalConfig',
      // Auth URL Without the version section, which is hard coded
      // by server/controllers/images/lib/get_swift_token.js
      authUrl: 'https://openstackEndpointToCustomize',
      publicURL: 'https://swiftPublicURL/',
      tenantName: '12345678',
      region: 'SBG-1',
      internalEndpoint: function () {
        return `${this.publicURL}/`
      }
    }
  },

  // Analytics service
  piwik: {
    enabled: false,
    endpoint: 'https://yourpiwikendpoint/piwik.php',
    idsite: 1,
    rec: 1
  },

  searchTimeout: 10000,

  // Config passed to the client
  // See server/controllers/config.js
  client: {
    piwik: 'https://your.piwik.instance'
  },

  feed: {
    limitLength: 50,
    image: 'https://inventaire.io/public/icon/120.png'
  },

  deduplicateRequests: true,

  // Doc: https://www.mediawiki.org/wiki/OAuth/For_Developers
  // Request tokens at
  // https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose
  wikidataOAuth: {
    consumer_key: 'your-consumer-key',
    consumer_secret: 'your-consumer-secret'
  },

  itemsCountDebounceTime: 5000,

  jobs: {
    'inv:deduplicate': {
      run: true,
      interval: 3000
    }
  }
}
