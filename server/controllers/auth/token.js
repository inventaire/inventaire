const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const ActionsControllers = require('lib/actions_controllers')
const token_ = require('controllers/user/lib/token')
const sanitize = require('lib/sanitize/sanitize')
const error_ = require('lib/error/error')
const passport_ = require('lib/passport/passport')
const setLoggedInCookie = require('./lib/set_logged_in_cookie')

const sanitization = {
  email: {},
  token: {
    length: token_.tokenLength
  }
}

const confirmEmailValidity = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => token_.confirmEmailValidity(params.email, params.token))
  .then(redirectValidEmail.bind(null, res, true))
  .catch(redirectValidEmail.bind(null, res, false))
}

const redirectValidEmail = (res, bool, resp) => {
  if (!bool) _.error(resp, 'email validation failed')
  res.redirect(`/?validEmail=${bool}`)
}

// reset password =
//    => start a session with email/token instead of username/pw
//    => redirect to the reset-password page
const allowPasswordReset = (req, res) => {
  sanitize(req, res, sanitization)
  .then(() => passport_.authenticate.resetPassword(req, res, Redirect(res)))
  // Only handling sanitization rejected errors,
  // passport_.authenticate, deals with its own errors
  .catch(error_.Handler(req, res))
}

const Redirect = res => () => {
  setLoggedInCookie(res)
  res.redirect('/login/reset-password')
}

module.exports = {
  get: ActionsControllers({
    public: {
      'validation-email': confirmEmailValidity,
      'reset-password': allowPasswordReset
    }
  })
}
