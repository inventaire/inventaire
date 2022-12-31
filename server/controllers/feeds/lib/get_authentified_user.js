import error_ from 'lib/error/error'
import user_ from 'controllers/user/lib/user'

export default async (requester, readToken) => {
  if (requester == null) return null

  return user_.byId(requester)
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
