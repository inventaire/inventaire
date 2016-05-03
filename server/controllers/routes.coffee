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
newsletter = require './newsletter'
cookie = require './cookie'
tests = require './tests'
data = require './data'
services = require './services/services'
proxy = require './proxy'
glob = require './glob'
log = require './log'
feedback = require './feedback'
transactions = require './transactions/transactions'
comments = require './comments/comments'
analytics = require './analytics/analytics'

# routes structure:
# 1 - api is the default prefix for server-side routes
# 2 - the controller / module name
# 3 - 'public' if the route can be called without a session

routes =
  'api/auth':
    post: auth.actions

  'api/auth/public':
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
    post: relations.post

  'api/invitations':
    post: invitations.post

  'api/groups':
    post: groups.post
    put: groups.put

  'api/groups/public':
    get: groups.get

  'api/items':
    get: items.fetch
    put: items.put
    delete: items.del

  'api/items/public':
    get: items.publicActions

  'api/entities':
    post: entities.create

  'api/entities/public':
    get: entities.actions

  'api/notifs':
    post: notifs.updateStatus

  'api/newsletter/public':
    post: newsletter.subscribe

  'api/cookie':
    post: cookie.post

  'api/upload':
    post: upload.post

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

  'api/logs/public':
    post: analytics.reports

  'api/*':
    all: glob.api

  'error/count':
    get: (req, res, next)->
      res.json { count: _.errorCount() }

  'img/*':
    get: resize

  '*':
    get: glob.get

if CONFIG.logMissingI18nKeys
  log =
    'log/i18n':
      post: log.i18nMissingKeys
else log = {}

img = {}
if CONFIG.objectStorage is 'local'
  # the /img endpoint is common to all the object storage modes
  # but this route is served from nginx in other modes
  endpoint = CONFIG.images.urlBase().replace /^\//, ''
  img["#{endpoint}*"] =
      get: upload.fakeObjectStorage

# setting CONFIG-based route above standard routes
# so that they wont be overpassed by the glob
module.exports = _.extend log, img, routes