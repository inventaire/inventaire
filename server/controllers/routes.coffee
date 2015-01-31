CONFIG = require('config')
_ = CONFIG.root.require('builders', 'utils')

auth = require "./auth"
user = require "./user"
items = require "./items"
users = require "./users"
relations = require "./relations/relations"
entities = require "./entities/entities"
upload = require "./upload"
notifs = require "./notifs"
proxy = require "./proxy"
glob = require "./glob"
log = require "./log"
analytics = require 'no-js-analytics'


# routes structure:
# 1 - api is the default prefix for server-side routes
# 2 - the controller / module name
# 3 - 'public' if the route can be called without a session

routes =
  'api/auth/public/username':
    post: auth.checkUsername

  'api/auth/public/login':
    post: auth.login

  'api/auth/logout':
    post: auth.logout

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
    get: items.fetchLastPublicItems

  'api/items/public/:uri':
    get: items.publicByEntity

  'api/items/public/:username/:suffix':
    get: items.publicByUserAndSuffix

  'api/items/:id':
    put: items.put
    # get: items.get

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

  'api/entities/public':
    get: entities.actions

  'api/notifs':
    post: notifs.updateStatus

  'api/cookie':
    post: (req, res, next)->
      whitelist = ['lang']
      if req.body.key in whitelist
        res.cookie key = req.body.key, value = req.body.value
        _.info result = "cookie set: #{key} = #{value}"
        res.send result
      else _.errorHandler res, 'unauthorize cookie setting', '403'

  'api/upload':
    post: upload.post

  'api/upload/delete':
    post: upload.del

  'api/test':
    get: (req, res, next)-> res.send 'server: OK'
    post: (req, res, next)->
      if req.body?.label? then _.info(req.body.obj, req.body.label)
      else _.info req.body
      res.send 'thanks!'

  'api/test/json':
    get: (req, res, next)-> res.json {server: 'OK'}
    post: (req, res, next)->
      _.info req.body
      res.json {server: 'OK', body: req.body}

  'api/proxy/*':
    get: proxy.get

  'analytics/stats':
    get: (req, res, next)-> res.send(200, analytics.stats())

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