import { sendValidationEmail } from '#controllers/user/lib/token'
import { newError } from '#lib/error/error'

const sanitization = {}

const controller = async (params, req) => {
  await sendEmailValidation(req.user)
  return { ok: true }
}

const sendEmailValidation = async user => {
  const { creationStrategy, validEmail } = user
  if (creationStrategy !== 'local') {
    throw newError('wrong authentification creationStrategy', 400)
  }

  if (validEmail) {
    throw newError('email was already validated', 400)
  }

  return sendValidationEmail(user)
}

export default { sanitization, controller }
