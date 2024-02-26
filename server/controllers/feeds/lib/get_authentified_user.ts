import { getUserById } from '#controllers/user/lib/user'
import { newInvalidError } from '#lib/error/pre_filled'

export default async (requester, readToken) => {
  if (requester == null) return null

  return getUserById(requester)
  .catch(formatNotFound(requester))
  .then(validateUserReadToken(readToken))
}

const formatNotFound = requester => err => {
  if (err.statusCode === 404) { err = newInvalidError('requester', requester) }
  throw err
}

const validateUserReadToken = readToken => user => {
  if (user.readToken === readToken) {
    return user
  } else {
    throw newInvalidError('token', readToken)
  }
}
