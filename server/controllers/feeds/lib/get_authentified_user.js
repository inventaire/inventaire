import { getUserById } from '#controllers/user/lib/user'
import { error_ } from '#lib/error/error'

export default async (requester, readToken) => {
  if (requester == null) return null

  return getUserById(requester)
  .catch(formatNotFound(requester))
  .then(validateUserReadToken(readToken))
}

const formatNotFound = requester => err => {
  if (err.statusCode === 404) { err = error_.newInvalid('requester', requester) }
  throw err
}

const validateUserReadToken = readToken => user => {
  if (user.readToken === readToken) {
    return user
  } else {
    throw error_.newInvalid('token', readToken)
  }
}
