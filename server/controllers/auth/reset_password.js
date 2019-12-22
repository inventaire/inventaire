const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const user_ = __.require('controllers', 'user/lib/user')
const { sendResetPasswordEmail } = __.require('controllers', 'user/lib/token')

const sanitization = {
  email: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { email } = params
    return user_.findOneByEmail(email)
    .then(sendResetPasswordEmail)
    .catch(catchEmailNotFoundErr(email))
  })
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const catchEmailNotFoundErr = email => err => {
  if (err.statusCode === 404) throw error_.new('email not found', 400, email)
  else throw err
}
