index = require "./index"
auth = require "./auth"
items = require "./items"

module.exports =
  'hello':
    get: index.hello

  'auth/username':
    post: auth.checkUsername

  'auth/login':
    post: auth.login

  'auth/logout':
    post: auth.logout

  'api/items':
    get: items.fetch
    post: items.post

  'api/items/:id':
    put: items.put
    get: items.get
    delete: items.del

  # '*':
  #   get: index.index