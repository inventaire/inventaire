const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const user_ = __.require('controllers', 'user/lib/user')

module.exports = async (requester, readToken) => {
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
