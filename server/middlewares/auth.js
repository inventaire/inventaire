const { name, cookieMaxAge, protocol } = require('config')
const { expired } = require('builders/utils')

const passport = require('passport')
const passport_ = require('lib/passport/passport')

const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const Keygrip = require('keygrip')
const autoRotatedKeys = require('lib/auto_rotated_keys')
const oauthServer = require('controllers/auth/oauth_server')

// See https://github.com/expressjs/cookie-session/#cookie-options
const cookieSessionParams = {
  name: `${name}:session`,
  maxAge: cookieMaxAge,

  // For a list of available algorithms, run `openssl list -digest-algorithms`
  keys: new Keygrip(autoRotatedKeys, 'sha256', 'base64'),

  // See https://developer.mozilla.org/docs/Web/HTTP/Headers/Set-Cookie/SameSite
  // and https://web.dev/samesite-cookies-explained/
  // Using sameSite=strict would break Wikidata OAuth redirection, see https://github.com/inventaire/inventaire/issues/467
  sameSite: 'lax',

  // Expliciting the default values
  secure: protocol === 'https',
  httpOnly: true,
}

module.exports = {
  cookieParser: cookieParser(),
  session: cookieSession(cookieSessionParams),

  // Keys rotation doesn't remove the need to enforce sessions max age as session cookies issued
  // at the beginning of a key life-time wouldn't be invalidated before that key's end-of-life, which is 2*cookieMaxAge
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

  authorizationHeader: async (req, res, next) => {
    const { authorization } = req.headers
    if (authorization == null) {
      next()
    } else if (authorization.startsWith('Basic')) {
      // TODO: handle response to avoid text/plain 401 response
      // to keep the API consistent on content-type
      passport_.authenticate.basic(req, res, next)
    } else if (authorization.startsWith('Bearer')) {
      oauthServer.authenticate(req, res, afterBearerToken(req, res, next))
    } else {
      next()
    }
  }
}

const afterBearerToken = (req, res, next) => err => {
  if (err) return next(err)
  const { oauth } = res.locals
  if (oauth && oauth.token && typeof oauth.token.user === 'object') {
    req.user = oauth.token.user
    res.locals.scope = oauth.token.matchingScopes
  }
  next()
}
