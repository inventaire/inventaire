CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

auth = require './auth/auth'
user = require './user'
items = require './items/items'
users = require './users'
relations = require './relations/relations'
entities = require './entities/entities'
followed = require './entities/followed'
upload = require './upload'
notifs = require './notifs'
data = require './data'
services = require './services/services'
proxy = require './proxy'
glob = require './glob'
log = require './log'
feedbacks = require './feedbacks'
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

  'api/users':
    get: users.actions

  'api/relations':
    get: relations.actions

  'api/items':
    get: items.fetch

  'api/items/public':
    get: items.publicActions

  'api/items/:id':
    put: items.put

  'api/items/:id/:rev':
    delete: items.del

  'api/:user/items/:id':
    put: items.put
  'api/:user/items/:id/:rev':
    put: items.put
    delete: items.del

  'api/entities':
    get: entities.get
    post: entities.create

  'api/entities/followed':
    get: followed.fetch
    post: followed.update

  'api/entities/public':
    get: entities.actions

  'api/notifs':
    post: notifs.updateStatus

  'api/cookie':
    post: (req, res, next)->
      whitelist = ['lang']
      {body} = req
      {key, value} = body
      unless key in whitelist
        return error_.bundle res, 'unauthorize cookie setting', 403

      res.cookie key = key, value = value
      _.info result = "cookie set: #{key} = #{value}"
      res.send result

  'api/upload':
    post: upload.post

  'api/upload/delete':
    post: upload.del

  'api/test/public':
    get: (req, res, next)-> res.send 'server: OK'
    post: (req, res, next)->
      if req.body?.label? then _.info(req.body.obj, req.body.label)
      else _.info req.body
      res.send 'thanks!'

  'api/test/public/json':
    get: (req, res, next)-> res.json {server: 'OK'}
    post: (req, res, next)->
      _.info req.body
      res.json {server: 'OK', body: req.body}

  'api/services/public*':
    get: services.get

  'api/data/public*':
    get: data.get

  'api/proxy/public*':
    get: proxy.get

  'api/feedbacks/public':
    get: noGet
    post: feedbacks.post

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