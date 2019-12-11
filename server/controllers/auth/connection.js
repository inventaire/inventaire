const CONFIG = require('config')
const __ = CONFIG.universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const error_ = __.require('lib', 'error/error')
const passport_ = __.require('lib', 'passport/passport')
const setLoggedInCookie = require('./lib/set_logged_in_cookie')
const { ownerSafeData } = __.require('controllers', 'user/lib/authorized_user_data_pickers')

const sanitization = {
  username: {},
  email: {},
  password: {}
}

const logoutRedirect = (redirect, req, res) => {
  res.clearCookie('loggedIn')
  req.logout()
  res.redirect(redirect)
}

module.exports = {
  // TODO: rate limit to 10 signup per IP per 10 minutes
  signup: (req, res) => {
    sanitize(req, res, sanitization)
    .then(params => {
      const next = loggedIn(req, res)
      passport_.authenticate.localSignup(req, res, next)
    })
    // Only handling sanitization rejected errors,
    // passport_.authenticate, deals with its own errors
    .catch(error_.Handler(req, res))
  },

  login: (req, res) => {
    const sanitization = {
      username: {},
      password: {}
    }
    sanitize(req, res, sanitization)
    .then(params => {
      const next = loggedIn(req, res)
      passport_.authenticate.localLogin(req, res, next)
    })
    // Only handling sanitization rejected errors,
    // passport_.authenticate, deals with its own errors
    .catch(error_.Handler(req, res))
  },

  logoutRedirect,

  logout: logoutRedirect.bind(null, '/')
}

const loggedIn = (req, res) => result => {
  if (result instanceof Error) return error_.handler(req, res, result)

  setLoggedInCookie(res)
  const data = { ok: true }
  // add a 'include-user-data' option to access user data directly from the login request
  // Use case: inventaire-wiki (jingo) login
  // https://github.com/inventaire/jingo/blob/635f5417b7ca5a99bad60b32c1758ccecd0e3afa/lib/auth/local-strategy.js#L26
  if (req.query['include-user-data']) data.user = ownerSafeData(req.user)
  res.json(data)
}
