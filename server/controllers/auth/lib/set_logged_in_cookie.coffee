{ cookieMaxAge } = require 'config'

# used to trigger logged in UI on the client-side
# thus should be httpOnly
module.exports = (res)->
  res.cookie 'loggedIn', true,
    maxAge: cookieMaxAge
