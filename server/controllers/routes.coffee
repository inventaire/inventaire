index = require "./index"
auth = require "./auth"

module.exports =
  'hello':
    get: index.index

  'auth/login':
    post: auth.login

  'auth/logout':
    post: auth.logout