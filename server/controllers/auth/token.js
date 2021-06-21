const _ = require('builders/utils')
const ActionsControllers = require('lib/actions_controllers')
const token_ = require('controllers/user/lib/token')
const { sanitize } = require('lib/sanitize/sanitize')
const passport_ = require('lib/passport/passport')
const setLoggedInCookie = require('./lib/set_logged_in_cookie')

const sanitization = {
  email: {},
  token: {
    length: token_.tokenLength
  }
}

const confirmEmailValidity = async (req, res) => {
  const { email, token } = sanitize(req, res, sanitization)
  try {
    await token_.confirmEmailValidity(email, token)
    res.redirect('/?validEmail=true')
  } catch (err) {
    _.error(err, 'email validation failed')
    res.redirect('/?validEmail=false')
  }
}

// reset password =
//    => start a session with email/token instead of username/pw
//    => redirect to the reset-password page
const allowPasswordReset = (req, res) => {
  sanitize(req, res, sanitization)
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
