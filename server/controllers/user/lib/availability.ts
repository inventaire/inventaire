import { getUserByEmail, getUserByUsername } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { success } from '#lib/utils/logs'
import userValidations from '#models/validations/user'
import isReservedWord from './is_reserved_word.js'

export async function checkUsernameAvailability (username: string, currentUsername?: string) {
  // If a currentUsername is provided
  // return true if the new username is the same but with a different case
  // (used for username update)
  if (currentUsername) {
    if (username.toLowerCase() === currentUsername.toLowerCase()) return
  }

  if (!userValidations.username(username)) {
    throw newInvalidError('username', username)
  }

  if (isReservedWord(username)) {
    throw newError("reserved words can't be usernames", 400, username)
  }

  return getUserByUsername(username)
  .then(checkAvailability.bind(null, username, 'username'))
}

export async function checkEmailAvailability (email) {
  if (!userValidations.email(email)) {
    throw newInvalidError('email', email)
  }

  return getUserByEmail(email)
  .then(checkAvailability.bind(null, email, 'email'))
}

export const availability_ = {
  username: checkUsernameAvailability,
  email: checkEmailAvailability,
}

const checkAvailability = (value, label, docs) => {
  if (docs.length !== 0) {
    throw newError(`this ${label} is already used`, 400, value)
  }

  success(value, 'available')
  return value
}
