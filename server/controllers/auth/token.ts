import { tokenLength, confirmEmailTokenValidity } from '#controllers/user/lib/token'
import ActionsControllers from '#lib/actions_controllers'
import { error_ } from '#lib/error/error'
import passport_ from '#lib/passport/passport'
import { sanitize, validateSanitization } from '#lib/sanitize/sanitize'
import { logError } from '#lib/utils/logs'
import setLoggedInCookie from './lib/set_logged_in_cookie.js'

const sanitization = validateSanitization({
  email: {},
  token: {
    length: tokenLength,
  },
})

const confirmEmailValidity = async (req, res) => {
  assertGetReq(req)
  const { email, token } = sanitize(req, res, sanitization)
  try {
    await confirmEmailTokenValidity(email, token)
    res.redirect('/?validEmail=true')
  } catch (err) {
    logError(err, 'email validation failed')
    res.redirect('/?validEmail=false')
  }
}

// reset password =
//    => start a session with email/token instead of username/pw
//    => redirect to the reset-password page
const allowPasswordReset = (req, res) => {
  assertGetReq(req)
  sanitize(req, res, sanitization)
  passport_.authenticate.resetPassword(req, res, Redirect(res))
}

const Redirect = res => () => {
  setLoggedInCookie(res)
  res.redirect('/login/reset-password')
}

// Express automatically uses `get` controllers to answer `head` requests, unless there is a dedicated `head` controller.
// See http://expressjs.com/en/api.html#app.METHOD
// This is not a problem when, as required by the HTTP standard, a GET request has no other effect than retrieving data
// but in the case of token links, we need to work with link clicks generating nothing but GETs and the need to have effects
// Known problematic case: a HEAD request is made to /api/tokens?action=reset-password to test the connection
// before the real GET request is made, but then the HEAD request already consumed the token.
function assertGetReq ({ method }) {
  if (method !== 'GET') {
    throw error_.new('wrong http method', 400, { method })
  }
}

export default {
  get: ActionsControllers({
    public: {
      'validation-email': confirmEmailValidity,
      'reset-password': allowPasswordReset,
    },
  }),
}
