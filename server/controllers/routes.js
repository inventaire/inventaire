const CONFIG = require('config')
const endpoint = require('./endpoint')
const extensionsRedirections = require('./extensions_redirections')
const glob = require('./glob')

// Routes structure:
// 1 - api is the default prefix for server-side routes
// 2 - the controller / module name

const routes = module.exports = {
  'api/auth': endpoint('./auth/auth'),
  'api/config': endpoint('./config'),
  'api/data': endpoint('./data'),
  'api/entities': endpoint('./entities/entities'),
  'api/feedback': endpoint('./feedback'),
  'api/feeds': endpoint('./feeds/feeds'),
  'api/groups': endpoint('./groups/groups'),
  'api/images': endpoint('./images/images'),
  'api/invitations': endpoint('./invitations/invitations'),
  'api/items': endpoint('./items/items'),
  'api/notifications': endpoint('./notifications/notifications'),
  'api/relations': endpoint('./relations/relations'),
  'api/reports': endpoint('./reports/reports'),
  'api/search': endpoint('./search/search'),
  'api/shelves': endpoint('./shelves/shelves'),
  'api/submit': require('./auth/fake_submit'),
  'api/tasks': endpoint('./tasks/tasks'),
  'api/tests*': endpoint('./tests'),
  'api/token': endpoint('./auth/token'),
  'api/transactions': endpoint('./transactions/transactions'),
  'api/user': endpoint('./user/user'),
  'api/users': endpoint('./users/users'),
  'img/*': endpoint('./images/resize'),
  '.well-known/webfinger': endpoint('./activitypub/webfinger')
}

if (CONFIG.logMissingI18nKeys) {
  routes['api/i18n'] = require('./i18n')
}

if (CONFIG.mediaStorage.mode === 'local') {
  // serve images stored on the local file system
  routes['local/*'] = require('./images/local_fs_media_storage')
}

// setting CONFIG-based routes before the globs
// so that they wont be overpassed by it
Object.assign(routes, {
  api: {
    get: glob.redirectToApiDoc
  },
  'api/*': {
    all: glob.api
  },
  '*.json': {
    get: extensionsRedirections.json
  },
  '*.rss': {
    get: extensionsRedirections.rss
  },
  '*': {
    get: glob.get
  }
})
