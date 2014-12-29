_ = require('config').root.require('builders', 'utils')

auth = require "./auth"
user = require "./user"
items = require "./items"
users = require "./users"
relations = require "./relations"
entities = require "./entities/entities"
upload = require "./upload"
notifs = require "./notifs"
proxy = require "./proxy"
glob = require "./glob"
analytics = require 'no-js-analytics'

module.exports =
  # keep 'auth' routes for methods not requiring a valid session
  'api/auth/username':
    post: auth.checkUsername

  'api/auth/login':
    post: auth.login

  'api/auth/logout':
    post: auth.logout

  'api/user':
    get: user.getUser
    put: user.updateUser

  # routes protected by the 'restrict' middleware. cf config.coffee
  'api/users':
    get: users.actions

  'api/friends':
    get: users.friendData

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

  'test':
    get: (req, res, next)-> res.send 'server: OK'
    post: (req, res, next)->
      if req.body?.label? then _.info(req.body.obj, req.body.label)
      else _.info req.body
      res.send 'thanks!'

  'test/json':
    get: (req, res, next)-> res.json {server: 'OK'}
    post: (req, res, next)->
      _.info req.body
      res.json {server: 'OK', body: req.body}

  'proxy/*':
    get: proxy.get

  'analytics/stats':
    get: (req, res, next)-> res.send(200, analytics.stats())

  '*':
    get: glob.get
