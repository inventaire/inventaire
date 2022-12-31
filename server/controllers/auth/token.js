import _ from 'builders/utils'
import ActionsControllers from 'lib/actions_controllers'
import token_ from 'controllers/user/lib/token'
import { sanitize, validateSanitization } from 'lib/sanitize/sanitize'
import passport_ from 'lib/passport/passport'
import setLoggedInCookie from './lib/set_logged_in_cookie'

const sanitization = validateSanitization({
  email: {},
  token: {
    length: token_.tokenLength
  }
})

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

export default {
  get: ActionsControllers({
    public: {
      'validation-email': confirmEmailValidity,
      'reset-password': allowPasswordReset
    }
  })
}
