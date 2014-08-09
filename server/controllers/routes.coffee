index = require "./index"
auth = require "./auth"
items = require "./items"
contacts = require "./contacts"
entities = require "./entities"

module.exports =
  # keep 'auth' routes for methods not requiring a valid session
  'api/auth/username':
    post: auth.checkUsername

  'api/auth/login':
    post: auth.login

  'api/auth/logout':
    post: auth.logout

  'api/auth/user':
    get: auth.getUser
    put: auth.updateUser

  # routes protected by the 'restrict' middleware. cf config.coffee
  'api/users':
    get: contacts.searchByUsername

  'api/contacts':
    get: contacts.followedData

  'api/items':
    get: items.fetch

  'api/items/:id':
    put: items.put
    get: items.get

  'api/items/:id/:rev':
    delete: items.del

  'api/:user/items':
    get: contacts.fetchItems

  'api/:user/items/:id':
    put: items.put
  'api/:user/items/:id/:rev':
    put: items.put
    delete: items.del

  'api/entities/search':
    get: entities.search

  'api/cookie':
    post: (req, res, next)->
      whitelist = ['lang']
      if _.hasValue whitelist, req.body.key
        res.cookie key = req.body.key, value = req.body.value
        _.logBlue result = "cookie set: #{key} = #{value}"
        res.send result
      else _.errorHandler res, 'unauthorize cookie setting', '403'

  'test':
    post: (req, res, next)->
      _.logBlue req.body
      res.send 'thanks!'

  '*':
    get: index.glob