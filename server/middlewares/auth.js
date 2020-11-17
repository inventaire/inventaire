const { name, secret, cookieMaxAge, protocol } = require('config')
const __ = require('config').universalPath
const { expired } = __.require('builders', 'utils')

const passport = require('passport')
const passport_ = __.require('lib', 'passport/passport')

const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const Keygrip = require('keygrip')

// See https://github.com/expressjs/cookie-session/#cookie-options
const cookieSessionParams = {
  name,
  maxAge: cookieMaxAge,

  // For a list of available algorithms, run `openssl list -digest-algorithms`
  keys: new Keygrip([ secret ], 'sha256', 'base64'),

  // See https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite
  // and https://web.dev/samesite-cookies-explained/
  sameSite: 'strict',

  // Expliciting the default values
  secure: protocol === 'https',
  httpOnly: true,
}

module.exports = {
  cookieParser: cookieParser(),
  session: cookieSession(cookieSessionParams),

  enforceSessionMaxAge: (req, res, next) => {
    // As all data on req.session, this timestamp is readable by anyone having access to the request cookies.
    // We can only trust it because of the signature cookie, which ensures that it has not been tampered with
    if (req.session.timestamp) {
      // If the cookie timestamp is older that the maxAge, finish the session
      if (expired(req.session.timestamp, cookieMaxAge)) req.session = null
    } else {
      req.session.timestamp = Date.now()
    }
    next()
  },

  passport: {
    initialize: passport.initialize(),
    session: passport.session({ pauseStream: true })
  },

  basicAuth: (req, res, next) => {
    if (req.headers.authorization == null) {
      next()
    } else {
      // TODO: handle response to avoid text/plain 401 response
      // to keep the API consistent on Content-Type
      passport_.authenticate.basic(req, res, next)
    }
  }
}
