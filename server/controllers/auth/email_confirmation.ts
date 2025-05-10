import { sendValidationEmail } from '#controllers/user/lib/token'
import { newError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  await sendEmailValidation(req.user)
  return { ok: true }
}

async function sendEmailValidation (user) {
  const { validEmail } = user

  if (validEmail) {
    throw newError('email was already validated', 400)
  }

  return sendValidationEmail(user)
}

export default { sanitization, controller }
