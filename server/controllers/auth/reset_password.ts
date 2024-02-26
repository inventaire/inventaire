import { sendResetPasswordEmail } from '#controllers/user/lib/token'
import { findUserByEmail } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'

const sanitization = {
  email: {},
}

const controller = async ({ email }) => {
  const user = await findUserByEmail(email)
    .catch(catchEmailNotFoundErr(email))

  await sendResetPasswordEmail(user)

  return { ok: true }
}

const catchEmailNotFoundErr = email => err => {
  if (err.statusCode === 404) throw newError('email not found', 400, email)
  else throw err
}

export default { sanitization, controller }
