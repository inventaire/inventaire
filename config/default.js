// This config file contains the default values for all environments.
// Override by creating per-environment files following the same structure
// in this same folder
// See the config module doc: https://github.com/lorenwest/node-config/wiki/Configuration-Files

const port = 3006
const contactAddress = 'hello@inventaire.io'

const config = module.exports = {
  name: 'inventaire',
  env: 'default',
  host: 'localhost',
  universalPath: require('./universal_path'),
  // Only http is supported: in production, TLS is delegated to Nginx
  // see http://github.com/inventaire/inventaire-deploy
  // protocol: 'http'
  verbose: true,
  protocol: 'http',
  port,
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
  // To allow fallback between servers, they need to share the same session keys:
  // one should have autoRotateKeys=true and the others autoRotateKeys=false
  autoRotateKeys: true,
  // Force to renew cookies at least every 6 months
  cookieMaxAge: 180 * 24 * 3600 * 1000,
  incomingRequests: {
    logBody: false
  },

  outgoingRequests: {
    log: true,
    bodyLogLimit: 500,
    baseBanTime: 5000,
    banTimeIncreaseFactor: 4
  },
  // CouchDB settings
  db: {
    protocol: 'http',
    hostname: 'localhost',
    port: 5984,
    username: 'yourcouchdbusername',
    password: 'yourcouchdbpassword',
    suffix: null,
    fullHost: function () {
      return `${this.protocol}://${this.username}:${this.password}@${this.hostname}:${this.port}`
    },
    databaseUrl: function (dbBaseName) {
      return `${this.protocol}://${this.hostname}:${this.port}/${this.name(dbBaseName)}`
    },
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
    backupFolder: 'backups/couchdb'
  },

  leveldb: {
    inMemoryLRUCacheSize: 64 * 1024 ** 2,
    memoryBackend: false,
  },

  elasticsearch: {
    host: 'http://localhost:9200',
    updateDelay: 1000
  },

  // See server/data/dataseed/dataseed.js
  dataseed: {
    enabled: false,
    host: 'http://localhost:9898'
  },

  serveStaticFiles: true,

  useSlowPasswordHashFunction: true,
  requestsLogger: {
    // Use to mute certain requests if it gets too noisy or you want to focus on a certain domain
    // Possible values: js, css, img, api
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
      maxWeight: 5 * 1024 ** 2,
      checkDelays: {
        update: 2000,
        upload: 5 * 60 * 1000,
      }
    },
    // By default, media are saved locally instead of using a remote
    // object storage service such as Swift
    mode: 'local',
    local: {
      folder: () => config.universalPath.path('root', 'storage'),
      internalEndpoint: () => `http://localhost:${port}/local/`
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
  },

  entitiesRelationsTemporaryCache: {
    checkFrequency: 10 * 60 * 1000,
    ttl: 4 * 60 * 60 * 1000
  },

  oauthServer: {
    authorizationCodeLifetimeMs: 5 * 60 * 1000
  }
}
