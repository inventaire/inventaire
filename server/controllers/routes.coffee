index = require "./index"
auth = require "./auth"
items = require "./items"

module.exports =
  'hello':
    get: index.hello

  'auth/login':
    post: auth.login

  'auth/logout':
    post: auth.logout

  'username/items':
    get: items.fetch
    post: items.post

  'username/items/:id':
    put: items.put
    get: items.get
    delete: items.del

  # '*':
  #   get: index.index