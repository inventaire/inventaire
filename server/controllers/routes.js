import CONFIG from 'config'
import activitypub from './activitypub/activitypub.js'
import webfinger from './activitypub/webfinger.js'
import auth from './auth/auth.js'
import fakeSubmit from './auth/fake_submit.js'
import oauthClients from './auth/oauth_clients.js'
import oauthServer from './auth/oauth_server.js'
import authToken from './auth/token.js'
import config from './config.js'
import data from './data/data.js'
import { addRoute } from './endpoint.js'
import entities from './entities/entities.js'
import extensionsRedirections from './extensions_redirections.js'
import feedback from './feedback.js'
import feeds from './feeds/feeds.js'
import glob from './glob.js'
import groups from './groups/groups.js'
import i18n from './i18n.js'
import images from './images/images.js'
import localFsMediaStorage from './images/local_fs_media_storage.js'
import resizeImages from './images/resize.js'
import invitations from './invitations/invitations.js'
import items from './items/items.js'
import listings from './listings/listings.js'
import notifications from './notifications/notifications.js'
import relations from './relations/relations.js'
import reports from './reports/reports.js'
import search from './search/search.js'
import shelves from './shelves/shelves.js'
import tasks from './tasks/tasks.js'
import tests from './tests.js'
import transactions from './transactions/transactions.js'
import user from './user/user.js'
import users from './users/users.js'

// Routes structure:
// 1 - api is the default prefix for server-side routes
// 2 - the controller / module name

export const routes = {}

addRoute('api/auth', auth)
addRoute('api/config', config)
addRoute('api/data', data)
addRoute('api/entities', entities)
addRoute('api/feedback', feedback)
addRoute('api/feeds', feeds)
addRoute('api/groups', groups)
addRoute('api/images', images)
addRoute('api/invitations', invitations)
addRoute('api/items', items)
addRoute('api/lists', listings)
addRoute('api/notifications', notifications)
addRoute('api/oauth/authorize', oauthServer.authorize)
addRoute('api/oauth/clients', oauthClients)
addRoute('api/oauth/token', oauthServer.token)
addRoute('api/relations', relations)
addRoute('api/reports', reports)
addRoute('api/search', search)
addRoute('api/shelves', shelves)
addRoute('api/submit', fakeSubmit)
addRoute('api/tasks', tasks)
addRoute('api/tests*', tests)
addRoute('api/token', authToken)
addRoute('api/transactions', transactions)
addRoute('api/user', user)
addRoute('api/users', users)
addRoute('api/activitypub', activitypub)
addRoute('img/*', resizeImages)
addRoute('.well-known/webfinger', webfinger)

if (CONFIG.autofixI18n) {
  addRoute('api/i18n', i18n)
}

if (CONFIG.mediaStorage.mode === 'local') {
  // serve images stored on the local file system
  addRoute('local/*', localFsMediaStorage)
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
