import { sendValidationEmail } from '#controllers/user/lib/token'
import { newError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
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
