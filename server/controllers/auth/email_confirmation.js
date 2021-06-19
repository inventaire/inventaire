const token_ = require('controllers/user/lib/token')
const error_ = require('lib/error/error')

const sanitization = {}

const controller = async (params, req) => {
  await sendEmailValidation(req.user)
  return { ok: true }
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

module.exports = { sanitization, controller }
