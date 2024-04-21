import { sendValidationEmail } from '#controllers/user/lib/token'
import { newError } from '#lib/error/error'

const sanitization = {}

async function controller (params, req) {
  await sendEmailValidation(req.user)
  return { ok: true }
}

async function sendEmailValidation (user) {
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
