const { cookieMaxAge } = require('config')

// Used to trigger logged in UI on the client-side
module.exports = res => {
  res.cookie('loggedIn', true, { maxAge: cookieMaxAge })
}
