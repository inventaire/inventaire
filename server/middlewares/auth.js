const { secret, cookieMaxAge } = require('config')
const __ = require('config').universalPath

const passport = require('passport')
const passport_ = __.require('lib', 'passport/passport')

const cookieParser = require('cookie-parser')
const session = require('cookie-session')
const sessionParams = {
  maxAge: cookieMaxAge,
  secret,
  // see https://github.com/expressjs/session#resave
  resave: false
}

module.exports = {
  cookieParser: cookieParser(),
  session: session(sessionParams),
  passport: {
    initialize: passport.initialize(),
    session: passport.session({ pauseStream: true })
  },

  basicAuth: (req, res, next) => {
    if (req.headers.authorization == null) return next()
    // TODO: handle response to avoid text/plain 401 response
    // to keep the API consistent on Content-Type
    return passport_.authenticate.basic(req, res, next)
  }
}
