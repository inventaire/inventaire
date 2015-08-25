CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

auth = require './auth/auth'
user = require './user'
items = require './items/items'
users = require './users'
relations = require './relations/relations'
groups = require './groups/groups'
entities = require './entities/entities'
followed = require './entities/followed'
upload = require './upload'
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

# placeholder for endpoints without a GET
noGet = (req, res)->
  error_.bundle res, 'GET isnt implemented on this route', 400


# routes structure:
# 1 - api is the default prefix for server-side routes
# 2 - the controller / module name
# 3 - 'public' if the route can be called without a session

routes =
  'api/auth':
    get: noGet
    post: auth.actions

  'api/auth/public':
    get: noGet
    post: auth.publicActions

  'api/auth/public/token':
    get: auth.token

  'api/user':
    get: user.getUser
    put: user.updateUser

  'api/users/public':
    get: users.publicActions

  'api/users':
    get: users.actions

  'api/relations':
    get: relations.actions

  'api/groups':
    get: groups.get
    post: groups.post
    put: groups.put

  'api/items':
    get: items.fetch
    put: items.put
    delete: items.del

  'api/items/public':
    get: items.publicActions

  'api/entities':
    get: noGet
    post: entities.create

  'api/entities/followed':
    get: followed.fetch
    post: followed.update

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

  'api/upload/delete':
    post: upload.del

  'api/tests/public':
    get: tests.get
    post: tests.post
    delete: tests.delete

  'api/services/public':
    get: services.get

  'api/services':
    post: services.post

  'api/data/public':
    get: data.get

  'api/proxy/public*':
    get: proxy.get

  'api/feedback/public':
    get: noGet
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

  'error/count':
    get: (req, res, next)->
      res.json { count: _.errorCount() }

  '*':
    get: glob.get

if CONFIG.logMissingI18nKeys
  log =
    'log/i18n':
      post: log.i18nMissingKeys
else log = {}

module.exports = _.extend routes, log