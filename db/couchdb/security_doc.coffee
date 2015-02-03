CONFIG = require 'config'

module.exports = (->
  username = CONFIG.db.username
  unless typeof username is 'string' then throw "bad CONFIG.db.username: #{username}"

  return securityDoc =
    admins:
      names: [username]
    members:
      names: [username]
  )()