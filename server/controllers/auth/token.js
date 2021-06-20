const _ = require('builders/utils')
const ActionsControllers = require('lib/actions_controllers')
const token_ = require('controllers/user/lib/token')
const { sanitizeSync } = require('lib/sanitize/sanitize')
const passport_ = require('lib/passport/passport')
const setLoggedInCookie = require('./lib/set_logged_in_cookie')

const sanitization = {
  email: {},
  token: {
    length: token_.tokenLength
  }
}

const confirmEmailValidity = (req, res) => {
  const { email, token } = sanitizeSync(req, res, sanitization)
  token_.confirmEmailValidity(email, token)
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
  sanitizeSync(req, res, sanitization)
  passport_.authenticate.resetPassword(req, res, Redirect(res))
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
