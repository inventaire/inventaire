import { isNumber } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { hashPassword, verifyPassword } from '#lib/crypto'
import { newError } from '#lib/error/error'
import { oneHour, expired } from '#lib/time'
import { updateUserDocPassword } from '#models/user'
import userValidations from '#models/validations/user'
import type { StringifiedHashedSecretData } from '#types/common'
import type { AuthentifiedReq } from '#types/server'
import type { User, UserId } from '#types/user'

const db = await dbFactory('users')

const sanitization = {
  'current-password': {
    optional: true,
  },
  'new-password': {},
}

async function controller (params, req: AuthentifiedReq) {
  const { user } = req
  const { currentPassword, newPassword } = params
  const { resetPassword } = user
  await validatePassword({ user, currentPassword, resetPassword })
  await updatePassword(user, newPassword)
  return { ok: true }
}

async function validatePassword ({ user, currentPassword, resetPassword }: { user: User, currentPassword: string, resetPassword: EpochTimeStamp }) {
  // classic password update
  if (currentPassword != null) {
    if (!userValidations.password(currentPassword)) {
      throw newError('invalid current-password', 400)
    }
    const isValid = await verifyCurrentPassword(user, currentPassword)
    if (!isValid) {
      throw newError('invalid current-password', 400)
    }

  // token-based password reset, with expiration date
  } else if (resetPassword != null) {
    if (!isNumber(resetPassword)) {
      throw newError('invalid resetPassword timestamp', 500)
    }
    await testOpenResetPasswordWindow(resetPassword)
  } else {
    // Known case: a resetPassword request but without a valid reset
    throw newError('reset password token expired: request a new token', 403)
  }
}

async function verifyCurrentPassword (user: User, currentPassword: string) {
  return verifyPassword(user.password as StringifiedHashedSecretData, currentPassword)
}

async function updatePassword (user: User, newPassword: string) {
  const newHash = await hashPassword(newPassword)
  await updateUserPassword(user._id, newHash)
}

function updateUserPassword (userId: UserId, newHash: StringifiedHashedSecretData) {
  return db.update(userId, doc => updateUserDocPassword(doc, newHash))
}

async function testOpenResetPasswordWindow (resetPassword: EpochTimeStamp) {
  if (expired(resetPassword, oneHour)) {
    throw newError('reset password timespan experied', 400)
  }
}

export default {
  sanitization,
  controller,
}
