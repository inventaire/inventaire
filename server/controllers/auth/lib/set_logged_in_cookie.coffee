{ cookieMaxAge } = require 'config'

# used to trigger logged in UI on the client-side
module.exports = (res)->
  res.cookie 'loggedIn', true,
    maxAge: cookieMaxAge
