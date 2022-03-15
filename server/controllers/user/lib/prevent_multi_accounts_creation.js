// Preventing several accounts to be created at the same time, given that
// the creation process is considerably slowed when bcrypt is used to hash passwords

const { useSlowPasswordHashFunction } = require('config')
const error_ = require('lib/error/error')
const { normalizeString } = require('lib/utils/base')
const lockTime = useSlowPasswordHashFunction ? 5000 : 500
const lockedUsernames = new Set()
const errMessage = 'an account is already in the process of being created with this username'

module.exports = username => {
  const canonicalUsername = normalizeString(username.toLowerCase())
  if (lockedUsernames.has(canonicalUsername)) {
    throw error_.new(errMessage, 400, { username, canonicalUsername })
  } else {
    lockTemporarily(canonicalUsername)
  }
}

const lockTemporarily = canonicalUsername => {
  lockedUsernames.add(canonicalUsername)
  setTimeout(() => lockedUsernames.delete(canonicalUsername), lockTime)
}
