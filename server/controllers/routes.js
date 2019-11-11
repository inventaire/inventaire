// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
let routes
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const endpoint = require('./endpoint')
const glob = require('./glob')

// Routes structure:
// 1 - api is the default prefix for server-side routes
// 2 - the controller / module name

module.exports = (routes = {
  'api/auth': endpoint('./auth/auth'),
  'api/token': endpoint('./auth/token'),
  'api/user': endpoint('./user/user'),
  'api/users': endpoint('./users/users'),
  'api/relations': endpoint('./relations/relations'),
  'api/invitations': endpoint('./invitations/invitations'),
  'api/groups': endpoint('./groups/groups'),
  'api/items': endpoint('./items/items'),
  'api/entities': endpoint('./entities/entities'),
  'api/search': endpoint('./search/search'),
  'api/notifications': endpoint('./notifications'),
  'api/images': endpoint('./images/images'),
  'api/tests*': endpoint('./tests'),
  'api/data': endpoint('./data'),
  'api/feedback': endpoint('./feedback'),
  'api/transactions': endpoint('./transactions/transactions'),
  'api/reports': endpoint('./reports/reports'),
  'api/config': endpoint('./config'),
  'api/feeds': endpoint('./feeds/feeds'),
  'api/tasks': endpoint('./tasks/tasks'),
  'api/submit': require('./auth/fake_submit'),
  'img/*': endpoint('./images/resize')
})

if (CONFIG.logMissingI18nKeys) {
  routes['api/i18n'] = require('./i18n')
}

if (CONFIG.mediaStorage.mode === 'local') {
  // serve images stored on the local file system
  const { route: localMediaRoute } = CONFIG.mediaStorage.local
  routes[localMediaRoute + '/*'] = require('./images/local_fs_media_storage')
}

// setting CONFIG-based routes before the globs
// so that they wont be overpassed by it
_.extend(routes, {
  'api': {
    get: glob.redirectToApiDoc
  },
  'api/*': {
    all: glob.api
  },
  '*.json': {
    get: glob.jsonRedirection
  },
  '*': {
    get: glob.get
  }
}
)
