index = require "./index"
auth = require "./auth"
items = require "./items"
contacts = require "./contacts"

module.exports =
  # keep 'auth' routes for methods not requiring a valid session
  'auth/username':
    post: auth.checkUsername

  'auth/login':
    post: auth.login

  'auth/logout':
    post: auth.logout

  # routes protected by the 'restrict' middleware. cf config.coffee
  'user':
    get: auth.getUser
    put: auth.updateUser

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
