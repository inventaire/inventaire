import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { passwords as pw_ } from '#lib/crypto'
import { error_ } from '#lib/error/error'
import { oneHour, expired } from '#lib/time'
import User from '#models/user'

const db = dbFactory('users')

const sanitization = {
  'current-password': {
    optional: true,
  },
  'new-password': {},
}

const controller = async (params, req) => {
  const { user } = req
  const { currentPassword, newPassword } = params
  const { resetPassword } = user
  await validatePassword({ user, currentPassword, resetPassword })
  await updatePassword(user, newPassword)
  return { ok: true }
}

const validatePassword = async ({ user, currentPassword, resetPassword }) => {
  // classic password update
  if (currentPassword != null) {
    if (!User.validations.password(currentPassword)) {
      throw error_.new('invalid current-password', 400)
    }
    const isValid = await verifyCurrentPassword(user, currentPassword)
    if (!isValid) {
      throw error_.new('invalid current-password', 400)
    }

  // token-based password reset, with expiration date
  } else if (resetPassword != null) {
    if (!_.isNumber(resetPassword)) {
      throw error_.new('invalid resetPassword timestamp', 500)
    }
    await testOpenResetPasswordWindow(resetPassword)
  } else {
    // Known case: a resetPassword request but without a valid reset
    throw error_.new('reset password token expired: request a new token', 403)
  }
}

const verifyCurrentPassword = async (user, currentPassword) => {
  return pw_.verify(user.password, currentPassword)
}

const updatePassword = async (user, newPassword) => {
  const newHash = await pw_.hash(newPassword)
  await updateUserPassword(user._id, user, newHash)
}

const updateUserPassword = (userId, user, newHash) => {
  const updateFn = User.updatePassword.bind(null, user, newHash)
  return db.update(userId, updateFn)
}

const testOpenResetPasswordWindow = async resetPassword => {
  if (expired(resetPassword, oneHour)) {
    throw error_.new('reset password timespan experied', 400)
  }
}

export default {
  sanitization,
  controller,
}
