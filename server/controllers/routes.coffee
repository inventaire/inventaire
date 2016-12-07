CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

auth = require './auth/auth'
user = require './user/user'
items = require './items/items'
users = require './users/users'
relations = require './relations/relations'
invitations = require './invitations/invitations'
groups = require './groups/groups'
entities = require './entities/entities'
upload = require './upload/upload'
resize = require './upload/resize'
notifs = require './notifs'
cookie = require './cookie'
tests = require './tests'
data = require './data'
services = require './services/services'
proxy = require './proxy'
i18n = require './i18n'
feedback = require './feedback'
feeds = require './feeds/feeds'
transactions = require './transactions/transactions'
comments = require './comments/comments'
reports = require './reports/reports'
glob = require './glob'

# routes structure:
# 1 - api is the default prefix for server-side routes
# 2 - the controller / module name
# 3 - 'public' if the route can be called without a session

module.exports = routes =
  'api/auth':
    post: auth.actions

  'api/auth/public':
    get: auth.get
    post: auth.publicActions

  'api/auth/public/token':
    get: auth.token

  'api/user':
    get: user.get
    put: user.update
    delete: user.delete

  'api/users/public':
    get: users.publicActions

  'api/users':
    get: users.actions

  'api/relations':
    get: relations.get
    post: relations.post

  'api/invitations':
    post: invitations.post

  'api/groups':
    get: groups.authentified.get
    post: groups.authentified.post
    put: groups.authentified.put

  'api/groups/public':
    get: groups.public.get

  'api/items':
    get: items.fetch
    put: items.put
    delete: items.del

  'api/items/public':
    get: items.publicActions

  'api/entities':
    post: entities.post
    put: entities.put

  'api/entities/public':
    get: entities.get

  'api/entities/admin':
    put: entities.admin.put

  'api/notifs':
    get: notifs.get
    post: notifs.updateStatus

  'api/cookie/public':
    post: cookie.post

  'api/upload':
    post: upload.post

  'api/tests*':
    post: tests.post

  'api/tests/public*':
    get: tests.get
    post: tests.post
    put: tests.post
    delete: tests.delete

  'api/services/public':
    get: services.get

  'api/data/public':
    get: data.get

  'api/proxy/public*':
    get: proxy
    post: proxy

  'api/feedback/public':
    post: feedback.post

  'api/comments/public':
    get: comments.public.get

  'api/comments':
    post: comments.private.create
    put: comments.private.update
    delete: comments.private.delete

  'api/transactions':
    get: transactions.get
    post: transactions.post
    put: transactions.put

  'api/reports/public':
    post: reports

  'api/config/public':
    # A endpoint dedicated to pass configuration parameters to the client
    get: (req, res)-> res.json CONFIG.client

  'api/feeds/public':
    get: feeds.get

  'img/*':
    get: resize

if CONFIG.logMissingI18nKeys
  routes['api/i18n/public'] =
    post: i18n.i18nMissingKeys

if CONFIG.objectStorage is 'local'
  # the /img endpoint is common to all the object storage modes
  # but this route is served from nginx in other modes
  endpoint = CONFIG.images.urlBase().replace /^\//, ''
  routes["#{endpoint}*"] =
      get: upload.fakeObjectStorage

# setting CONFIG-based routes before the globs
# so that they wont be overpassed by it
_.extend routes,
  'api/*':
    all: glob.api
  '*':
    get: glob.get
