const CONFIG = require('config')
const __ = CONFIG.universalPath
const token_ = __.require('controllers', 'user/lib/token')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')

module.exports = (req, res) => {
  const { user } = req
  if (user == null) {
    return error_.bundle(req, res, 'user not found', 500)
  }

  sendEmailValidation(user)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const sendEmailValidation = async user => {
  const { creationStrategy, validEmail } = user
  if (creationStrategy !== 'local') {
    throw error_.new('wrong authentification creationStrategy', 400)
  }

  if (validEmail) {
    throw error_.new('email was already validated', 400)
  }

  return token_.sendValidationEmail(user)
}
